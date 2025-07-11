'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Award,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  Star,
  Zap,
  Target,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useAuth } from '@/hooks/useAuth';
import { BeneficioUso } from '@/types/beneficio';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Interfaces
interface FilterState {
  search: string;
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  status: 'all' | 'valid' | 'invalid';
  comercio: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

interface HistorialStats {
  totalUsos: number;
  ahorroTotal: number;
  ahorroEsteMes: number;
  comerciosUnicos: number;
  beneficioMasUsado: string;
  promedioAhorro: number;
  usosEsteMes: number;
  crecimientoMensual: number;
}

// Utility functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'valido':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'invalido':
      return <XCircle size={16} className="text-red-500" />;
    case 'pendiente':
      return <Clock size={16} className="text-yellow-500" />;
    default:
      return <AlertCircle size={16} className="text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valido':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'invalido':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'pendiente':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getComercioColor = (comercioNombre: string) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
  const index = comercioNombre.length % colors.length;
  return colors[index];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Loading skeleton
const HistorialCardSkeleton = React.memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
));

HistorialCardSkeleton.displayName = 'HistorialCardSkeleton';

// Sidebar personalizado que maneja el logout
const SocioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <SocioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Main component content
const SocioHistorialContent: React.FC = () => {
  const { signOut } = useAuth();
  const { beneficiosUsados, loading, error, refrescar } = useBeneficios();

  // Local state
  const [selectedUso, setSelectedUso] = useState<BeneficioUso | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: 'all',
    status: 'all',
    comercio: '',
    sortBy: 'date_desc'
  });

  // Calculate stats
  const stats = useMemo<HistorialStats>(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const endLastMonth = endOfMonth(lastMonth);

    const usosEsteMes = beneficiosUsados.filter(uso => {
      const fechaUso = typeof uso.fechaUso?.toDate === 'function'
        ? uso.fechaUso.toDate()
        : new Date(uso.fechaUso as unknown as string | number | Date);
      return fechaUso >= thisMonth;
    });

    const usosUltimoMes = beneficiosUsados.filter(uso => {
      const fechaUso = typeof uso.fechaUso?.toDate === 'function'
        ? uso.fechaUso.toDate()
        : new Date(uso.fechaUso as unknown as string | number | Date);
      return fechaUso >= lastMonth && fechaUso <= endLastMonth;
    });

    const ahorroTotal = beneficiosUsados.reduce((total, uso) => total + (uso.montoDescuento || 0), 0);
    const ahorroEsteMes = usosEsteMes.reduce((total, uso) => total + (uso.montoDescuento || 0), 0);

    const comerciosUnicos = new Set(beneficiosUsados.map(uso => uso.comercioId)).size;

    // Beneficio más usado (por ahora usamos un placeholder)
    const beneficioMasUsado = beneficiosUsados.length > 0 ? 'Descuento en Restaurantes' : 'N/A';

    const promedioAhorro = beneficiosUsados.length > 0 ? ahorroTotal / beneficiosUsados.length : 0;

    const crecimientoMensual = usosUltimoMes.length > 0 
      ? Math.round(((usosEsteMes.length - usosUltimoMes.length) / usosUltimoMes.length) * 100)
      : 0;

    return {
      totalUsos: beneficiosUsados.length,
      ahorroTotal,
      ahorroEsteMes,
      comerciosUnicos,
      beneficioMasUsado,
      promedioAhorro,
      usosEsteMes: usosEsteMes.length,
      crecimientoMensual
    };
  }, [beneficiosUsados]);

  // Filter and sort benefits
  const filteredUsos = useMemo(() => {
    let filtered = [...beneficiosUsados];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(uso => 
        (uso.detalles && uso.detalles.toLowerCase().includes(searchLower)) ||
        (uso.comercioNombre && uso.comercioNombre.toLowerCase().includes(searchLower))
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(uso => {
        const fechaUso = typeof uso.fechaUso?.toDate === 'function'
          ? uso.fechaUso.toDate()
          : new Date(uso.fechaUso as unknown as string | number | Date);
        
        switch (filters.dateRange) {
          case 'today':
            return isToday(fechaUso);
          case 'yesterday':
            return isYesterday(fechaUso);
          case 'week':
            return isThisWeek(fechaUso);
          case 'month':
            return isThisMonth(fechaUso);
          default:
            return true;
        }
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      // Map UI filter values to actual status values in data
      const statusMap: Record<string, string[]> = {
        valid: ['usado'],
        invalid: ['cancelado'],
        pendiente: ['pendiente'],
      };
      const allowedStatuses = statusMap[filters.status] || [filters.status];
      filtered = filtered.filter(uso => allowedStatuses.includes(uso.estado));
    }

    // Comercio filter
    if (filters.comercio) {
      filtered = filtered.filter(uso => uso.comercioId === filters.comercio);
    }

    // Sort
    filtered.sort((a, b) => {
      const fechaA = typeof a.fechaUso?.toDate === 'function'
        ? a.fechaUso.toDate()
        : new Date(a.fechaUso as unknown as string | number | Date);
      const fechaB = typeof b.fechaUso?.toDate === 'function'
        ? b.fechaUso.toDate()
        : new Date(b.fechaUso as unknown as string | number | Date);

      switch (filters.sortBy) {
        case 'date_desc':
          return fechaB.getTime() - fechaA.getTime();
        case 'date_asc':
          return fechaA.getTime() - fechaB.getTime();
        case 'amount_desc':
          return (b.montoDescuento || 0) - (a.montoDescuento || 0);
        case 'amount_asc':
          return (a.montoDescuento || 0) - (b.montoDescuento || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [beneficiosUsados, filters]);

  // Get unique comercios for filter
  const comercios = useMemo(() => {
    const uniqueComercios = beneficiosUsados.reduce((acc, uso) => {
      if (uso.comercioId && uso.comercioNombre && !acc.find(c => c.id === uso.comercioId)) {
        acc.push({ id: uso.comercioId, nombre: uso.comercioNombre });
      }
      return acc;
    }, [] as { id: string; nombre: string }[]);
    return uniqueComercios;
  }, [beneficiosUsados]);

  // Handlers
  const handleViewDetails = useCallback((uso: BeneficioUso) => {
    setSelectedUso(uso);
    setDetailModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refrescar();
      toast.success('Historial actualizado');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Error al actualizar');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refrescar, refreshing]);

  const handleExport = useCallback(() => {
    // Implementar exportación
    toast.success('Exportando historial...');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      dateRange: 'all',
      status: 'all',
      comercio: '',
      sortBy: 'date_desc'
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Error state
  if (error) {
    return (
      <DashboardLayout
        activeSection="historial"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar historial</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} leftIcon={<RefreshCw size={16} />}>
              Reintentar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="historial"
      sidebarComponent={(props) => (
        <SocioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-6 md:mb-8" variants={itemVariants}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Historial de Usos
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Registro completo de todos tus beneficios canjeados
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={handleExport}
              >
                Exportar
              </Button>
              <Button
                size="sm"
                leftIcon={<BarChart3 size={16} />}
              >
                Ver Estadísticas
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <History size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{stats.totalUsos}</div>
                <div className="text-sm font-semibold text-gray-600">Total de Usos</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-blue-600" />
              <span className="text-blue-600 font-semibold">{stats.usosEsteMes} este mes</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{formatCurrency(stats.ahorroTotal)}</div>
                <div className="text-sm font-semibold text-gray-600">Ahorro Total</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="text-emerald-600 font-semibold">{formatCurrency(stats.ahorroEsteMes)} este mes</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <Store size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{stats.comerciosUnicos}</div>
                <div className="text-sm font-semibold text-gray-600">Comercios Únicos</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Target size={14} className="text-purple-600" />
              <span className="text-purple-600 font-semibold">Diversidad de uso</span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            whileHover={{ y: -4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Award size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{formatCurrency(stats.promedioAhorro)}</div>
                <div className="text-sm font-semibold text-gray-600">Promedio por Uso</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Zap size={14} className="text-amber-600" />
              <span className="text-amber-600 font-semibold">Eficiencia de ahorro</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Filter Section */}
        <motion.div 
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg mb-6 md:mb-8"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                <Filter size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Filtros y Búsqueda</h3>
                <p className="text-sm text-gray-600">Encuentra registros específicos en tu historial</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por comercio o detalles..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                icon={<Search size={16} />}
              />
            </div>

            <div>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterState['dateRange'] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="yesterday">Ayer</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
            </div>

            <div>
              <select
                value={filters.comercio}
                onChange={(e) => setFilters(prev => ({ ...prev, comercio: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Todos los comercios</option>
                {comercios.map(comercio => (
                  <option key={comercio.id} value={comercio.id}>{comercio.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="date_desc">Más recientes</option>
                <option value="date_asc">Más antiguos</option>
                <option value="amount_desc">Mayor ahorro</option>
                <option value="amount_asc">Menor ahorro</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Historial List */}
        <motion.div
          className="space-y-4"
          variants={itemVariants}
        >
          <AnimatePresence>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <HistorialCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredUsos.length > 0 ? (
              filteredUsos.map((uso, index) => (
                <motion.div
                  key={uso.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden p-6"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Comercio Avatar */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ background: getComercioColor(uso.comercioNombre || 'Comercio') }}
                    >
                      {(uso.comercioNombre || 'C').charAt(0)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {uso.comercioNombre || 'Comercio'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {uso.detalles || 'Beneficio utilizado'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600 mb-1">
                            {formatCurrency(uso.montoDescuento || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(
                              typeof uso.fechaUso?.toDate === 'function'
                                ? uso.fechaUso.toDate()
                                : new Date(uso.fechaUso as unknown as string | number | Date),
                              'dd/MM/yyyy HH:mm',
                              { locale: es }
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {format(
                            typeof uso.fechaUso?.toDate === 'function'
                              ? uso.fechaUso.toDate()
                              : new Date(uso.fechaUso as unknown as string | number | Date),
                            'EEEE, dd MMMM yyyy',
                            { locale: es }
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          Centro Comercial
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium
                            ${getStatusColor(uso.estado || 'valido')}
                          `}>
                            {getStatusIcon(uso.estado || 'valido')}
                            <span className="capitalize">{uso.estado || 'Válido'}</span>
                          </div>
                          
                          {uso.montoDescuento && uso.montoDescuento > 100 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                              <Star size={12} />
                              Gran Ahorro
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye size={16} />}
                            onClick={() => handleViewDetails(uso)}
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<ArrowUpRight size={16} />}
                          >
                            Repetir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="text-center py-12"
                variants={itemVariants}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <History size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filters.search || filters.dateRange !== 'all' || filters.comercio
                    ? 'No se encontraron registros'
                    : 'No has usado beneficios aún'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {filters.search || filters.dateRange !== 'all' || filters.comercio
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Cuando uses un beneficio, aparecerá aquí con todos los detalles'
                  }
                </p>
                {filters.search || filters.dateRange !== 'all' || filters.comercio ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                ) : (
                  <Button onClick={() => window.location.href = '/dashboard/socio/beneficios'}>
                    Explorar Beneficios
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Detail Modal */}
        <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
          <DialogContent className="max-w-2xl">
            {selectedUso && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ background: getComercioColor(selectedUso.comercioNombre || 'Comercio') }}
                    >
                      {(selectedUso.comercioNombre || 'C').charAt(0)}
                    </div>
                    Detalles del Uso
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header del uso */}
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {selectedUso.comercioNombre || 'Comercio'}
                      </h3>
                      <p className="text-gray-600 mb-3">{selectedUso.detalles || 'Beneficio utilizado'}</p>
                      <div className="flex flex-wrap gap-2">
                        <div className={`
                          flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium
                          ${getStatusColor(selectedUso.estado || 'valido')}
                        `}>
                          {getStatusIcon(selectedUso.estado || 'valido')}
                          <span className="capitalize">{selectedUso.estado || 'Válido'}</span>
                        </div>
                        {selectedUso.montoDescuento && selectedUso.montoDescuento > 100 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                            <Star size={12} />
                            Gran Ahorro
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {formatCurrency(selectedUso.montoDescuento || 0)}
                      </div>
                      <div className="text-sm text-gray-500">Ahorro obtenido</div>
                    </div>
                  </div>

                  {/* Información detallada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-blue-600" />
                        <h5 className="font-semibold text-blue-900">Fecha y Hora</h5>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {format(
                          typeof selectedUso.fechaUso?.toDate === 'function'
                            ? selectedUso.fechaUso.toDate()
                            : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                          'dd MMMM yyyy',
                          { locale: es }
                        )}
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        {format(
                          typeof selectedUso.fechaUso?.toDate === 'function'
                            ? selectedUso.fechaUso.toDate()
                            : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                          'HH:mm',
                          { locale: es }
                        )} hs
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Store size={16} className="text-purple-600" />
                        <h5 className="font-semibold text-purple-900">Comercio</h5>
                      </div>
                      <p className="text-lg font-bold text-purple-700">
                        {selectedUso.comercioNombre || 'Comercio'}
                      </p>
                      <p className="text-sm text-purple-600 mt-1">
                        Centro Comercial
                      </p>
                    </div>
                  </div>

                  {/* Información adicional */}
                  {selectedUso.detalles && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Detalles adicionales</h5>
                      <p className="text-gray-700">{selectedUso.detalles}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                    Cerrar
                  </Button>
                  <Button leftIcon={<ArrowUpRight size={16} />}>
                    Repetir Beneficio
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function SocioHistorialPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="historial"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw size={32} className="text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cargando historial...</h3>
              <p className="text-gray-500">Preparando tu historial de beneficios</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <SocioHistorialContent />
    </Suspense>
  );
}