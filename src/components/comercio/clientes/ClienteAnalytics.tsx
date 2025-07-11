'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  Target,
  Award,
  Star,
  Heart,
  Gift,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Hash,
  Activity,
  Crown,
  Diamond,
  Trophy,
  UserPlus,
  Receipt,
} from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { subDays } from 'date-fns';

// Componente de métrica avanzada
const AdvancedMetricCard: React.FC<{
  title: string;
  value: string | number;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
}> = ({ 
  title, 
  value, 
  previousValue, 
  icon, 
  color, 
  format = 'number', 
  subtitle,
  onClick 
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const calculateChange = () => {
    if (typeof value !== 'number' || !previousValue) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return change;
  };

  const change = calculateChange();

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        
        {change !== null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            change >= 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

// Componente de segmentación de clientes
const ClienteSegmentation: React.FC<{
  clientes: Cliente[];
}> = ({ clientes }) => {
  const segments = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);

    // Segmentar por valor
    const highValue = clientes.filter(c => c.montoTotalGastado >= 50000);
    const mediumValue = clientes.filter(c => c.montoTotalGastado >= 20000 && c.montoTotalGastado < 50000);
    const lowValue = clientes.filter(c => c.montoTotalGastado < 20000);

    // Segmentar por frecuencia
    const frequent = clientes.filter(c => c.totalCompras >= 10);
    const occasional = clientes.filter(c => c.totalCompras >= 3 && c.totalCompras < 10);
    const rare = clientes.filter(c => c.totalCompras < 3);

    // Segmentar por recencia
    const recent = clientes.filter(c => 
      c.fechaUltimaCompra && c.fechaUltimaCompra.toDate() >= thirtyDaysAgo
    );
    const dormant = clientes.filter(c => 
      c.fechaUltimaCompra && 
      c.fechaUltimaCompra.toDate() < thirtyDaysAgo && 
      c.fechaUltimaCompra.toDate() >= ninetyDaysAgo
    );
    const inactive = clientes.filter(c => 
      !c.fechaUltimaCompra || c.fechaUltimaCompra.toDate() < ninetyDaysAgo
    );

    return {
      byValue: [
        { name: 'Alto Valor', count: highValue.length, color: '#10b981', percentage: (highValue.length / clientes.length) * 100 },
        { name: 'Valor Medio', count: mediumValue.length, color: '#f59e0b', percentage: (mediumValue.length / clientes.length) * 100 },
        { name: 'Bajo Valor', count: lowValue.length, color: '#ef4444', percentage: (lowValue.length / clientes.length) * 100 },
      ],
      byFrequency: [
        { name: 'Frecuentes', count: frequent.length, color: '#8b5cf6', percentage: (frequent.length / clientes.length) * 100 },
        { name: 'Ocasionales', count: occasional.length, color: '#06b6d4', percentage: (occasional.length / clientes.length) * 100 },
        { name: 'Esporádicos', count: rare.length, color: '#6b7280', percentage: (rare.length / clientes.length) * 100 },
      ],
      byRecency: [
        { name: 'Activos', count: recent.length, color: '#10b981', percentage: (recent.length / clientes.length) * 100 },
        { name: 'Inactivos', count: dormant.length, color: '#f59e0b', percentage: (dormant.length / clientes.length) * 100 },
        { name: 'Perdidos', count: inactive.length, color: '#ef4444', percentage: (inactive.length / clientes.length) * 100 },
      ],
    };
  }, [clientes]);

  const SegmentChart: React.FC<{
    title: string;
    segments: Array<{ name: string; count: number; color: string; percentage: number }>;
    icon: React.ReactNode;
  }> = ({ title, segments, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {segments.map((segment, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-medium text-gray-900">{segment.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{segment.count}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${segment.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: segment.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SegmentChart
        title="Por Valor de Compra"
        segments={segments.byValue}
        icon={<DollarSign size={20} className="text-blue-600" />}
      />
      <SegmentChart
        title="Por Frecuencia"
        segments={segments.byFrequency}
        icon={<ShoppingBag size={20} className="text-blue-600" />}
      />
      <SegmentChart
        title="Por Recencia"
        segments={segments.byRecency}
        icon={<Clock size={20} className="text-blue-600" />}
      />
    </div>
  );
};

// Componente de clientes top
const TopClientes: React.FC<{
  clientes: Cliente[];
}> = ({ clientes }) => {
  const [sortBy, setSortBy] = useState<'gasto' | 'compras' | 'frecuencia'>('gasto');

  const sortedClientes = useMemo(() => {
    const sorted = [...clientes].sort((a, b) => {
      switch (sortBy) {
        case 'gasto':
          return b.montoTotalGastado - a.montoTotalGastado;
        case 'compras':
          return b.totalCompras - a.totalCompras;
        case 'frecuencia':
          return b.frecuenciaVisitas - a.frecuenciaVisitas;
        default:
          return 0;
      }
    });
    return sorted.slice(0, 10);
  }, [clientes, sortBy]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="text-yellow-500" size={20} />;
      case 1: return <Award className="text-gray-400" size={20} />;
      case 2: return <Star className="text-amber-600" size={20} />;
      default: return <Hash className="text-gray-400" size={16} />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 1: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 2: return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Trophy size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Top Clientes</h3>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'gasto' | 'compras' | 'frecuencia')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="gasto">Por Gasto Total</option>
          <option value="compras">Por Número de Compras</option>
          <option value="frecuencia">Por Frecuencia</option>
        </select>
      </div>

      <div className="space-y-3">
        {sortedClientes.map((cliente, index) => (
          <motion.div
            key={cliente.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Parent wrapper for all content */}
            <>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(index)}`}>
                {index < 3 ? getRankIcon(index) : index + 1}
              </div>

              <div>
                {cliente.avatar ? (
                  <Image
                    src={cliente.avatar}
                    alt={cliente.nombre}
                    className="w-full h-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <Users size={20} className="text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{cliente.nombre}</p>
                <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
              </div>

              <div className="text-right">
                {sortBy === 'gasto' && (
                  <>
                    <p className="font-bold text-green-600">${cliente.montoTotalGastado.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{cliente.totalCompras} compras</p>
                  </>
                )}
                {sortBy === 'compras' && (
                  <>
                    <p className="font-bold text-blue-600">{cliente.totalCompras} compras</p>
                    <p className="text-sm text-gray-500">${cliente.montoTotalGastado.toLocaleString()}</p>
                  </>
                )}
                {sortBy === 'frecuencia' && (
                  <>
                    <p className="font-bold text-purple-600">{cliente.frecuenciaVisitas} visitas</p>
                    <p className="text-sm text-gray-500">${cliente.montoTotalGastado.toLocaleString()}</p>
                  </>
                )}
              </div>
            </>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente principal de analíticas
export const ClienteAnalytics: React.FC = () => {
  const { clientes, loading, refreshStats } = useClientes();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calcular métricas avanzadas
  const advancedMetrics = useMemo(() => {
    if (!clientes.length) return null;

    const now = new Date();
    const startDate = (() => {
      switch (timeRange) {
        case '7d': return subDays(now, 7);
        case '30d': return subDays(now, 30);
        case '90d': return subDays(now, 90);
        case '1y': return subDays(now, 365);
        default: return subDays(now, 30);
      }
    })();

    // Filtrar clientes por rango de tiempo
    const clientesEnRango = clientes.filter(cliente => 
      cliente.creadoEn.toDate() >= startDate
    );

    // Calcular métricas
    const totalClientes = clientes.length;
    const clientesNuevos = clientesEnRango.length;
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
    const clientesConCompras = clientes.filter(c => c.totalCompras > 0).length;
    
    const totalGastado = clientes.reduce((sum, c) => sum + c.montoTotalGastado, 0);
    const totalCompras = clientes.reduce((sum, c) => sum + c.totalCompras, 0);
    const totalBeneficios = clientes.reduce((sum, c) => sum + c.beneficiosUsados, 0);
    
    const promedioGastoPorCliente = totalClientes > 0 ? totalGastado / totalClientes : 0;
    const promedioComprasPorCliente = totalClientes > 0 ? totalCompras / totalClientes : 0;
    const tasaConversion = totalClientes > 0 ? (clientesConCompras / totalClientes) * 100 : 0;
    const tasaRetencion = totalClientes > 0 ? (clientesActivos / totalClientes) * 100 : 0;
    
    // Calcular ticket promedio
    const ticketPromedio = totalCompras > 0 ? totalGastado / totalCompras : 0;
    
    // Calcular valor de vida del cliente (CLV)
    const clv = promedioGastoPorCliente * (promedioComprasPorCliente / 12) * 24; // Estimación a 2 años
    
    // Calcular frecuencia de compra promedio
    const frecuenciaPromedio = clientes.length > 0 
      ? clientes.reduce((sum, c) => sum + c.frecuenciaVisitas, 0) / clientes.length 
      : 0;

    return {
      totalClientes,
      clientesNuevos,
      clientesActivos,
      clientesConCompras,
      totalGastado,
      totalCompras,
      totalBeneficios,
      promedioGastoPorCliente,
      promedioComprasPorCliente,
      tasaConversion,
      tasaRetencion,
      ticketPromedio,
      clv,
      frecuenciaPromedio,
    };
  }, [clientes, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={28} />
            Analíticas de Clientes
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis detallado del comportamiento y valor de tus clientes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>
          
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={refreshStats}
            loading={loading}
          >
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            leftIcon={showAdvanced ? <EyeOff size={16} /> : <Eye size={16} />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Vista Simple' : 'Vista Avanzada'}
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      {advancedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdvancedMetricCard
            title="Total Clientes"
            value={advancedMetrics.totalClientes}
            icon={<Users size={20} />}
            color="#3b82f6"
            subtitle={`${advancedMetrics.clientesActivos} activos`}
          />
          
          <AdvancedMetricCard
            title="Clientes Nuevos"
            value={advancedMetrics.clientesNuevos}
            icon={<UserPlus size={20} />}
            color="#10b981"
            subtitle={`En ${timeRange === '7d' ? '7 días' : timeRange === '30d' ? '30 días' : timeRange === '90d' ? '90 días' : '1 año'}`}
          />
          
          <AdvancedMetricCard
            title="Ingresos Totales"
            value={advancedMetrics.totalGastado}
            icon={<DollarSign size={20} />}
            color="#8b5cf6"
            format="currency"
            subtitle={`${advancedMetrics.totalCompras} compras`}
          />
          
          <AdvancedMetricCard
            title="Ticket Promedio"
            value={advancedMetrics.ticketPromedio}
            icon={<Receipt size={20} />}
            color="#f59e0b"
            format="currency"
            subtitle="Por transacción"
          />
          
          {showAdvanced && (
            <>
              <AdvancedMetricCard
                title="Valor Vida Cliente"
                value={advancedMetrics.clv}
                icon={<Diamond size={20} />}
                color="#ec4899"
                format="currency"
                subtitle="CLV estimado"
              />
              
              <AdvancedMetricCard
                title="Tasa de Conversión"
                value={advancedMetrics.tasaConversion}
                icon={<Target size={20} />}
                color="#06b6d4"
                format="percentage"
                subtitle="Clientes que compraron"
              />
              
              <AdvancedMetricCard
                title="Tasa de Retención"
                value={advancedMetrics.tasaRetencion}
                icon={<Heart size={20} />}
                color="#ef4444"
                format="percentage"
                subtitle="Clientes activos"
              />
              
              <AdvancedMetricCard
                title="Frecuencia Promedio"
                value={advancedMetrics.frecuenciaPromedio.toFixed(1)}
                icon={<Activity size={20} />}
                color="#84cc16"
                subtitle="Visitas por cliente"
              />
            </>
          )}
        </div>
      )}

      {/* Segmentación de clientes */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <PieChart size={24} className="text-blue-600" />
          Segmentación de Clientes
        </h3>
        <ClienteSegmentation clientes={clientes} />
      </div>

      {/* Top clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopClientes clientes={clientes} />
        
        {/* Métricas adicionales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Métricas de Rendimiento</h3>
          </div>
          
          <div className="space-y-6">
            {advancedMetrics && (
              <>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Gasto Promedio por Cliente</p>
                      <p className="text-sm text-gray-500">Total acumulado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ${advancedMetrics.promedioGastoPorCliente.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} className="text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Compras Promedio por Cliente</p>
                      <p className="text-sm text-gray-500">Número de transacciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {advancedMetrics.promedioComprasPorCliente.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Gift size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Beneficios Utilizados</p>
                      <p className="text-sm text-gray-500">Total de beneficios</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {advancedMetrics.totalBeneficios.toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};