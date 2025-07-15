'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, History, RefreshCw, Download, Building2, Users, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { BeneficiosList } from '@/components/beneficios/BeneficiosList';
import { BeneficiosStats } from '@/components/beneficios/BeneficiosStats';
import { BenefitsSourceInfo } from '@/components/socio/BenefitsSourceInfo';
import { Button } from '@/components/ui/Button';
import { useBeneficiosSocio } from '@/hooks/useBeneficios';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// Define the type for BeneficioUsado
type BeneficioUsado = {
  id: string;
  beneficioTitulo?: string;
  comercioNombre: string;
  montoDescuento?: number;
  montoOriginal?: number;
  montoFinal?: number;
  asociacionNombre?: string | null;
  fechaUso: { toDate: () => Date };
  notas?: string;
};

export default function SocioBeneficiosPage() {
  const { signOut } = useAuth();
  const {
    beneficios,
    beneficiosUsados,
    stats,
    loading,
    error,
    usarBeneficio,
    refrescar,
    estadisticasRapidas
  } = useBeneficiosSocio();

  const [activeTab, setActiveTab] = useState<'disponibles' | 'usados' | 'info'>('disponibles');

  const handleUseBenefit = async (beneficioId: string, comercioId: string) => {
    try {
      await usarBeneficio(beneficioId, comercioId);
      toast.success('¡Beneficio usado exitosamente!');
    } catch (error) {
      console.error('Error usando beneficio:', error);
      toast.error('Error al usar el beneficio');
    }
  };

  const handleExport = () => {
    const data = activeTab === 'disponibles' ? beneficios : beneficiosUsados;
    const csvContent = [
      ['Título', 'Comercio', 'Categoría', 'Descuento', 'Estado', 'Fecha', 'Origen'],
      ...data.map(item => [
        'titulo' in item
          ? item.titulo
          : 'beneficioTitulo' in item
            ? (item as { beneficioTitulo: string }).beneficioTitulo
            : 'Beneficio Usado',
        item.comercioNombre || 'N/A',
        'categoria' in item ? item.categoria : 'N/A',
        'descuento' in item
          ? item.descuento.toString()
          : 'montoDescuento' in item
            ? (item as { montoDescuento?: number }).montoDescuento?.toString() || '0'
            : '0',
        item.estado,
        'fechaFin' in item
          ? (item as { fechaFin: { toDate: () => Date } }).fechaFin.toDate().toLocaleDateString()
          : 'fechaUso' in item
            ? (item as { fechaUso: { toDate: () => Date } }).fechaUso.toDate().toLocaleDateString()
            : '',
        'asociacionNombre' in item && item.asociacionNombre 
          ? `Asociación: ${item.asociacionNombre}`
          : 'Comercio Afiliado'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beneficios-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Datos exportados exitosamente');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  if (error) {
    return (
      <DashboardLayout
        activeSection="beneficios"
        sidebarComponent={(props) => (
          <SocioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
              <Gift size={32} className="text-red-500" />
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
        <SocioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Mis Beneficios
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  Descubre y utiliza todos los descuentos y ofertas especiales disponibles para ti
                </p>
              </div>
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
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Gift size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-700">
                      {estadisticasRapidas.activos}
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">Disponibles</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <History size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-indigo-700">
                      {estadisticasRapidas.usados}
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">Usados</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Gift size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-yellow-700">
                      ${estadisticasRapidas.ahorroTotal.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-yellow-600">Total Ahorrado</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Gift size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-pink-700">
                      ${estadisticasRapidas.ahorroEsteMes.toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-pink-600">Este Mes</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <div className="flex">
              <button
                onClick={() => setActiveTab('disponibles')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'disponibles'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift size={18} />
                Disponibles
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  activeTab === 'disponibles' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {estadisticasRapidas.activos}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('usados')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'usados'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History size={18} />
                Usados
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  activeTab === 'usados' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {estadisticasRapidas.usados}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'info'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Info size={18} />
                Información
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          {activeTab === 'disponibles' && (
            <BeneficiosList
              beneficios={beneficios}
              loading={loading}
              userRole="socio"
              onUse={handleUseBenefit}
              onRefresh={refrescar}
              showFilters={true}
            />
          )}

          {activeTab === 'usados' && (
            <div>
              {beneficiosUsados.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {beneficiosUsados.map((uso: BeneficioUsado, index) => (
                    <motion.div
                      key={uso.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="flex gap-2 mb-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                          ✓ Usado
                        </span>
                        {uso.montoDescuento && uso.montoDescuento > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-slate-600 text-white">
                            ${uso.montoDescuento} ahorrado
                          </span>
                        )}
                        {/* Indicador de origen */}
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                          {uso.asociacionNombre ? (
                            <><Users size={12} className="mr-1" /> Asociación</>
                          ) : (
                            <><Building2 size={12} className="mr-1" /> Comercio</>
                          )}
                        </span>
                      </div>
                  
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {uso.beneficioTitulo || 'Beneficio Usado'}
                      </h3>
                      
                      <p className="text-slate-600 mb-4">
                        Usado en {uso.comercioNombre}
                      </p>
                  
                      <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>Fecha de uso:</span>
                          <span className="font-medium">
                            {uso.fechaUso.toDate().toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {uso.montoOriginal && (
                          <div className="flex items-center justify-between">
                            <span>Monto original:</span>
                            <span className="font-medium">${uso.montoOriginal}</span>
                          </div>
                        )}
                        
                        {uso.montoFinal && (
                          <div className="flex items-center justify-between">
                            <span>Monto final:</span>
                            <span className="font-medium text-emerald-600">${uso.montoFinal}</span>
                          </div>
                        )}
                  
                        {uso.asociacionNombre && (
                          <div className="flex items-center justify-between">
                            <span>Asociación:</span>
                            <span className="font-medium">{uso.asociacionNombre}</span>
                          </div>
                        )}
                      </div>
                  
                      {uso.notas && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{uso.notas}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <History size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No has usado beneficios aún
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Cuando uses un beneficio, aparecerá aquí con los detalles del ahorro
                  </p>
                  <Button onClick={() => setActiveTab('disponibles')}>
                    Explorar Beneficios
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <BenefitsSourceInfo />
          )}

          {/* Estadísticas detalladas */}
          {stats && activeTab === 'disponibles' && (
            <div className="mt-12">
              <BeneficiosStats
                stats={stats}
                loading={loading}
                userRole="socio"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}