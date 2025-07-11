'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  BarChart3,
  Activity,
  Clock,
  DollarSign,
  Zap,
  ArrowUpRight,
  Shield,
  Minus
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
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface OverviewDashboardProps {
  onNavigate: (section: string) => void;
  onAddMember: () => void;
}

interface ActivityLog {
  id: string;
  type: 'member_added' | 'member_updated' | 'payment_received' | 'backup_completed' | 'import_completed' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: Date | null;
  storageUsed: number;
  storageLimit: number;
  uptime: number;
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
      member_added: <UserPlus className="w-4 h-4" />,
      member_updated: <Users className="w-4 h-4" />,
      payment_received: <DollarSign className="w-4 h-4" />,
      backup_completed: <Shield className="w-4 h-4" />,
      import_completed: <Activity className="w-4 h-4" />,
      system_alert: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    const colors = {
      member_added: 'bg-emerald-500',
      member_updated: 'bg-blue-500',
      payment_received: 'bg-green-500',
      backup_completed: 'bg-purple-500',
      import_completed: 'bg-sky-500',
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
            <p className="text-slate-600 text-sm">Últimas acciones del sistema</p>
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
              <p className="text-slate-400 text-sm mt-1">Las acciones del sistema aparecerán aquí</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simplified System Status Card
const SystemStatusCard: React.FC<{
  health: SystemHealth;
  loading: boolean;
}> = ({ health, loading }) => {
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

  const storagePercentage = (health.storageUsed / health.storageLimit) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Estado del Sistema</h3>
            <p className="text-slate-600 text-sm">Monitoreo en tiempo real</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
          {getStatusText(health.status)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Uptime */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-700 font-medium text-sm">Tiempo de actividad</span>
            <span className="text-slate-900 font-semibold text-sm">
              {loading ? '...' : `${health.uptime}%`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                health.uptime > 99 ? 'bg-emerald-500' : 
                health.uptime > 95 ? 'bg-amber-500' : 
                'bg-red-500'
              }`}
              style={{ width: loading ? '0%' : `${health.uptime}%` }}
            />
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-700 font-medium text-sm">Almacenamiento</span>
            <span className="text-slate-900 font-semibold text-sm">
              {loading ? '...' : `${storagePercentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                storagePercentage > 80 ? 'bg-red-500' : 
                storagePercentage > 60 ? 'bg-amber-500' : 
                'bg-emerald-500'
              }`}
              style={{ width: loading ? '0%' : `${storagePercentage}%` }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-1">
            {loading ? '...' : `${(health.storageUsed / 1024).toFixed(1)} GB de ${(health.storageLimit / 1024).toFixed(1)} GB utilizados`}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <p className="text-blue-700 text-xs font-medium mb-1">Último Respaldo</p>
            <p className="text-blue-900 font-semibold text-xs">
              {loading ? '...' : health.lastBackup ? format(health.lastBackup, 'dd/MM HH:mm') : 'Nunca'}
            </p>
          </div>

          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="text-emerald-700 text-xs font-medium mb-1">Respuesta</p>
            <p className="text-emerald-900 font-semibold text-xs">
              {loading ? '...' : `${health.responseTime}ms`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Quick Stats Component
const QuickStats: React.FC<{
  totalSocios: number;
  activosSocios: number;
  totalComercios: number;
  loading: boolean;
}> = ({ totalSocios, activosSocios, totalComercios, loading }) => {
  const stats = [
    {
      label: 'Total Socios',
      value: totalSocios,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Socios Activos',
      value: activosSocios,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-emerald-500'
    },
    {
      label: 'Comercios Activos',
      value: totalComercios,
      icon: <Store className="w-5 h-5" />,
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
const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onAddMember
}) => {
  const { user } = useAuth();
  const { stats, loading: sociosLoading } = useSocios();
  const { stats: comerciosStats, loading: comerciosLoading } = useComercios();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const systemHealth = useMemo<SystemHealth>(() => ({
    status: 'good',
    lastBackup: subDays(new Date(), 1),
    storageUsed: 1024,
    storageLimit: 5120,
    uptime: 99.9,
    responseTime: 120,
  }), []);
  const [loading, setLoading] = useState(true);

  // Fetch real-time activities from Firebase
  useEffect(() => {
    if (!user) return;

    const activitiesRef = collection(db, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      where('asociacionId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    const memberGrowth = activities.filter(a => a.type === 'member_added').length;
    const growthRate = stats.total > 0 ? (memberGrowth / stats.total) * 100 : 0;
    const retentionRate = stats.total > 0 ? (stats.activos / stats.total) * 100 : 0;

    return {
      growthRate: Math.round(growthRate * 100) / 100,
      retentionRate: Math.round(retentionRate * 100) / 100,
    };
  }, [activities, stats]);

  // System health calculation
  const healthStatus = useMemo(() => {
    const storagePercentage = (systemHealth.storageUsed / systemHealth.storageLimit) * 100;
    const backupAge = systemHealth.lastBackup 
      ? (Date.now() - systemHealth.lastBackup.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (storagePercentage > 90 || backupAge > 7 || systemHealth.uptime < 95) {
      return 'critical';
    } else if (storagePercentage > 75 || backupAge > 3 || systemHealth.uptime < 98) {
      return 'warning';
    } else if (systemHealth.uptime > 99.5 && backupAge < 1) {
      return 'excellent';
    }
    return 'good';
  }, [systemHealth]);

  const kpiMetrics = useMemo(() => [
    {
      title: 'Total Socios',
      value: stats.total.toLocaleString(),
      change: growthMetrics.growthRate,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      subtitle: 'Miembros registrados',
      trend: growthMetrics.growthRate > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate('socios'),
      loading: sociosLoading
    },
    {
      title: 'Socios Activos',
      value: stats.activos.toLocaleString(),
      change: growthMetrics.retentionRate,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-emerald-500',
      subtitle: 'Estado vigente',
      trend: growthMetrics.retentionRate > 80 ? 'up' as const : growthMetrics.retentionRate > 60 ? 'neutral' as const : 'down' as const,
      onClick: () => onNavigate('socios'),
      loading: sociosLoading
    },
    {
      title: 'Socios Vencidos',
      value: stats.vencidos.toString(),
      change: stats.vencidos > 0 ? -((stats.vencidos / Math.max(stats.total, 1)) * 100) : 0,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-red-500',
      subtitle: 'Requieren atención',
      trend: stats.vencidos > stats.total * 0.2 ? 'up' as const : 'down' as const,
      onClick: () => onNavigate('socios'),
      loading: sociosLoading
    }
  ], [stats, growthMetrics, sociosLoading, onNavigate]);

  const quickActions = [
    {
      title: 'Nuevo Socio',
      description: 'Agregar nuevo miembro',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      onClick: onAddMember,
    },
    {
      title: 'Analytics',
      description: 'Ver métricas detalladas',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => onNavigate('analytics'),
    }
  ];

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
              onClick={onAddMember}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Nuevo Socio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        totalSocios={stats.total}
        activosSocios={stats.activos}
        totalComercios={comerciosStats.comerciosActivos}
        loading={sociosLoading || comerciosLoading}
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
            onViewAll={() => onNavigate('notificaciones')}
          />
        </div>
        <div>
          <SystemStatusCard
            health={{ ...systemHealth, status: healthStatus }}
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  );
};

export { OverviewDashboard };