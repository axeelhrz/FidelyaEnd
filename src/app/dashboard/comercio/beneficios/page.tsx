'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { BeneficiosList } from '@/components/beneficios/BeneficiosList';
import { BeneficioForm } from '@/components/beneficios/BeneficioForm';
import { BeneficiosStats } from '@/components/beneficios/BeneficiosStats';
import { Button } from '@/components/ui/Button';
import { useBeneficiosComercios } from '@/hooks/useBeneficios';
import { Beneficio, BeneficioFormData } from '@/types/beneficio';
import toast from 'react-hot-toast';

// Componente para crear beneficio
const CrearBeneficioSection: React.FC<{
  onSubmit: (data: BeneficioFormData) => Promise<boolean>;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const [formOpen, setFormOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Crear Nuevo Beneficio</h2>
          <p className="text-gray-600">
            Completa el formulario para crear un beneficio atractivo para tus clientes
          </p>
        </div>
      </div>

      <BeneficioForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={onSubmit}
        loading={loading}
      />
    </div>
  );
};

// Componente para beneficios filtrados
const BeneficiosFiltradosSection: React.FC<{
  beneficios: Beneficio[];
  filtro: string;
  loading: boolean;
  onEdit: (beneficio: Beneficio) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, estado: 'activo' | 'inactivo') => void;
  onRefresh: () => void;
  onExport: () => void;
}> = ({ beneficios, filtro, loading, onEdit, onDelete, onToggleStatus, onRefresh, onExport }) => {
  
  const beneficiosFiltrados = useMemo(() => {
    const now = new Date();
    
    switch (filtro) {
      case 'activos':
        return beneficios.filter(b => 
          b.estado === 'activo' && 
          b.fechaFin.toDate() > now
        );
      case 'vencidos':
        return beneficios.filter(b => 
          b.estado === 'vencido' || 
          (b.estado === 'activo' && b.fechaFin.toDate() <= now)
        );
      case 'inactivos':
        return beneficios.filter(b => b.estado === 'inactivo');
      case 'agotados':
        return beneficios.filter(b => b.estado === 'agotado');
      default:
        return beneficios;
    }
  }, [beneficios, filtro]);

  const getTituloSeccion = () => {
    switch (filtro) {
      case 'activos': return 'Beneficios Activos';
      case 'vencidos': return 'Beneficios Vencidos';
      case 'inactivos': return 'Beneficios Inactivos';
      case 'agotados': return 'Beneficios Agotados';
      default: return 'Todos los Beneficios';
    }
  };

  const getIconoSeccion = () => {
    switch (filtro) {
      case 'activos': return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'vencidos': return <Clock className="w-8 h-8 text-red-500" />;
      case 'inactivos': return <AlertCircle className="w-8 h-8 text-gray-500" />;
      case 'agotados': return <AlertCircle className="w-8 h-8 text-orange-500" />;
      default: return <Gift className="w-8 h-8 text-purple-500" />;
    }
  };

  const getColorSeccion = () => {
    switch (filtro) {
      case 'activos': return 'from-green-500 to-emerald-600';
      case 'vencidos': return 'from-red-500 to-red-600';
      case 'inactivos': return 'from-gray-500 to-gray-600';
      case 'agotados': return 'from-orange-500 to-orange-600';
      default: return 'from-purple-500 to-pink-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la sección */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getColorSeccion()} rounded-xl flex items-center justify-center`}>
              {getIconoSeccion()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getTituloSeccion()}</h2>
              <p className="text-gray-600">
                {beneficiosFiltrados.length} beneficio{beneficiosFiltrados.length !== 1 ? 's' : ''} encontrado{beneficiosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={16} />}
              onClick={onRefresh}
            >
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={16} />}
              onClick={onExport}
            >
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista filtrada */}
      <BeneficiosList
        beneficios={beneficiosFiltrados}
        loading={loading}
        userRole="comercio"
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onRefresh={onRefresh}
        onExport={onExport}
        showCreateButton={false}
        showFilters={false}
      />
    </div>
  );
};

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioBeneficiosContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const filter = searchParams.get('filter');

  const {
    beneficios,
    stats,
    loading,
    error,
    crearBeneficio,
    actualizarBeneficio,
    eliminarBeneficio,
    cambiarEstadoBeneficio,
    refrescar,
    estadisticasRapidas
  } = useBeneficiosComercios();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBeneficio, setEditingBeneficio] = useState<Beneficio | null>(null);

  // Determinar qué vista mostrar
  const currentView = action || filter || 'lista';

  const handleCreateNew = () => {
    setEditingBeneficio(null);
    setFormOpen(true);
  };

  const handleEdit = (beneficio: Beneficio) => {
    setEditingBeneficio(beneficio);
    setFormOpen(true);
  };

  const handleDelete = async (beneficioId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este beneficio?')) {
      try {
        await eliminarBeneficio(beneficioId);
        toast.success('Beneficio eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando beneficio:', error);
        toast.error('Error al eliminar el beneficio');
      }
    }
  };

  const handleToggleStatus = async (beneficioId: string, estado: 'activo' | 'inactivo') => {
    try {
      await cambiarEstadoBeneficio(beneficioId, estado);
      toast.success(`Beneficio ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      toast.error('Error al cambiar el estado del beneficio');
    }
  };

  const handleFormSubmit = async (data: BeneficioFormData) => {
    try {
      if (editingBeneficio) {
        const updateData: Partial<BeneficioFormData> = {
          titulo: data.titulo,
          descripcion: data.descripcion,
          tipo: data.tipo,
          descuento: data.descuento,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          limitePorSocio: data.limitePorSocio,
          limiteTotal: data.limiteTotal,
          condiciones: data.condiciones,
          categoria: data.categoria,
          tags: data.tags,
          destacado: data.destacado,
          asociacionesDisponibles: data.asociacionesDisponibles
        };

        await actualizarBeneficio(editingBeneficio.id, updateData);
        toast.success('Beneficio actualizado exitosamente');
      } else {
        await crearBeneficio(data);
        toast.success('Beneficio creado exitosamente');
      }
      setFormOpen(false);
      setEditingBeneficio(null);
      return true;
    } catch (error) {
      console.error('Error en formulario:', error);
      toast.error('Error al guardar el beneficio');
      return false;
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Título', 'Categoría', 'Tipo', 'Descuento', 'Estado', 'Usos', 'Fecha Creación', 'Fecha Vencimiento'],
      ...beneficios.map(beneficio => [
        beneficio.titulo,
        beneficio.categoria,
        beneficio.tipo,
        beneficio.descuento.toString(),
        beneficio.estado,
        beneficio.usosActuales.toString(),
        beneficio.creadoEn.toDate().toLocaleDateString(),
        beneficio.fechaFin.toDate().toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beneficios-comercio-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Datos exportados exitosamente');
  };

  if (error) {
    return (
      <DashboardLayout
        activeSection="beneficios"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={() => {
              window.location.href = '/logout';
            }}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar beneficios
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={refrescar} leftIcon={<RefreshCw size={16} />}>
              Reintentar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="beneficios"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {
            window.location.href = '/logout';
          }}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Gestión de Beneficios
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                {currentView === 'crear' ? 'Crear nuevo beneficio para tus clientes' :
                 filter ? `Vista filtrada: ${filter}` :
                 'Administra todos los beneficios de tu comercio'}
              </p>
            </div>
            
            {currentView === 'lista' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} />}
                  onClick={refrescar}
                >
                  Actualizar
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
                  leftIcon={<Plus size={16} />}
                  onClick={handleCreateNew}
                >
                  Nuevo Beneficio
                </Button>
              </div>
            )}
          </div>

          {/* Estadísticas rápidas - Solo en vista principal */}
          {currentView === 'lista' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Gift size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      {estadisticasRapidas.total}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Total Beneficios</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      {estadisticasRapidas.activos}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Activos</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      {estadisticasRapidas.usados}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Total Usos</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/30">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      {beneficios.filter(b => {
                        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return b.creadoEn.toDate() > sevenDaysAgo;
                      }).length}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">Nuevos (7 días)</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Contenido dinámico basado en la vista */}
        <AnimatePresence mode="wait">
          {currentView === 'crear' && (
            <motion.div
              key="crear"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CrearBeneficioSection
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </motion.div>
          )}

          {(filter === 'activos' || filter === 'vencidos' || filter === 'inactivos' || filter === 'agotados') && (
            <motion.div
              key={filter}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BeneficiosFiltradosSection
                beneficios={beneficios}
                filtro={filter}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={refrescar}
                onExport={handleExport}
              />
            </motion.div>
          )}

          {currentView === 'lista' && (
            <motion.div
              key="lista"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Lista completa de beneficios */}
              <BeneficiosList
                beneficios={beneficios}
                loading={loading}
                userRole="comercio"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={refrescar}
                onExport={handleExport}
                onCreateNew={handleCreateNew}
                showCreateButton={true}
                showFilters={true}
              />

              {/* Estadísticas detalladas */}
              {stats && (
                <div className="mt-12">
                  <BeneficiosStats
                    stats={stats}
                    loading={loading}
                    userRole="comercio"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario de beneficio (modal) */}
        <BeneficioForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingBeneficio(null);
          }}
          onSubmit={handleFormSubmit}
          beneficio={editingBeneficio}
          loading={loading}
        />
      </motion.div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ComercioBeneficiosLoading() {
  return (
    <DashboardLayout
      activeSection="beneficios"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center">
            <RefreshCw size={32} className="text-purple-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando beneficios...
          </h3>
          <p className="text-gray-500">Preparando gestión de beneficios</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioBeneficiosPage() {
  return (
    <Suspense fallback={<ComercioBeneficiosLoading />}>
      <ComercioBeneficiosContent />
    </Suspense>
  );
}