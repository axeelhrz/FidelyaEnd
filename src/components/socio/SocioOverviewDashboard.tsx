'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gift,
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
  Award,
  Eye,
  DollarSign,
  Store,
  User,
  Star,
  Target
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
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface SocioOverviewDashboardProps {
  onNavigate?: (section: string) => void;
  onQuickScan?: () => void;
}

interface ActivityLog {
  id: string;
  type: 'benefit_used' | 'profile_updated' | 'level_up' | 'achievement_earned' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}

interface SocioHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  membershipStatus: 'active' | 'expired' | 'pending';
  benefitsUsedThisMonth: number;
  savingsThisMonth: number;
  level: string;
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
      benefit_used: <Gift className="w-4 h-4" />,
      profile_updated: <User className="w-4 h-4" />,
      level_up: <Star className="w-4 h-4" />,
      achievement_earned: <Award className="w-4 h-4" />,
      system_alert: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    const colors = {
      benefit_used: 'bg-emerald-500',
      profile_updated: 'bg-blue-500',
      level_up: 'bg-purple-500',
      achievement_earned: 'bg-amber-500',
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
            <p className="text-slate-600 text-sm">Tus últimas acciones y logros</p>
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
              <p className="text-slate-400 text-sm mt-1">Comienza a usar beneficios para ver tu actividad</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simplified Socio Status Card
const SocioStatusCard: React.FC<{
  health: SocioHealth;
  loading: boolean;
  socio: {
    numeroSocio?: string;
    nombre?: string;
    estado?: string;
  };
  nivel: {
    nivel: string;
    puntos: number;
    puntosParaProximoNivel: number;
    proximoNivel: string;
  };
}> = ({ health, loading, socio, nivel }) => {
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
      case 'good': return 'Activo';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-amber-600 bg-amber-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getMembershipStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'expired': return 'Vencido';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'Bronze': return <Award className="w-4 h-4" />;
      case 'Silver': return <Star className="w-4 h-4" />;
      case 'Gold': return <Target className="w-4 h-4" />;
      case 'Platinum': return <Zap className="w-4 h-4" />;
      case 'Diamond': return <Shield className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Bronze': return 'text-amber-600 bg-amber-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      case 'Diamond': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
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
            <h3 className="text-lg font-semibold text-slate-900">Estado del Socio</h3>
            <p className="text-slate-600 text-sm">Tu información de membresía</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
          {getStatusText(health.status)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Membership Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-slate-700 font-medium text-sm">Membresía</p>
              <p className="text-slate-500 text-xs">Socio #{socio?.numeroSocio}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMembershipStatusColor(health.membershipStatus)}`}>
            {getMembershipStatusText(health.membershipStatus)}
          </div>
        </div>

        {/* Level Progress */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${getNivelColor(nivel.nivel)}`}>
                {getNivelIcon(nivel.nivel)}
              </div>
              <span className="text-slate-700 font-medium text-sm">Nivel {nivel.nivel}</span>
            </div>
            <span className="text-slate-600 text-xs">{nivel.puntos} / {nivel.puntosParaProximoNivel} pts</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: loading ? '0%' : `${(nivel.puntos / nivel.puntosParaProximoNivel) * 100}%` }}
            />
          </div>
          
          <p className="text-slate-500 text-xs">
            {nivel.puntosParaProximoNivel - nivel.puntos} puntos para {nivel.proximoNivel}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <p className="text-emerald-700 text-xs font-medium mb-1">Beneficios Este Mes</p>
            <p className="text-emerald-900 font-semibold text-xs">
              {loading ? '...' : health.benefitsUsedThisMonth}
            </p>
          </div>

          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-700 text-xs font-medium mb-1">Ahorrado Este Mes</p>
            <p className="text-green-900 font-semibold text-xs">
              {loading ? '...' : `$${health.savingsThisMonth.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Quick Stats Component
const QuickStats: React.FC<{
  beneficiosUsados: number;
  ahorroTotal: number;
  comerciosVisitados: number;
  loading: boolean;
}> = ({ beneficiosUsados, ahorroTotal, comerciosVisitados, loading }) => {
  const stats = [
    {
      label: 'Beneficios Usados',
      value: beneficiosUsados,
      icon: <Gift className="w-5 h-5" />,
      color: 'bg-emerald-500'
    },
    {
      label: 'Ahorro Total',
      value: `$${ahorroTotal.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-500'
    },
    {
      label: 'Comercios Visitados',
      value: comerciosVisitados,
      icon: <Store className="w-5 h-5" />,
      color: 'bg-blue-500'
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
                {loading ? '...' : stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Component
const SocioOverviewDashboard: React.FC<SocioOverviewDashboardProps> = ({
  onNavigate,
  onQuickScan
}) => {
  const { user } = useAuth();
  const { 
    socio, 
    estadisticas, 
    loading: socioLoading
  } = useSocioProfile();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile data with safe fallbacks
  const profileData = useMemo(() => ({
    nombre: socio?.nombre || user?.nombre || 'Socio',
    estado: socio?.estado || 'activo',
    creadoEn: socio?.creadoEn || new Date(),
    numeroSocio: socio?.numeroSocio || '',
    nivel: {
      nivel: 'Bronze' as const,
      puntos: Math.floor(estadisticas.totalValidaciones * 10),
      puntosParaProximoNivel: 1000,
      proximoNivel: 'Silver',
    }
  }), [socio, user, estadisticas]);

  // Enhanced stats with real Firebase data
  const enhancedStats = useMemo(() => {
    const creadoEnDate = profileData.creadoEn instanceof Timestamp
      ? profileData.creadoEn.toDate()
      : profileData.creadoEn;
    const tiempoComoSocio = creadoEnDate ? differenceInDays(new Date(), creadoEnDate) : 0;
    
    return {
      beneficiosUsados: estadisticas.totalValidaciones || 0,
      ahorroTotal: estadisticas.ahorroTotal || 0,
      comerciosVisitados: estadisticas.comerciosFavoritos?.length || 0,
      tiempoComoSocio,
      beneficiosEsteMes: estadisticas.validacionesPorMes?.[0]?.validaciones || 0,
      ahorroEsteMes: estadisticas.validacionesPorMes?.[0]?.ahorro || 0,
    };
  }, [estadisticas, profileData.creadoEn]);

  // Calculate socio health
  const socioHealth = useMemo<SocioHealth>(() => {
    const membershipStatus = profileData.estado === 'activo' ? 'active' : 
                           profileData.estado === 'vencido' ? 'expired' : 'pending';
    const benefitsUsedThisMonth = enhancedStats.beneficiosEsteMes;
    const savingsThisMonth = enhancedStats.ahorroEsteMes;
    
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    
    if (membershipStatus === 'expired') {
      status = 'critical';
    } else if (membershipStatus === 'pending') {
      status = 'warning';
    } else if (benefitsUsedThisMonth > 5 && savingsThisMonth > 1000) {
      status = 'excellent';
    }

    return {
      status,
      membershipStatus,
      benefitsUsedThisMonth,
      savingsThisMonth,
      level: profileData.nivel.nivel,
    };
  }, [profileData, enhancedStats]);

  // Fetch real-time activities from Firebase
  useEffect(() => {
    if (!user) return;

    const activitiesRef = collection(db, 'validaciones');
    const activitiesQuery = query(
      activitiesRef,
      where('socioId', '==', user.uid),
      orderBy('fechaValidacion', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'benefit_used' as const,
          title: 'Beneficio utilizado',
          description: `${data.beneficioTitulo} en ${data.comercioNombre}`,
          timestamp: data.fechaValidacion || Timestamp.now(),
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
    const beneficiosUsados = enhancedStats.beneficiosUsados;
    const ahorroTotal = enhancedStats.ahorroTotal;
    const comerciosVisitados = enhancedStats.comerciosVisitados;
    
    // Calculate growth rates (mock data for now)
    const benefitsGrowth = beneficiosUsados > 0 ? 15 : 0;
    const savingsGrowth = ahorroTotal > 0 ? 12 : 0;
    const commerceGrowth = comerciosVisitados > 0 ? 8 : 0;

    return {
      benefitsGrowth,
      savingsGrowth,
      commerceGrowth,
    };
  }, [enhancedStats]);

  const kpiMetrics = useMemo(() => [
    {
      title: 'Beneficios Usados',
      value: enhancedStats.beneficiosUsados.toLocaleString(),
      change: growthMetrics.benefitsGrowth,
      icon: <Gift className="w-6 h-6" />,
      color: 'bg-emerald-500',
      subtitle: 'Total acumulado',
      trend: growthMetrics.benefitsGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('historial'),
      loading: socioLoading
    },
    {
      title: 'Ahorro Total',
      value: `$${enhancedStats.ahorroTotal.toLocaleString()}`,
      change: growthMetrics.savingsGrowth,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
      subtitle: 'En beneficios',
      trend: growthMetrics.savingsGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('historial'),
      loading: socioLoading
    },
    {
      title: 'Comercios Visitados',
      value: enhancedStats.comerciosVisitados.toString(),
      change: growthMetrics.commerceGrowth,
      icon: <Store className="w-6 h-6" />,
      color: 'bg-blue-500',
      subtitle: 'Establecimientos únicos',
      trend: growthMetrics.commerceGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('beneficios'),
      loading: socioLoading
    }
  ], [enhancedStats, growthMetrics, socioLoading, onNavigate]);

  const quickActions = [
    {
      title: 'Validar Beneficio',
      description: 'Escanear QR',
      icon: <QrCode className="w-5 h-5" />,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      onClick: onQuickScan,
    },
    {
      title: 'Mis Beneficios',
      description: 'Ver disponibles',
      icon: <Gift className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => onNavigate?.('beneficios'),
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
                  Panel de beneficios • {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
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
              onClick={() => onNavigate?.('beneficios')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
            >
              <Eye className="w-5 h-5" />
              <span>Ver Beneficios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        beneficiosUsados={enhancedStats.beneficiosUsados}
        ahorroTotal={enhancedStats.ahorroTotal}
        comerciosVisitados={enhancedStats.comerciosVisitados}
        loading={socioLoading}
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
            onViewAll={() => onNavigate?.('historial')}
          />
        </div>
        <div>
          <SocioStatusCard
            health={socioHealth}
            loading={socioLoading}
            socio={socio ?? {}}
            nivel={profileData.nivel}
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

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Tu Progreso Este Mes
              </h3>
              <p className="text-sm text-slate-600">
                Resumen de tu actividad como socio
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {enhancedStats.beneficiosEsteMes}
                </p>
                <p className="text-xs text-slate-600">Beneficios Este Mes</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${enhancedStats.ahorroEsteMes.toLocaleString()}
                </p>
                <p className="text-xs text-slate-600">Ahorrado</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {profileData.nivel.nivel}
                </p>
                <p className="text-xs text-slate-600">Nivel Actual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SocioOverviewDashboard };
