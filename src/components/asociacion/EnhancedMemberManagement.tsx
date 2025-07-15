'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Settings,
  User,
  DollarSign
} from 'lucide-react';
import { useSocios } from '@/hooks/useSocios';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import { SocioDialog } from './SocioDialog';
import { AddRegisteredSocioButton } from './AddRegisteredSocioButton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Socio, SocioFormData } from '@/types/socio';
import toast from 'react-hot-toast';
import Image from 'next/image';

export const EnhancedMemberManagement = () => {
  const { 
    socios, 
    loading, 
    error, 
    stats,
    loadSocios,
    createSocio,
    updateSocio,
    importSocios
  } = useSocios();

  const {
    loadSocios: loadVinculados,
    desvincularSocio
  } = useSocioAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    estado: '',
    estadoMembresia: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadSocios();
    loadVinculados();
  }, [loadSocios, loadVinculados]);

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSocios(), loadVinculados()]);
      toast.success('Datos actualizados');
    } catch {
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para convertir fechas a formato compatible
  const convertDateToTimestamp = (date: Date | Timestamp | string | undefined): Timestamp | undefined => {
    if (!date) return undefined;
    
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    
    if (date instanceof Timestamp) {
      return date;
    }
    
    if (typeof date === 'string') {
      return Timestamp.fromDate(new Date(date));
    }
    
    return undefined;
  };

  // Función para crear/actualizar socio
  const handleSaveSocio = async (data: SocioFormData) => {
    try {
      // Convertir fechas al formato correcto
      const processedData: SocioFormData = {
        ...data,
        fechaNacimiento: convertDateToTimestamp(data.fechaNacimiento),
        fechaVencimiento: convertDateToTimestamp(data.fechaVencimiento)
      };

      if (selectedSocio) {
        await updateSocio(selectedSocio.id, processedData);
        toast.success('Socio actualizado exitosamente');
      } else {
        await createSocio(processedData);
        toast.success('Socio creado exitosamente');
      }
      await handleRefresh();
    } catch {
      toast.error('Error al guardar el socio');
    }
  };

  // Función para eliminar socio


  // Función para desvincular socio
  const handleDesvincularSocio = async (socioId: string) => {
    if (!confirm('¿Estás seguro de que deseas desvincular este socio?')) return;

    try {
      await desvincularSocio(socioId);
      toast.success('Socio desvinculado exitosamente');
      await handleRefresh();
    } catch {
      toast.error('Error al desvincular el socio');
    }
  };

  // Función para exportar datos a CSV
  const handleExport = async () => {
    try {
      if (socios.length === 0) {
        toast.error('No hay socios para exportar');
        return;
      }

      // Crear encabezados CSV
      const headers = [
        'Nombre',
        'Email',
        'DNI',
        'Teléfono',
        'Número de Socio',
        'Estado',
        'Estado Membresía',
        'Fecha de Ingreso',
        'Fecha de Vencimiento',
        'Monto Cuota',
        'Beneficios Usados'
      ];

      // Convertir datos a formato CSV
      const csvData = socios.map(socio => [
        socio.nombre,
        socio.email,
        socio.dni,
        socio.telefono || '',
        socio.numeroSocio || '',
        socio.estado,
        socio.estadoMembresia,
        format(socio.fechaIngreso.toDate(), 'dd/MM/yyyy'),
        socio.fechaVencimiento ? format(socio.fechaVencimiento.toDate(), 'dd/MM/yyyy') : '',
        socio.montoCuota || 0,
        socio.beneficiosUsados || 0
      ]);

      // Crear contenido CSV
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `socios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Datos exportados exitosamente');
    } catch {
      toast.error('Error al exportar los datos');
    }
  };

  // Función para importar datos
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('El archivo CSV debe tener al menos una fila de datos');
        return;
      }

      // Parsear CSV simple (asumiendo formato estándar)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const sociosData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const socio: SocioFormData = {} as SocioFormData;
        
        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          switch (header.toLowerCase()) {
            case 'nombre':
              socio.nombre = value;
              break;
            case 'email':
              socio.email = value;
              break;
            case 'dni':
              socio.dni = value;
              break;
            case 'telefono':
            case 'teléfono':
              socio.telefono = value;
              break;
            case 'numero de socio':
            case 'número de socio':
              socio.numeroSocio = value;
              break;
            case 'estado':
              socio.estado = (value as SocioFormData['estado']) || 'activo';
              break;
            case 'monto cuota':
              socio.montoCuota = parseFloat(value) || 0;
              break;
            default:
              if (header in socio) {
                ((socio as unknown) as Record<string, unknown>)[header] = value;
              }
          }
        });
        
        return socio;
      });

      await importSocios(sociosData);
      toast.success('Datos importados exitosamente');
      await handleRefresh();
    } catch {
      toast.error('Error al importar los datos');
    }
  };

  // Filtrar socios
  const filteredSocios = socios.filter(socio => {
    const matchesSearch = 
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (socio.dni && socio.dni.includes(searchTerm)) ||
      (socio.numeroSocio && socio.numeroSocio.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = !filters.estado || socio.estado === filters.estado;
    const matchesMembresia = !filters.estadoMembresia || socio.estadoMembresia === filters.estadoMembresia;

    let matchesFecha = true;
    if (filters.fechaDesde || filters.fechaHasta) {
      const fechaIngreso = socio.fechaIngreso.toDate();
      if (filters.fechaDesde && new Date(filters.fechaDesde) > fechaIngreso) {
        matchesFecha = false;
      }
      if (filters.fechaHasta && new Date(filters.fechaHasta) < fechaIngreso) {
        matchesFecha = false;
      }
    }

    return matchesSearch && matchesEstado && matchesMembresia && matchesFecha;
  });

  // Renderizar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando socios...</p>
        </div>
      </div>
    );
  }

  // Renderizar estado de error
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar los socios</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Socios</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Socios Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats?.activos || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Socios Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{stats?.vencidos || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Mensuales</p>
              <p className="text-2xl font-bold text-blue-600">
                ${(stats?.ingresosMensuales || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar socios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
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

            <AddRegisteredSocioButton 
              onSocioAdded={handleRefresh}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            />

            <button
              onClick={() => {
                setSelectedSocio(null);
                setDialogOpen(true);
              }}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Socio
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exportar datos"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={() => document.getElementById('import-file')?.click()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Importar datos"
              >
                <Upload className="w-5 h-5" />
              </button>
              <input
                id="import-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImport(e.target.files[0]);
                  }
                }}
              />

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.estado}
                  onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
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
                  value={filters.estadoMembresia}
                  onChange={(e) => setFilters(prev => ({ ...prev, estadoMembresia: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos</option>
                  <option value="al_dia">Al día</option>
                  <option value="vencido">Vencido</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaDesde: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => setFilters(prev => ({ ...prev, fechaHasta: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    estado: '',
                    estadoMembresia: '',
                    fechaDesde: '',
                    fechaHasta: ''
                  });
                  setSearchTerm('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Limpiar filtros
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lista de Socios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredSocios.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {socios.length === 0 ? 'No hay socios vinculados' : 'No se encontraron socios'}
            </h3>
            <p className="text-gray-600 mb-4">
              {socios.length === 0 
                ? 'Comienza vinculando socios existentes o creando nuevos'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            {socios.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <AddRegisteredSocioButton 
                  onSocioAdded={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                />
                <button
                  onClick={() => {
                    setSelectedSocio(null);
                    setDialogOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Nuevo Socio
                </button>
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
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membresía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSocios.map((socio) => (
                  <tr key={socio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {socio.avatar ? (
                          <Image
                            className="h-10 w-10 rounded-full"
                            src={socio.avatar}
                            alt={socio.nombre}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {socio.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {socio.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {socio.numeroSocio || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        socio.estado === 'activo'
                          ? 'bg-green-100 text-green-800'
                          : socio.estado === 'inactivo'
                          ? 'bg-gray-100 text-gray-800'
                          : socio.estado === 'suspendido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {socio.estado.charAt(0).toUpperCase() + socio.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        socio.estadoMembresia === 'al_dia'
                          ? 'bg-green-100 text-green-800'
                          : socio.estadoMembresia === 'vencido'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {socio.estadoMembresia === 'al_dia'
                          ? 'Al día'
                          : socio.estadoMembresia.charAt(0).toUpperCase() + socio.estadoMembresia.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(socio.fechaIngreso.toDate(), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {socio.fechaVencimiento
                        ? format(socio.fechaVencimiento.toDate(), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSocio(socio);
                            setDialogOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Editar socio"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDesvincularSocio(socio.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Desvincular socio"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diálogo de Socio */}
      <SocioDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSocio}
        socio={selectedSocio}
      />
    </div>
  );
};