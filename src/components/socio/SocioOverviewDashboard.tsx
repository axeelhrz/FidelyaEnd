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
  User,
  Star,
  Target,
  Calendar,
  CheckCircle,
  Trophy
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
import { useBeneficios } from '@/hooks/useBeneficios';
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
  level: string;
}

// Modern KPI Card Component
const ModernKPICard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  gradient: string;
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
  gradient,
  subtitle,
  trend = 'neutral',
  onClick,
  loading = false,
  badge
}) => {
  return (
    <div
      className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:bg-white/90"
      onClick={onClick}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} />
      
      {/* Badge */}
      {badge && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {badge}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${gradient} group-hover:scale-110 transition-transform duration-300`}>
          {loading ? (
            <RefreshCw className="w-7 h-7 animate-spin" />
          ) : (
            <div className="relative">
              {icon}
              <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center space-x-2">
          {trend === 'up' && (
            <div className="flex items-center space-x-1 bg-emerald-100 px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-600">+{change}%</span>
            </div>
          )}
          {trend === 'down' && (
            <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-600">{change}%</span>
            </div>
          )}
          {trend === 'neutral' && (
            <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full">
              <Minus className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-500">{change}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
          {loading ? '...' : value}
        </p>
        {subtitle && (
          <p className="text-sm text-slate-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Arrow */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
      </div>
    </div>
  );
};

// Modern Activity Timeline Component
const ModernActivityTimeline: React.FC<{
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

  const getActivityGradient = (type: ActivityLog['type']) => {
    const gradients = {
      benefit_used: 'bg-gradient-to-r from-emerald-500 to-green-500',
      profile_updated: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      level_up: 'bg-gradient-to-r from-purple-500 to-pink-500',
      achievement_earned: 'bg-gradient-to-r from-amber-500 to-orange-500',
      system_alert: 'bg-gradient-to-r from-red-500 to-rose-500',
    };
    return gradients[type] || 'bg-gradient-to-r from-slate-500 to-gray-500';
  };

  const formatActivityTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd/MM HH:mm', { locale: es });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Actividad Reciente</h3>
            <p className="text-slate-600">Tus últimas acciones y logros</p>
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            Ver todo
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-r-blue-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50/50 transition-all duration-300 hover:shadow-md"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${getActivityGradient(activity.type)} group-hover:scale-110 transition-transform duration-300`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  {activity.title}
                </p>
                <p className="text-slate-600 mt-1">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-bold text-lg">No hay actividad reciente</p>
              <p className="text-slate-400 mt-2">Comienza a usar beneficios para ver tu actividad</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Modern Socio Status Card
const ModernSocioStatusCard: React.FC<{
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
      case 'excellent': return 'text-emerald-600 bg-gradient-to-r from-emerald-100 to-green-100';
      case 'good': return 'text-blue-600 bg-gradient-to-r from-blue-100 to-cyan-100';
      case 'warning': return 'text-amber-600 bg-gradient-to-r from-amber-100 to-yellow-100';
      case 'critical': return 'text-red-600 bg-gradient-to-r from-red-100 to-rose-100';
      default: return 'text-slate-600 bg-gradient-to-r from-slate-100 to-gray-100';
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
      case 'active': return 'text-emerald-600 bg-gradient-to-r from-emerald-100 to-green-100';
      case 'expired': return 'text-red-600 bg-gradient-to-r from-red-100 to-rose-100';
      case 'pending': return 'text-amber-600 bg-gradient-to-r from-amber-100 to-yellow-100';
      default: return 'text-slate-600 bg-gradient-to-r from-slate-100 to-gray-100';
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
      case 'Bronze': return <Award className="w-5 h-5" />;
      case 'Silver': return <Star className="w-5 h-5" />;
      case 'Gold': return <Target className="w-5 h-5" />;
      case 'Platinum': return <Zap className="w-5 h-5" />;
      case 'Diamond': return <Shield className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getNivelGradient = (nivel: string) => {
    switch (nivel) {
      case 'Bronze': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'Silver': return 'bg-gradient-to-r from-gray-400 to-slate-500';
      case 'Gold': return 'bg-gradient-to-r from-yellow-400 to-amber-500';
      case 'Platinum': return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      case 'Diamond': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-500';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Estado del Socio</h3>
            <p className="text-slate-600">Tu información de membresía</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-2xl font-bold shadow-lg ${getStatusColor(health.status)}`}>
          {getStatusText(health.status)}
        </div>
      </div>

      <div className="space-y-6">
        {/* Membership Status */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-700 font-bold">Membresía</p>
              <p className="text-slate-500 text-sm font-medium">Socio #{socio?.numeroSocio}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-xl font-bold shadow-md ${getMembershipStatusColor(health.membershipStatus)}`}>
            {getMembershipStatusText(health.membershipStatus)}
          </div>
        </div>

        {/* Level Progress */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${getNivelGradient(nivel.nivel)}`}>
                {getNivelIcon(nivel.nivel)}
              </div>
              <span className="text-slate-700 font-bold text-lg">Nivel {nivel.nivel}</span>
            </div>
            <span className="text-slate-600 font-bold">{nivel.puntos} / {nivel.puntosParaProximoNivel} pts</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-3 mb-3 shadow-inner">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-lg"
              style={{ width: loading ? '0%' : `${(nivel.puntos / nivel.puntosParaProximoNivel) * 100}%` }}
            />
          </div>
          
          <p className="text-slate-500 font-medium">
            {nivel.puntosParaProximoNivel - nivel.puntos} puntos para {nivel.proximoNivel}
          </p>
        </div>

        {/* Benefits This Month */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-700 font-bold">Beneficios Este Mes</p>
              <p className="text-emerald-900 text-2xl font-black">
                {loading ? '...' : health.benefitsUsedThisMonth}
              </p>
            </div>
            <div className="text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
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
    loading: socioLoading
  } = useSocioProfile();
  
  // CAMBIO PRINCIPAL: Usar el hook de beneficios para obtener datos consistentes
  const { 
    beneficiosUsados, 
    estadisticasRapidas, 
    loading: beneficiosLoading 
  } = useBeneficios();
  
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
      puntos: Math.floor(estadisticasRapidas.usados * 10),
      puntosParaProximoNivel: 1000,
      proximoNivel: 'Silver',
    }
  }), [socio, user, estadisticasRapidas.usados]);

  // Enhanced stats usando datos de beneficios
  const enhancedStats = useMemo(() => {
    const creadoEnDate = profileData.creadoEn instanceof Timestamp
      ? profileData.creadoEn.toDate()
      : profileData.creadoEn;
    const tiempoComoSocio = creadoEnDate ? differenceInDays(new Date(), creadoEnDate) : 0;
    
    return {
      beneficiosUsados: estadisticasRapidas.usados || 0,
      tiempoComoSocio,
      beneficiosEsteMes: estadisticasRapidas.ahorroEsteMes > 0 ? 
        beneficiosUsados.filter(uso => {
          const fechaUso = uso.fechaUso.toDate();
          const ahora = new Date();
          return fechaUso.getMonth() === ahora.getMonth() && fechaUso.getFullYear() === ahora.getFullYear();
        }).length : 0,
    };
  }, [estadisticasRapidas, profileData.creadoEn, beneficiosUsados]);

  // Calculate socio health
  const socioHealth = useMemo<SocioHealth>(() => {
    const membershipStatus = profileData.estado === 'activo' ? 'active' : 
                           profileData.estado === 'vencido' ? 'expired' : 'pending';
    const benefitsUsedThisMonth = enhancedStats.beneficiosEsteMes;
    
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    
    if (membershipStatus === 'expired') {
      status = 'critical';
    } else if (membershipStatus === 'pending') {
      status = 'warning';
    } else if (benefitsUsedThisMonth > 5) {
      status = 'excellent';
    }

    return {
      status,
      membershipStatus,
      benefitsUsedThisMonth,
      level: profileData.nivel.nivel,
    };
  }, [profileData, enhancedStats]);

  // Fetch real-time activities from Firebase - ACTUALIZADO para usar beneficio_usos
  useEffect(() => {
    if (!user) return;

    const activitiesRef = collection(db, 'beneficio_usos');
    const activitiesQuery = query(
      activitiesRef,
      where('socioId', '==', user.uid),
      orderBy('fechaUso', 'desc'),
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
          timestamp: data.fechaUso || Timestamp.now(),
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
    
    // Calculate growth rates (mock data for now)
    const benefitsGrowth = beneficiosUsados > 0 ? 15 : 0;

    return {
      benefitsGrowth,
    };
  }, [enhancedStats]);

  const kpiMetrics = useMemo(() => [
    {
      title: 'Beneficios Usados',
      value: enhancedStats.beneficiosUsados.toLocaleString(),
      change: growthMetrics.benefitsGrowth,
      icon: <Gift className="w-7 h-7" />,
      gradient: 'bg-gradient-to-r from-emerald-500 to-green-500',
      subtitle: 'Total acumulado',
      trend: growthMetrics.benefitsGrowth > 0 ? 'up' as const : 'neutral' as const,
      onClick: () => onNavigate?.('historial'),
      loading: beneficiosLoading
    },
    {
      title: 'Nivel Actual',
      value: profileData.nivel.nivel,
      change: 0,
      icon: <Trophy className="w-7 h-7" />,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
      subtitle: `${profileData.nivel.puntos} puntos`,
      trend: 'neutral' as const,
      onClick: () => onNavigate?.('perfil'),
      loading: socioLoading
    },
    {
      title: 'Días como Socio',
      value: enhancedStats.tiempoComoSocio.toString(),
      change: 0,
      icon: <Calendar className="w-7 h-7" />,
      gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      subtitle: 'Tiempo de membresía',
      trend: 'neutral' as const,
      onClick: () => onNavigate?.('perfil'),
      loading: socioLoading
    }
  ], [enhancedStats, growthMetrics, profileData.nivel, socioLoading, beneficiosLoading, onNavigate]);

  const quickActions = [
    {
      title: 'Validar Beneficio',
      description: 'Escanear QR',
      icon: <QrCode className="w-6 h-6" />,
      gradient: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600',
      onClick: onQuickScan,
    },
    {
      title: 'Mis Beneficios',
      description: 'Ver disponibles',
      icon: <Gift className="w-6 h-6" />,
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      onClick: () => onNavigate?.('beneficios'),
    }
  ];

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div>
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center shadow-xl">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">
                  Vista General
                </h1>
                <p className="text-xl text-slate-600 font-medium">
                  Panel de beneficios • {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => onNavigate?.('beneficios')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <Eye className="w-6 h-6" />
              <span>Ver Beneficios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {kpiMetrics.map((metric, index) => (
          <ModernKPICard key={index} {...metric} />
        ))}
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <ModernActivityTimeline
            activities={activities}
            loading={loading}
            onViewAll={() => onNavigate?.('historial')}
          />
        </div>
        <div>
          <ModernSocioStatusCard
            health={socioHealth}
            loading={socioLoading}
            socio={socio ?? {}}
            nivel={profileData.nivel}
          />
        </div>
      </div>

      {/* Modern Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-6 rounded-3xl text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${action.gradient}`}
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {action.icon}
                </div>
                <h4 className="font-bold text-lg mb-2">{action.title}</h4>
                <p className="opacity-90">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modern Performance Summary */}
      <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-3xl p-8 border border-emerald-200 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Tu Progreso Este Mes
              </h3>
              <p className="text-slate-600 font-medium">
                Resumen de tu actividad como socio
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center bg-white/50 rounded-2xl p-4">
              <p className="text-3xl font-black text-emerald-600">
                {enhancedStats.beneficiosEsteMes}
              </p>
              <p className="text-sm text-slate-600 font-bold">Beneficios Este Mes</p>
            </div>
            
            <div className="text-center bg-white/50 rounded-2xl p-4">
              <p className="text-3xl font-black text-blue-600">
                {profileData.nivel.nivel}
              </p>
              <p className="text-sm text-slate-600 font-bold">Nivel Actual</p>
            </div>
            
            <div className="text-center bg-white/50 rounded-2xl p-4">
              <p className="text-3xl font-black text-purple-600">
                {enhancedStats.tiempoComoSocio}
              </p>
              <p className="text-sm text-slate-600 font-bold">Días como Socio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SocioOverviewDashboard };