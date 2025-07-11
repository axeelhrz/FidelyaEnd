'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Check,
  AlertTriangle,
  TrendingUp,
  Store,
  BarChart3,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { useSocios } from '@/hooks/useSocios';
import { SocioDialog } from './SocioDialog';
import { AddRegisteredSocioDialog } from './AddRegisteredSocioDialog';
import { SocioProfileView } from './SocioProfileView';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { SocioFormData, Socio } from '@/types/socio';

interface EnhancedMemberManagementProps {
  onNavigate?: (section: string) => void;
  initialFilter?: string | null;
}

export const EnhancedMemberManagement: React.FC<EnhancedMemberManagementProps> = ({ 
  onNavigate, 
  initialFilter 
}) => {
  // Ensure socios are typed as '@/types/socio' Socio
  const { socios: rawSocios, stats, loading, createSocio, updateSocio, deleteSocio, updateMembershipStatus } = useSocios();
  // Map socios to ensure they have uid and asociacion (add defaults if missing)
  const socios: Socio[] = ((rawSocios as unknown) as Socio[]).map((socio) => ({
    ...socio,
    uid: socio.uid ?? '',
    asociacion: socio.asociacion ?? '',
  }));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedEstadoMembresia, setSelectedEstadoMembresia] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [socioDialogOpen, setSocioDialogOpen] = useState(false);
  const [addRegisteredDialogOpen, setAddRegisteredDialogOpen] = useState(false);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Apply initial filter from URL parameters
  useEffect(() => {
    if (initialFilter) {
      switch (initialFilter) {
        case 'activos':
          setSelectedEstado('activo');
          setSelectedEstadoMembresia('');
          break;
        case 'vencidos':
          setSelectedEstado('');
          setSelectedEstadoMembresia('vencido');
          break;
        default:
          setSelectedEstado('');
          setSelectedEstadoMembresia('');
          break;
      }
    }
  }, [initialFilter]);

  // Filtrar socios
  const sociosFiltrados = socios.filter(socio => {
    const matchesSearch = !searchTerm || 
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.numeroSocio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !selectedEstado || socio.estado === selectedEstado;
    const matchesEstadoMembresia = !selectedEstadoMembresia || socio.estadoMembresia === selectedEstadoMembresia;
    
    return matchesSearch && matchesEstado && matchesEstadoMembresia;
  });

  // Get filtered title based on current filters
  const getFilteredTitle = () => {
    if (selectedEstado === 'activo' && !selectedEstadoMembresia) {
      return 'Socios Activos';
    } else if (selectedEstadoMembresia === 'vencido' && !selectedEstado) {
      return 'Socios Vencidos';
    } else if (selectedEstado || selectedEstadoMembresia || searchTerm) {
      return 'Socios Filtrados';
    }
    return 'Lista de Socios';
  };

  const handleCreateSocio = async (data: SocioFormData) => {
    try {
      const cleanData = {
        nombre: data.nombre,
        email: data.email,
        estado: data.estado,
        dni: data.dni || '',
        telefono: data.telefono || '',
        direccion: '',
        fechaNacimiento: data.fechaNacimiento || new Date(),
        montoCuota: data.montoCuota || 0,
        numeroSocio: data.numeroSocio || '',
        fechaVencimiento: data.fechaVencimiento,
      };
      
      const success = await createSocio(cleanData);
      
      if (success) {
        setSocioDialogOpen(false);
        setSelectedSocio(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error creating socio:', error);
    }
  };

  const handleUpdateSocio = async (data: SocioFormData) => {
    if (!selectedSocio) return;
    
    try {
      const success = await updateSocio(selectedSocio.id, data);
      
      if (success) {
        setSocioDialogOpen(false);
        setSelectedSocio(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating socio:', error);
    }
  };

  const handleAddRegisteredSocio = async (userData: {
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
    estado: 'activo' | 'vencido';
  }) => {
    try {
      const socioData = {
        nombre: userData.nombre,
        email: userData.email,
        estado: userData.estado,
        dni: userData.dni || '',
        telefono: userData.telefono || '',
        direccion: '',
        fechaNacimiento: new Date(),
        montoCuota: 0,
        numeroSocio: '',
      };
      
      const success = await createSocio(socioData);
      
      if (success) {
        setAddRegisteredDialogOpen(false);
      }
      
      return success;
    } catch (error) {
      console.error('Error adding registered socio:', error);
      return false;
    }
  };

  const handleOpenDialog = () => {
    setSelectedSocio(null);
    setIsEditing(false);
    setSocioDialogOpen(true);
  };

  const handleEditSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsEditing(true);
    setSocioDialogOpen(true);
  };

  const handleViewSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setProfileViewOpen(true);
  };

  const handleDeleteSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSocio) return;
    
    try {
      const success = await deleteSocio(selectedSocio.id);
      
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedSocio(null);
      }
    } catch (error) {
      console.error('Error deleting socio:', error);
    }
  };

  const handleToggleStatus = async (socio: Socio) => {
    const newStatus = socio.estado === 'activo' ? 'inactivo' : 'activo';
    
    try {
      const success = await updateSocio(socio.id, { estado: newStatus } as Partial<SocioFormData>);
      
      if (success) {
        // Refresh will happen automatically through the hook
      }
    } catch (error) {
      console.error('Error toggling socio status:', error);
    }
  };

  const handleUpdateMembershipStatuses = async () => {
    try {
      await updateMembershipStatus();
    } catch (error) {
      console.error('Error updating membership statuses:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación rápida */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getFilteredTitle()}</h1>
          <p className="text-gray-600 mt-2">
            {initialFilter === 'activos' 
              ? 'Miembros con estado activo en la asociación'
              : initialFilter === 'vencidos'
              ? 'Miembros con membresía vencida que requieren atención'
              : 'Administra los miembros de tu asociación'
            }
          </p>
          {sociosFiltrados.length !== socios.length && (
            <p className="text-sm text-blue-600 mt-1">
              Mostrando {sociosFiltrados.length} de {socios.length} socios
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('comercios')}
              className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <Store className="w-4 h-4 mr-2" />
              Ir a Comercios
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
          
          <button
            onClick={handleUpdateMembershipStatuses}
            className="inline-flex items-center px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar Estados
          </button>
          
          <button
            onClick={() => setAddRegisteredDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Registrado
          </button>
          
          <button
            onClick={handleOpenDialog}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Socio
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Socios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Socios Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Membresías Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(stats.activos * 50).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar socios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>

            <button
              onClick={() => onNavigate?.('socios-importar')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </button>

            <button
              onClick={() => onNavigate?.('socios-exportar')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Socio
                  </label>
                  <select
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="suspendido">Suspendido</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado de Membresía
                  </label>
                  <select
                    value={selectedEstadoMembresia}
                    onChange={(e) => setSelectedEstadoMembresia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="al_dia">Al día</option>
                    <option value="vencido">Vencido</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedEstado('');
                    setSelectedEstadoMembresia('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Limpiar filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Socios List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando socios...</span>
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {socios.length === 0 ? 'No hay socios registrados' : 'No se encontraron socios'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {socios.length === 0 
                ? 'Comienza agregando tu primer socio.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
            {socios.length === 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleOpenDialog}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Nuevo Socio
                  </button>
                  
                  <button
                    onClick={() => setAddRegisteredDialogOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-emerald-300 shadow-sm text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Usuario Registrado
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Socio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membresía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sociosFiltrados.map((socio) => (
                  <motion.tr
                    key={socio.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {socio.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {socio.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {socio.numeroSocio ? `#${socio.numeroSocio}` : 'Sin número'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{socio.email}</div>
                      <div className="text-sm text-gray-500">
                        {socio.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        socio.estado === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : socio.estado === 'inactivo'
                          ? 'bg-gray-100 text-gray-800'
                          : socio.estado === 'suspendido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {socio.estado === 'activo' ? 'Activo' : 
                         socio.estado === 'inactivo' ? 'Inactivo' :
                         socio.estado === 'suspendido' ? 'Suspendido' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        socio.estadoMembresia === 'al_dia' 
                          ? 'bg-green-100 text-green-800' 
                          : socio.estadoMembresia === 'vencido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {socio.estadoMembresia === 'al_dia' ? 'Al día' : 
                         socio.estadoMembresia === 'vencido' ? 'Vencido' : 'Pendiente'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(socio.creadoEn instanceof Date
                        ? socio.creadoEn
                        : socio.creadoEn.toDate()
                      ).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSocio(socio)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver perfil completo"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleEditSocio(socio)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar socio"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleToggleStatus(socio)}
                          className={`${
                            socio.estado === 'activo' 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={socio.estado === 'activo' ? 'Desactivar socio' : 'Activar socio'}
                        >
                          {socio.estado === 'activo' ? <UserX size={16} /> : <UserPlus size={16} />}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSocio(socio)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar socio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleOpenDialog}
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">Nuevo Socio</div>
              <div className="text-xs text-gray-500">Crear desde cero</div>
            </div>
          </button>

          <button
            onClick={() => setAddRegisteredDialogOpen(true)}
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">Agregar Registrado</div>
              <div className="text-xs text-gray-500">Usuario existente</div>
            </div>
          </button>

          <button
            onClick={handleUpdateMembershipStatuses}
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">Actualizar Estados</div>
              <div className="text-xs text-gray-500">Membresías vencidas</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.('analytics')}
            className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">Ver Analytics</div>
              <div className="text-xs text-gray-500">Métricas detalladas</div>
            </div>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <SocioDialog
        open={socioDialogOpen}
        onClose={() => {
          setSocioDialogOpen(false);
          setSelectedSocio(null);
          setIsEditing(false);
        }}
        onSave={isEditing ? handleUpdateSocio : handleCreateSocio}
        socio={isEditing ? selectedSocio : null}
      />

      <AddRegisteredSocioDialog
        open={addRegisteredDialogOpen}
        onClose={() => setAddRegisteredDialogOpen(false)}
        onAddSocio={handleAddRegisteredSocio}
      />

      {selectedSocio && (
        <SocioProfileView
          socio={selectedSocio}
          open={profileViewOpen}
          onClose={() => {
            setProfileViewOpen(false);
            setSelectedSocio(null);
          }}
          onEdit={handleEditSocio}
          onRefresh={() => {
            // Refresh will happen automatically through the hook
          }}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedSocio(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Socio"
        confirmText="Eliminar"
        cancelText="Cancelar"
        message={`¿Estás seguro de que deseas eliminar al socio "${selectedSocio?.nombre}"? Esta acción marcará al socio como inactivo.`}
      />
    </div>
  );
};