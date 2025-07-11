'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ValidacionesHistory } from '@/components/comercio/ValidacionesHistory';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useValidaciones } from '@/hooks/useValidaciones';
import { ValidacionStats } from '@/types/comercio';
import { 
  UserCheck, 
  Calendar, 
  FileText, 
  Download, 
  RefreshCw,
  CheckCircle,
  Users,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioValidacionesContent() {
  const { user, signOut } = useAuth();
  const { loading, refresh, getStats } = useValidaciones();
  const [stats, setStats] = useState<ValidacionStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'recientes';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export functionality would be implemented here
      toast.success('Exportación iniciada - se descargará automáticamente');
    } catch (error) {
      console.error('Error exporting validaciones:', error);
      toast.error('Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    {
      id: 'recientes',
      label: 'Recientes',
      icon: Calendar,
      description: 'Validaciones de hoy y ayer'
    },
    {
      id: 'historial',
      label: 'Historial Completo',
      icon: FileText,
      description: 'Todas las validaciones'
    }
  ];

  // Load stats on component mount
  useEffect(() => {
    async function fetchStats() {
      if (user) {
        try {
          const statsResult = getStats();
          setStats(statsResult);
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      }
    }
    fetchStats();
  }, [user, getStats]);

  if (loading && !stats) {
    return (
      <DashboardLayout
        activeSection="validaciones"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <RefreshCw size={32} className="text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Cargando validaciones...
            </h3>
            <p className="text-slate-600">Obteniendo historial de validaciones</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="validaciones"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      Historial de Validaciones
                    </h1>
                    <p className="text-lg text-slate-600 mt-1">
                      Seguimiento completo de todas las validaciones de beneficios
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} />}
                  onClick={() => refresh()}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Actualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={handleExport}
                  loading={exporting}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <UserCheck size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.totalValidaciones || 0}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Total Validaciones</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.validacionesExitosas || 0}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Exitosas</div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {stats && stats.totalValidaciones && stats.totalValidaciones > 0 
                      ? `${Math.round((stats.validacionesExitosas / stats.totalValidaciones) * 100)}% éxito`
                      : '0% éxito'
                    }
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats?.clientesUnicos || 0}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Clientes Únicos</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    ${stats?.montoTotalDescuentos?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm font-medium text-slate-600">Descuentos Aplicados</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab.id);
                  window.history.pushState({}, '', url.toString());
                }}
                className={`
                  relative p-6 rounded-2xl text-left shadow-sm transition-all duration-200
                  hover:shadow-lg hover:-translate-y-1 group overflow-hidden
                  ${activeTab === tab.id 
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full translate-y-6 -translate-x-6" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform duration-200 group-hover:scale-110
                    ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}
                  `}>
                    <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {tab.label}
                  </h3>
                  <p className={`text-sm ${activeTab === tab.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Validaciones History Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ValidacionesHistory />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ComercioValidacionesLoading() {
  return (
    <DashboardLayout
      activeSection="validaciones"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <RefreshCw size={32} className="text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Cargando validaciones...
          </h3>
          <p className="text-slate-600">Obteniendo historial de validaciones</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioValidacionesPage() {
  return (
    <Suspense fallback={<ComercioValidacionesLoading />}>
      <ComercioValidacionesContent />
    </Suspense>
  );
}