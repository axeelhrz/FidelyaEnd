'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { useBeneficiosAsociacion } from '@/hooks/useBeneficios';
import { Beneficio, CATEGORIAS_BENEFICIOS } from '@/types/beneficio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface BeneficiosManagementProps {
  onCreateBeneficio?: () => void;
}

export const BeneficiosManagement: React.FC<BeneficiosManagementProps> = ({
  onCreateBeneficio
}) => {
  const {
    beneficios,
    loading,
    error,
    estadisticasRapidas,
    eliminarBeneficio,
    cambiarEstadoBeneficio,
    refrescar
  } = useBeneficiosAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBeneficio, setSelectedBeneficio] = useState<Beneficio | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtrar beneficios
  const filteredBeneficios = useMemo(() => {
    return beneficios.filter(beneficio => {
      const matchesSearch = searchTerm === '' || 
        beneficio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.comercioNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || beneficio.categoria === selectedCategory;
      const matchesStatus = selectedStatus === '' || beneficio.estado === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [beneficios, searchTerm, selectedCategory, selectedStatus]);

  // Manejar eliminación de beneficio
  const handleDeleteBeneficio = async (beneficioId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este beneficio?')) return;
    
    setActionLoading(beneficioId);
    try {
      await eliminarBeneficio(beneficioId);
      toast.success('Beneficio eliminado exitosamente');
    } catch {
      toast.error('Error al eliminar el beneficio');
    } finally {
      setActionLoading(null);
    }
  };

  // Manejar cambio de estado
  const handleChangeStatus = async (beneficioId: string, newStatus: 'activo' | 'inactivo') => {
    setActionLoading(beneficioId);
    try {
      await cambiarEstadoBeneficio(beneficioId, newStatus);
      toast.success(`Beneficio ${newStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
    } catch {
      toast.error('Error al cambiar el estado del beneficio');
    } finally {
      setActionLoading(null);
    }
  };

  // Obtener color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'text-green-600 bg-green-100';
      case 'inactivo': return 'text-gray-600 bg-gray-100';
      case 'vencido': return 'text-red-600 bg-red-100';
      case 'agotado': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="w-4 h-4" />;
      case 'inactivo': return <Clock className="w-4 h-4" />;
      case 'vencido': return <AlertCircle className="w-4 h-4" />;
      case 'agotado': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando beneficios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar beneficios</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refrescar}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Beneficios</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticasRapidas.total}</p>
            </div>
            <Gift className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{estadisticasRapidas.activos}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div>
            <p className="text-sm text-gray-600">Usos Totales</p>
            <p className="text-2xl font-bold text-blue-600">{estadisticasRapidas.usados}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div>
            <p className="text-sm text-gray-600">Ahorro Total</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${estadisticasRapidas.ahorroTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Controles y filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar beneficios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters 
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <button
              onClick={onCreateBeneficio}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Beneficio
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {CATEGORIAS_BENEFICIOS.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="vencido">Vencido</option>
                    <option value="agotado">Agotado</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedStatus('');
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de beneficios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredBeneficios.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {beneficios.length === 0 ? 'No hay beneficios' : 'No se encontraron beneficios'}
            </h3>
            <p className="text-gray-600 mb-4">
              {beneficios.length === 0 
                ? 'Crea tu primer beneficio para comenzar'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            {beneficios.length === 0 && (
              <button
                onClick={onCreateBeneficio}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Crear Primer Beneficio
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBeneficios.map((beneficio) => (
              <motion.div
                key={beneficio.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {beneficio.titulo}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(beneficio.estado)}`}>
                            {getStatusIcon(beneficio.estado)}
                            {beneficio.estado.charAt(0).toUpperCase() + beneficio.estado.slice(1)}
                          </span>
                          {beneficio.destacado && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Destacado
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {beneficio.descripcion}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {beneficio.comercioNombre}
                          </div>
                          <div className="flex items-center gap-1">
                            <Gift className="w-4 h-4" />
                            {beneficio.categoria}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {beneficio.usosActuales} usos
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Vence: {format(beneficio.fechaFin.toDate(), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {beneficio.tipo === 'porcentaje' ? `${beneficio.descuento}%` : 
                           beneficio.tipo === 'monto_fijo' ? `$${beneficio.descuento}` : 
                           'Gratis'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {beneficio.tipo === 'porcentaje' ? 'Descuento' : 
                           beneficio.tipo === 'monto_fijo' ? 'Descuento fijo' : 
                           'Producto gratis'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menú de acciones */}
                  <div className="ml-4">
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setSelectedBeneficio(beneficio);
                              setShowDetailModal(true);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalles
                          </button>
                          
                          <button
                            onClick={() => handleChangeStatus(
                              beneficio.id, 
                              beneficio.estado === 'activo' ? 'inactivo' : 'activo'
                            )}
                            disabled={actionLoading === beneficio.id}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === beneficio.id ? (
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {beneficio.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteBeneficio(beneficio.id)}
                            disabled={actionLoading === beneficio.id}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === beneficio.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {showDetailModal && selectedBeneficio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Detalles del Beneficio
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedBeneficio.titulo}
                    </h3>
                    <p className="text-gray-600">
                      {selectedBeneficio.descripcion}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comercio
                      </label>
                      <p className="text-gray-900">{selectedBeneficio.comercioNombre}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                      </label>
                      <p className="text-gray-900">{selectedBeneficio.categoria}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de descuento
                      </label>
                      <p className="text-gray-900">
                        {selectedBeneficio.tipo === 'porcentaje' ? 'Porcentaje' : 
                         selectedBeneficio.tipo === 'monto_fijo' ? 'Monto fijo' : 
                         'Producto gratis'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descuento
                      </label>
                      <p className="text-gray-900">
                        {selectedBeneficio.tipo === 'porcentaje' ? `${selectedBeneficio.descuento}%` : 
                         selectedBeneficio.tipo === 'monto_fijo' ? `$${selectedBeneficio.descuento}` : 
                         'Gratis'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de inicio
                      </label>
                      <p className="text-gray-900">
                        {format(selectedBeneficio.fechaInicio.toDate(), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de fin
                      </label>
                      <p className="text-gray-900">
                        {format(selectedBeneficio.fechaFin.toDate(), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usos actuales
                      </label>
                      <p className="text-gray-900">
                        {selectedBeneficio.usosActuales}
                        {selectedBeneficio.limiteTotal && ` / ${selectedBeneficio.limiteTotal}`}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBeneficio.estado)}`}>
                        {getStatusIcon(selectedBeneficio.estado)}
                        {selectedBeneficio.estado.charAt(0).toUpperCase() + selectedBeneficio.estado.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedBeneficio.condiciones && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condiciones
                      </label>
                      <p className="text-gray-600 text-sm">
                        {selectedBeneficio.condiciones}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
