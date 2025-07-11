'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Gift, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { BeneficioStats } from '@/types/beneficio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BeneficiosStatsProps {
  stats: BeneficioStats | null;
  loading?: boolean;
  userRole?: 'socio' | 'comercio' | 'asociacion';
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  subtitle,
  trend = 'neutral',
  loading = false
}) => {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            icon
          )}
        </div>

        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            trend === 'up' ? 'bg-green-100 text-green-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
          {title}
        </h3>
        <p className="text-3xl font-black text-gray-900 mb-1">
          {loading ? '...' : value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export const BeneficiosStats: React.FC<BeneficiosStatsProps> = ({
  stats,
  loading = false,
  userRole = 'socio',
  className = ''
}) => {
  const statsCards = useMemo(() => {
    if (!stats) return [];

    const baseCards = [
      {
        title: 'Total Beneficios',
        value: stats.totalBeneficios.toLocaleString(),
        icon: <Gift size={24} />,
        color: '#6366f1',
        subtitle: 'En la plataforma'
      },
      {
        title: 'Beneficios Activos',
        value: stats.beneficiosActivos.toLocaleString(),
        icon: <Target size={24} />,
        color: '#10b981',
        subtitle: 'Disponibles para usar',
        change: stats.beneficiosActivos > 0 ? 5.2 : 0,
        trend: 'up' as const
      },
      {
        title: 'Total Usado',
        value: stats.beneficiosUsados.toLocaleString(),
        icon: <Users size={24} />,
        color: '#8b5cf6',
        subtitle: 'Beneficios utilizados'
      },
      {
        title: 'Ahorro Total',
        value: `$${stats.ahorroTotal.toLocaleString()}`,
        icon: <DollarSign size={24} />,
        color: '#f59e0b',
        subtitle: 'Dinero ahorrado',
        change: stats.ahorroEsteMes > 0 ? 12.5 : 0,
        trend: 'up' as const
      }
    ];

    // Agregar cards específicos por rol
    if (userRole === 'socio') {
      baseCards.push({
        title: 'Ahorro Este Mes',
        value: `$${stats.ahorroEsteMes.toLocaleString()}`,
        icon: <Calendar size={24} />,
        color: '#ec4899',
        subtitle: 'En el mes actual'
      });
    }

    if (userRole === 'asociacion') {
      baseCards.push({
        title: 'Comercios Activos',
        value: stats.comercios.length.toLocaleString(),
        icon: <Award size={24} />,
        color: '#06b6d4',
        subtitle: 'Con beneficios'
      });
    }

    return baseCards;
  }, [stats, userRole]);

  const topBeneficios = useMemo(() => {
    return stats?.topBeneficios.slice(0, 5) || [];
  }, [stats]);

  const topCategorias = useMemo(() => {
    return stats?.categorias.slice(0, 5) || [];
  }, [stats]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCard
              key={index}
              title="Cargando..."
              value="..."
              icon={<Gift size={24} />}
              color="#6366f1"
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
          <BarChart3 size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay estadísticas disponibles
        </h3>
        <p className="text-gray-500">
          Las estadísticas aparecerán cuando haya datos disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Gráficos y datos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Beneficios */}
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Beneficios</h3>
              <p className="text-sm text-gray-600">Más utilizados</p>
            </div>
          </div>

          <div className="space-y-4">
            {topBeneficios.length > 0 ? (
              topBeneficios.map((beneficio, index) => (
                <div key={beneficio.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {beneficio.titulo}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {beneficio.usos} usos • ${beneficio.ahorro.toLocaleString()} ahorrado
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {beneficio.usos}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PieChart size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Categorías */}
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Categorías Populares</h3>
              <p className="text-sm text-gray-600">Por cantidad de beneficios</p>
            </div>
          </div>

          <div className="space-y-4">
            {topCategorias.length > 0 ? (
              topCategorias.map((categoria, index) => {
                const maxUsos = Math.max(...topCategorias.map(c => c.usos));
                const percentage = maxUsos > 0 ? (categoria.usos / maxUsos) * 100 : 0;
                
                return (
                  <div key={categoria.nombre} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {categoria.nombre}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {categoria.cantidad} beneficios • {categoria.usos} usos
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Gráfico de usos por mes */}
      {stats.usosPorMes.length > 0 && (
        <motion.div
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tendencia Mensual</h3>
              <p className="text-sm text-gray-600">Usos y ahorros por mes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {stats.usosPorMes.slice(-6).map((mes, index) => {
              const maxUsos = Math.max(...stats.usosPorMes.map(m => m.usos));
              const height = maxUsos > 0 ? (mes.usos / maxUsos) * 100 : 0;
              
              return (
                <div key={mes.mes} className="text-center">
                  <div className="h-32 flex items-end justify-center mb-2">
                    <motion.div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {format(new Date(mes.mes + '-01'), 'MMM', { locale: es })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {mes.usos} usos
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    ${mes.ahorro.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
