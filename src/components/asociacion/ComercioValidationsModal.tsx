'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileText,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Gift,
  DollarSign,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Validacion {
  id: string;
  socioNombre: string;
  socioEmail: string;
  beneficioTitulo: string;
  beneficioDescripcion: string;
  tipoDescuento: 'porcentaje' | 'monto_fijo';
  descuento: number;
  montoOriginal: number;
  montoFinal: number;
  estado: 'exitosa' | 'fallida' | 'pendiente';
  fechaValidacion: Date;
  metodoPago?: string;
  notas?: string;
}

interface ComercioValidationsModalProps {
  open: boolean;
  onClose: () => void;
  comercio: {
    id: string;
    nombreComercio: string;
  } | null;
  onLoadValidations: (
    comercioId: string,
    filters?: {
      fechaInicio?: Date;
      fechaFin?: Date;
      estado?: string;
      socio?: string;
    },
    limit?: number
  ) => Promise<{
    validaciones: Validacion[];
    total: number;
    stats: {
      totalValidaciones: number;
      exitosas: number;
      fallidas: number;
      montoTotal: number;
      ahorroTotal: number;
    };
  }>;
  loading?: boolean;
}

export const ComercioValidationsModal: React.FC<ComercioValidationsModalProps> = ({
  open,
  onClose,
  comercio,
  onLoadValidations,
}) => {
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [stats, setStats] = useState({
    totalValidaciones: 0,
    exitosas: 0,
    fallidas: 0,
    montoTotal: 0,
    ahorroTotal: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Cargar validaciones cuando se abre el modal
  const loadValidations = React.useCallback(async () => {
    if (!comercio) return;

    setLoadingData(true);
    try {
      const filters: {
        fechaInicio?: Date;
        fechaFin?: Date;
        estado?: string;
        socio?: string;
      } = {};
      
      if (fechaInicio) filters.fechaInicio = new Date(fechaInicio);
      if (fechaFin) filters.fechaFin = new Date(fechaFin);
      if (selectedEstado) filters.estado = selectedEstado;
      if (searchTerm) filters.socio = searchTerm;

      const result = await onLoadValidations(comercio.id, filters, 100);
      setValidaciones(result.validaciones);
      setStats(result.stats);
    } catch (error) {
      console.error('Error loading validations:', error);
    } finally {
      setLoadingData(false);
    }
  }, [comercio, fechaInicio, fechaFin, selectedEstado, searchTerm, onLoadValidations]);

  useEffect(() => {
    if (open && comercio) {
      loadValidations();
    }
  }, [open, comercio, loadValidations]);

  // Filtrar validaciones localmente
  const validacionesFiltradas = validaciones.filter(validacion => {
    const matchesSearch = !searchTerm || 
      validacion.socioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validacion.socioEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validacion.beneficioTitulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !selectedEstado || validacion.estado === selectedEstado;
    
    return matchesSearch && matchesEstado;
  });

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fallida':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pendiente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return 'bg-green-100 text-green-800';
      case 'fallida':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    if (validacionesFiltradas.length === 0) return;

    const csvContent = [
      ['Fecha', 'Socio', 'Email', 'Beneficio', 'Descuento', 'Monto Original', 'Monto Final', 'Estado', 'Método Pago'].join(','),
      ...validacionesFiltradas.map(v => [
        format(v.fechaValidacion, 'dd/MM/yyyy HH:mm'),
        v.socioNombre,
        v.socioEmail,
        v.beneficioTitulo,
        v.tipoDescuento === 'porcentaje' ? `${v.descuento}%` : `$${v.descuento}`,
        `$${v.montoOriginal}`,
        `$${v.montoFinal}`,
        v.estado,
        v.metodoPago || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `validaciones_${comercio?.nombreComercio.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleClose = () => {
    setValidaciones([]);
    setStats({
      totalValidaciones: 0,
      exitosas: 0,
      fallidas: 0,
      montoTotal: 0,
      ahorroTotal: 0
    });
    setSearchTerm('');
    setSelectedEstado('');
    setFechaInicio('');
    setFechaFin('');
    setShowFilters(false);
    onClose();
  };

  if (!open || !comercio) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full relative z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Historial de Validaciones
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {comercio.nombreComercio}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-purple-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalValidaciones}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.exitosas}</div>
                <div className="text-xs text-gray-600">Exitosas</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.fallidas}</div>
                <div className="text-xs text-gray-600">Fallidas</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">${stats.montoTotal}</div>
                <div className="text-xs text-gray-600">Facturado</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">${stats.ahorroTotal}</div>
                <div className="text-xs text-gray-600">Ahorrado</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por socio o beneficio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    showFilters 
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </button>

                <button
                  onClick={loadValidations}
                  disabled={loadingData}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>

                <button
                  onClick={handleExport}
                  disabled={validacionesFiltradas.length === 0}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={selectedEstado}
                      onChange={(e) => setSelectedEstado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Todos los estados</option>
                      <option value="exitosa">Exitosa</option>
                      <option value="fallida">Fallida</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedEstado('');
                        setFechaInicio('');
                        setFechaFin('');
                        loadValidations();
                      }}
                      className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mr-3" />
                <span className="text-gray-600">Cargando validaciones...</span>
              </div>
            ) : validacionesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay validaciones
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {validaciones.length === 0 
                    ? 'Este comercio aún no tiene validaciones registradas'
                    : 'No se encontraron validaciones con los filtros aplicados'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {validacionesFiltradas.map((validacion) => (
                  <motion.div
                    key={validacion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(validacion.estado)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(validacion.estado)}`}>
                              {validacion.estado}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(validacion.fechaValidacion, 'dd MMM yyyy, HH:mm', { locale: es })}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <User className="w-4 h-4 mr-2" />
                              <span className="font-medium">{validacion.socioNombre}</span>
                            </div>
                            <div className="text-sm text-gray-500 ml-6">
                              {validacion.socioEmail}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <Gift className="w-4 h-4 mr-2" />
                              <span className="font-medium">{validacion.beneficioTitulo}</span>
                            </div>
                            <div className="text-sm text-gray-500 ml-6">
                              {validacion.beneficioDescripcion}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span>Original: ${validacion.montoOriginal}</span>
                            </div>
                            <div className="flex items-center text-green-600">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              <span>
                                Descuento: {validacion.tipoDescuento === 'porcentaje' 
                                  ? `${validacion.descuento}%` 
                                  : `$${validacion.descuento}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center text-blue-600 font-semibold">
                              <span>Final: ${validacion.montoFinal}</span>
                            </div>
                          </div>

                          {validacion.metodoPago && (
                            <div className="text-sm text-gray-500">
                              {validacion.metodoPago}
                            </div>
                          )}
                        </div>

                        {validacion.notas && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>Notas:</strong> {validacion.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Mostrando {validacionesFiltradas.length} de {validaciones.length} validaciones
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
