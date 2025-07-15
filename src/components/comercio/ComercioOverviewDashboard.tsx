'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  BarChart3,
  Activity,
  Clock,
  Zap,
  ArrowUpRight,
  Shield,
  Minus,
  Calendar,
  Award,
  Eye,
  Download
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio';
import { useBeneficios } from '@/hooks/useBeneficios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface ComercioOverviewDashboardProps {
  onNavigate?: (section: string) => void;
}

interface ActivityLog {
  id: string;
  type: 'validation_completed' | 'benefit_used' | 'qr_generated' | 'profile_updated' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}

interface ComercioHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  qrCodeStatus: 'active' | 'expired' | 'missing';
  benefitsActive: number;
  validationsToday: number;
  responseTime: number;
}

// Simplified KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  loading?: boolean;
  badge?: string;
}> = ({
  title,
  value,
  change,
  icon,
  color,
  subtitle,
  trend = 'neutral',
  onClick,
  loading = false,
  badge
}) => {
  return (
    <div
      className="relative bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4">
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            {badge}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${color}`}
        >
          {loading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            icon
          )}
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center space-x-1">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          {trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400" />}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-emerald-500' : 
            trend === 'down' ? 'text-red-500' : 
            'text-slate-400'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900">
          {loading ? '...' : value}
        </p>
        {subtitle && (
          <p className="text-sm text-slate-600">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
};

// Simplified Activity Timeline Component
const ActivityTimeline: React.FC<{
  activities: ActivityLog[];
  loading: boolean;
  onViewAll?: () => void;
}> = ({ activities, loading, onViewAll }) => {
  const getActivityIcon = (type: ActivityLog['type']) => {
    const icons = {
      validation_completed: <CheckCircle className="w-4 h-4" />,
      benefit_used: <Award className="w-4 h-4" />,
      qr_generated: <QrCode className="w-4 h-4" />,
      profile_updated: <Users className="w-4 h-4" />,
      system_alert: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    const colors = {
      validation_completed: 'bg-emerald-500',
      benefit_used: 'bg-blue-500',
      qr_generated: 'bg-purple-500',
      profile_updated: 'bg-sky-500',
      system_alert: 'bg-red-500',
    };
    return colors[type] || 'bg-slate-500';
  };

  const formatActivityTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd/MM HH:mm', { locale: es });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Actividad Reciente</h3>
            <p className="text-slate-600 text-sm">Últimas validaciones y acciones</p>
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Ver todo
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">
                  {activity.title}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No hay actividad reciente</p>
              <p className="text-slate-400 text-sm mt-1">Las validaciones aparecerán aquí</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simplified Comercio Status Card
const ComercioStatusCard: React.FC<{
  health: ComercioHealth;
  loading: boolean;
  comercio: {
    qrCode?: string;
    nombreComercio?: string;
    // Add other properties as needed
  };
  onGenerateQR?: () => void;
}> = ({ health, loading, comercio, onGenerateQR }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600 bg-emerald-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-amber-600 bg-amber-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Operativo';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  const getQRStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-100';
      case 'expired': return 'text-amber-600 bg-amber-100';
      case 'missing': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getQRStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'expired': return 'Expirado';
      case 'missing': return 'Faltante';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Estado del Comercio</h3>
            <p className="text-slate-600 text-sm">Monitoreo en tiempo real</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
          {getStatusText(health.status)}
        </div>
      </div>

      <div className="space-y-4">
        {/* QR Code Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <QrCode className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-slate-700 font-medium text-sm">Código QR</p>
              <p className="text-slate-500 text-xs">Estado de validación</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getQRStatusColor(health.qrCodeStatus)}`}>
            {getQRStatusText(health.qrCodeStatus)}
          </div>
        </div>

        {/* QR Code Display */}
        {comercio?.qrCode ? (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <Image
              src={comercio.qrCode}
              alt="QR Code"
              width={120}
              height={120}
              className="w-30 h-30 mx-auto mb-3"
            />
            <div className="flex space-x-2">
              <button
                onClick={onGenerateQR}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {loading ? 'Regenerando...' : 'Regenerar'}
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = comercio.qrCode ?? '';
                  link.download = `qr-${comercio.nombreComercio}.png`;
                  link.click();
                }}
                className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
              >
                <Download className="w-4 h-4 inline mr-1" />
                Descargar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 text-sm mb-3">No tienes código QR generado</p>
            <button
              onClick={onGenerateQR}
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar QR'}
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Award className="w-4 h-4 text-white" />
            </div>
            <p className="text-blue-700 text-xs font-medium mb-1">Beneficios Activos</p>
            <p className="text-blue-900 font-semibold text-xs">
              {loading ? '...' : health.benefitsActive}
            </p>
          </div>

          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="text-emerald-700 text-xs font-medium mb-1">Validaciones Hoy</p>
            <p className="text-emerald-900 font-semibold text-xs">
              {loading ? '...' : health.validationsToday}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Quick Stats Component
const QuickStats: React.FC<{
  validacionesHoy: number;
  validacionesMes: number;
  clientesUnicos: number;
  loading: boolean;
}> = ({ validacionesHoy, validacionesMes, clientesUnicos, loading }) => {
  const stats = [
    {
      label: 'Validaciones Hoy',
      value: validacionesHoy,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Validaciones del Mes',
      value: validacionesMes,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-emerald-500'
    },
    {
      label: 'Clientes Únicos',
      value: clientesUnicos,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-slate-900">
                {loading ? '...' : stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Component
const ComercioOverviewDashboard: React.FC<ComercioOverviewDashboardProps> = ({
  onNavigate
}) => {
  const { user } = useAuth();
  const { comercio, stats, loading: comercioLoading, generateQRCode } = useComercio();
  const { stats: beneficiosStats } = useBeneficios();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate comercio health
  const comercioHealth = useMemo<ComercioHealth>(() => {
    const qrCodeStatus = comercio?.qrCode ? 'active' : 'missing';
    const benefitsActive = beneficiosStats?.activos || 0;
    const validationsToday = stats?.validacionesHoy || 0;
    
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    
    if (qrCodeStatus === 'missing' || benefitsActive === 0) {
      status = 'warning';
    } else if (validationsToday > 10 && benefitsActive > 3) {
      status = 'excellent';
    }

    return {
      status,
      qrCodeStatus,
      benefitsActive,
      validationsToday,
      responseTime: 120,
    };
  }, [comercio, beneficiosStats, stats]);

  // Fetch real-time activities from Firebase
  useEffect(() => {
    if (!user) return;

    const activitiesRef = collection(db, 'validaciones');
    const activitiesQuery = query(
      activitiesRef,
      where('comercioId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'validation_completed' as const,
          title: 'Validación completada',
          description: `Beneficio validado para ${data.socioNombre || 'cliente'}`,
          timestamp: data.timestamp || Timestamp.now(),
          metadata: data
        };
      }) as ActivityLog[];
      
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    const validacionesHoy = stats?.validacionesHoy || 0;
    const validacionesMes = stats?.validacionesMes || 0;
    const clientesUnicos = stats?.clientesUnicos || 0;
    
    // Calculate growth rates (mock data for now)
    const dailyGrowth = validacionesHoy > 0 ? 15 : 0;
    const monthlyGrowth = validacionesMes > 0 ? 8 : 0;
    const clientGrowth = clientesUnicos > 0 ? 12 : 0;

    return {
      dailyGrowth,
      monthlyGrowth,
      clientGrowth,
    };
  }, [stats]);

  const kpiMetrics = useMemo(() => [
    {
      title: 'Validaciones Hoy',
      value: stats?.validacionesHoy?.toLocaleString() || '0',
      change: growthMetrics.dailyGrowth,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-500',
      subtitle: 'Beneficios validados',
      trend: growthMetrics.dailyGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('validaciones'),
      loading: comercioLoading
    },
    {
      title: 'Validaciones del Mes',
      value: stats?.validacionesMes?.toLocaleString() || '0',
      change: growthMetrics.monthlyGrowth,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-emerald-500',
      subtitle: 'Total mensual',
      trend: growthMetrics.monthlyGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('analytics'),
      loading: comercioLoading
    },
    {
      title: 'Clientes Únicos',
      value: stats?.clientesUnicos?.toString() || '0',
      change: growthMetrics.clientGrowth,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500',
      subtitle: 'Este mes',
      trend: growthMetrics.clientGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('clientes'),
      loading: comercioLoading
    }
  ], [stats, growthMetrics, comercioLoading, onNavigate]);

  const quickActions = [
    {
      title: 'Analytics',
      description: 'Ver métricas detalladas',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => onNavigate?.('analytics'),
    }
  ];

  const handleGenerateQR = async () => {
    await generateQRCode();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Vista General
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Panel de control • {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => onNavigate?.('analytics')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
            >
              <Eye className="w-5 h-5" />
              <span>Ver Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        validacionesHoy={stats?.validacionesHoy || 0}
        validacionesMes={stats?.validacionesMes || 0}
        clientesUnicos={stats?.clientesUnicos || 0}
        loading={comercioLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiMetrics.map((metric, index) => (
          <KPICard key={index} {...metric} />
        ))}
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTimeline
            activities={activities}
            loading={loading}
            onViewAll={() => onNavigate?.('validaciones')}
          />
        </div>
        <div>
          <ComercioStatusCard
            health={comercioHealth}
            loading={comercioLoading}
            comercio={comercio ?? {}}
            onGenerateQR={handleGenerateQR}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-4 rounded-xl text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${action.color}`}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  {action.icon}
                </div>
                <h4 className="font-medium mb-1">{action.title}</h4>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Rendimiento del Mes
              </h3>
              <p className="text-sm text-slate-600">
                Resumen de tu actividad comercial
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {beneficiosStats?.activos || 0}
                </p>
                <p className="text-xs text-slate-600">Beneficios Activos</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats?.validacionesMes || 0}
                </p>
                <p className="text-xs text-slate-600">Validaciones</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {stats?.clientesUnicos || 0}
                </p>
                <p className="text-xs text-slate-600">Clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ComercioOverviewDashboard };