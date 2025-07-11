'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Star,
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Award,
  Sparkles,
  Eye,
  ArrowUpRight,
  Filter,
  Search
} from 'lucide-react';
import Image from 'next/image';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Asociacion {
  id: string;
  nombre: string;
  estado: 'activo' | 'vencido' | 'pendiente' | 'inactivo' | 'suspendido';
  fechaVencimiento?: Date;
  logo?: string;
  descripcion?: string;
}

interface AsociacionesListProps {
  asociaciones?: Asociacion[];
}

function isTimestamp(obj: unknown): obj is { toDate: () => Date } {
  return !!obj && typeof obj === 'object' && typeof (obj as { toDate?: unknown }).toDate === 'function';
}

export const AsociacionesList: React.FC<AsociacionesListProps> = ({ 
  asociaciones: asociacionesProp = [
    {
      id: '1',
      nombre: 'Asociación de Comerciantes Centro',
      estado: 'activo',
      fechaVencimiento: new Date('2024-12-31'),
      descripcion: 'Asociación principal de comerciantes del centro de la ciudad'
    },
    {
      id: '2',
      nombre: 'Cámara de Comercio Local',
      estado: 'vencido',
      fechaVencimiento: new Date('2024-01-15'),
      descripcion: 'Cámara de comercio e industria local'
    },
    {
      id: '3',
      nombre: 'Asociación de Servicios Premium',
      estado: 'activo',
      fechaVencimiento: new Date('2024-11-30'),
      descripcion: 'Servicios exclusivos para socios premium'
    }
  ]
}) => {
  const { asociacionesList: asociacionesFromProfile, loading } = useSocioProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAsociacion, setSelectedAsociacion] = useState<Asociacion | null>(null);

  const asociacionesToShow = asociacionesFromProfile && asociacionesFromProfile.length > 0 ? asociacionesFromProfile : asociacionesProp;

  // Filter associations based on search and status
  const filteredAsociaciones = asociacionesToShow
    .filter((item): item is Asociacion =>
      typeof item === 'object' &&
      item !== null &&
      'nombre' in item &&
      'estado' in item
    )
    .filter((asociacion) => {
      const matchesSearch = asociacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asociacion.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = filterStatus === 'all' || asociacion.estado === filterStatus;
      return matchesSearch && matchesStatus;
    });

  const getStatusIcon = (estado: Asociacion['estado']) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'vencido':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pendiente':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'inactivo':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      case 'suspendido':
        return <Shield className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusGradient = (estado: Asociacion['estado']) => {
    switch (estado) {
      case 'activo':
        return 'from-emerald-500 to-teal-600';
      case 'vencido':
        return 'from-red-500 to-rose-600';
      case 'pendiente':
        return 'from-amber-500 to-orange-600';
      case 'inactivo':
        return 'from-gray-500 to-gray-600';
      case 'suspendido':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusText = (estado: Asociacion['estado']) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      case 'inactivo':
        return 'Inactivo';
      case 'suspendido':
        return 'Suspendido';
      default:
        return '';
    }
  };

  const getStatusDescription = (estado: Asociacion['estado'], fechaVencimiento?: Date) => {
    switch (estado) {
      case 'activo':
        if (fechaVencimiento) {
          return `Vence: ${format(fechaVencimiento, 'dd/MM/yyyy', { locale: es })}`;
        }
        return 'Socio activo con todos los beneficios';
      case 'vencido':
        if (fechaVencimiento) {
          return `Venció: ${format(fechaVencimiento, 'dd/MM/yyyy', { locale: es })}`;
        }
        return 'Socio vencido - Renovar para acceder';
      case 'pendiente':
        return 'Activación pendiente - Contactar administrador';
      case 'inactivo':
        return 'Socio inactivo - Sin acceso a beneficios';
      case 'suspendido':
        return 'Socio suspendido - Contactar soporte';
      default:
        return '';
    }
  };

  const getAsociacionColor = (nombre: string) => {
    const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
    const index = nombre.length % colors.length;
    return colors[index];
  };

  const isExpiringSoon = (fechaVencimiento?: Date) => {
    if (!fechaVencimiento) return false;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return fechaVencimiento <= thirtyDaysFromNow && fechaVencimiento > now;
  };

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

  if (loading) {
    return <LoadingSkeleton className="h-64" />;
  }

  return (
    <div className="relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-celestial-50/30 rounded-3xl"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-100/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-celestial-100/20 to-transparent rounded-full blur-3xl"></div>

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-celestial-600 rounded-3xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Mis Asociaciones</h3>
                  <p className="text-gray-600">Gestiona tu membresía y beneficios</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl px-4 py-2 border border-emerald-100/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-700 font-medium text-sm">
                      {filteredAsociaciones.filter((a: Asociacion) => a.estado === 'activo').length} Activas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar asociaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-200"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-8 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="vencido">Vencido</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Associations List */}
        <motion.div 
          variants={itemVariants}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredAsociaciones.map((asociacion: Asociacion, index: number) => (
              <motion.div
                key={asociacion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative overflow-hidden"
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/30 rounded-3xl"></div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>

                {/* Expiring Soon Badge */}
                {asociacion.estado === 'activo' && isExpiringSoon(
                  asociacion.fechaVencimiento && isTimestamp(asociacion.fechaVencimiento)
                    ? asociacion.fechaVencimiento.toDate()
                    : asociacion.fechaVencimiento
                ) && (
                  <motion.div
                    className="absolute top-4 right-4 z-20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>POR VENCER</span>
                    </div>
                  </motion.div>
                )}

                <div className="relative z-10 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* Logo/Avatar */}
                      <div className="relative">
                        <div 
                          className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${getAsociacionColor(asociacion.nombre)}, ${getAsociacionColor(asociacion.nombre)}dd)` 
                          }}
                        >
                          {asociacion.logo ? (
                            <Image
                              src={asociacion.logo}
                              alt={asociacion.nombre}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            asociacion.nombre.charAt(0)
                          )}
                        </div>
                        
                        {/* Status Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          {getStatusIcon(asociacion.estado)}
                        </div>
                      </div>

                      {/* Association Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-lg truncate">
                            {asociacion.nombre}
                          </h4>
                          {asociacion.estado === 'activo' && (
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {getStatusDescription(
                            asociacion.estado,
                            asociacion.fechaVencimiento && isTimestamp(asociacion.fechaVencimiento)
                              ? asociacion.fechaVencimiento.toDate()
                              : asociacion.fechaVencimiento
                          )}
                        </p>
                        
                        {asociacion.descripcion && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {asociacion.descripcion}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {asociacion.fechaVencimiento && isTimestamp(asociacion.fechaVencimiento)
                                ? format(asociacion.fechaVencimiento.toDate(), 'MMM yyyy', { locale: es })
                                : asociacion.fechaVencimiento
                                ? format(asociacion.fechaVencimiento, 'MMM yyyy', { locale: es })
                                : 'Sin fecha'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            <span>Socio #{asociacion.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge and Actions */}
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className={`bg-gradient-to-r ${getStatusGradient(asociacion.estado)} text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center space-x-2 shadow-lg`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {getStatusIcon(asociacion.estado)}
                        <span>{getStatusText(asociacion.estado)}</span>
                      </motion.div>

                      <div className="flex space-x-2">
                        <motion.button
                          className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedAsociacion(asociacion)}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredAsociaciones.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
            <div className="relative z-10 text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No se encontraron asociaciones' : 'No tienes asociaciones'}
              </h4>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Contacta con tu administrador para obtener acceso a una asociación y comenzar a disfrutar de los beneficios.'
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* Summary Stats */}
        {filteredAsociaciones.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="mt-8"
          >
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-3xl"></div>
            
            <div className="relative z-10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Award className="w-6 h-6 text-emerald-600" />
                  <h4 className="text-xl font-bold text-gray-900">Resumen de Membresías</h4>
                </div>
                <Sparkles className="w-6 h-6 text-celestial-500" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">
                    {asociacionesToShow
                      .filter((item): item is Asociacion =>
                        typeof item === 'object' &&
                        item !== null &&
                        'nombre' in item &&
                        'estado' in item
                      )
                      .filter((a) => a.estado === 'activo').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Activas</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {asociacionesToShow
                      .filter((item): item is Asociacion =>
                        typeof item === 'object' &&
                        item !== null &&
                        'nombre' in item &&
                        'estado' in item
                      )
                      .filter((a) => a.estado === 'vencido').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Vencidas</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {asociacionesToShow
                      .filter((item): item is Asociacion =>
                        typeof item === 'object' &&
                        item !== null &&
                        'nombre' in item &&
                        'estado' in item
                      )
                      .filter((a) => a.estado === 'pendiente').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Pendientes</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-celestial-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-sky-600 mb-1">
                    {asociacionesToShow.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Total</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAsociacion && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsociacion(null)}
            />
            
            <motion.div
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Detalles de Asociación</h3>
                  <motion.button
                    className="w-8 h-8 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedAsociacion(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${getAsociacionColor(selectedAsociacion.nombre)}, ${getAsociacionColor(selectedAsociacion.nombre)}dd)` 
                      }}
                    >
                      {selectedAsociacion.nombre.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{selectedAsociacion.nombre}</h4>
                      <p className="text-sm text-gray-600">{selectedAsociacion.descripcion}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-4 border border-sky-100/50">
                      <h5 className="font-semibold text-sky-900 mb-1">Estado</h5>
                      <div className={`inline-flex items-center space-x-1 bg-gradient-to-r ${getStatusGradient(selectedAsociacion.estado)} text-white px-3 py-1 rounded-xl text-sm font-bold`}>
                        {getStatusIcon(selectedAsociacion.estado)}
                        <span>{getStatusText(selectedAsociacion.estado)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50">
                      <h5 className="font-semibold text-emerald-900 mb-1">Vencimiento</h5>
                      <p className="text-sm text-emerald-700 font-medium">
                        {selectedAsociacion.fechaVencimiento && isTimestamp(selectedAsociacion.fechaVencimiento)
                          ? format(selectedAsociacion.fechaVencimiento.toDate(), 'dd/MM/yyyy', { locale: es })
                          : selectedAsociacion.fechaVencimiento
                          ? format(selectedAsociacion.fechaVencimiento, 'dd/MM/yyyy', { locale: es })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
