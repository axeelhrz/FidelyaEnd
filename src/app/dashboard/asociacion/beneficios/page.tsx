'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { BeneficiosManagement } from '@/components/asociacion/BeneficiosManagement';
import { ValidacionesHistory } from '@/components/asociacion/ValidacionesHistory';
import { CreateBeneficioModal } from '@/components/asociacion/CreateBeneficioModal';
import { useAuth } from '@/hooks/useAuth';
import { Gift, CheckCircle, Plus } from 'lucide-react';

// Enhanced Sidebar with logout functionality
const AsociacionSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <AsociacionSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

export default function AsociacionBeneficiosPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not authenticated or not association
  if (!authLoading && (!user || user.role !== 'asociacion')) {
    router.push('/auth/login');
    return null;
  }

  // Logout handlers
  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'todos', 
      label: 'Todos los Beneficios', 
      icon: Gift, 
      description: 'Gestiona todos los beneficios de tu asociación'
    },
    { 
      id: 'validaciones', 
      label: 'Validaciones', 
      icon: CheckCircle, 
      description: 'Historial de validaciones de beneficios'
    }
  ];

  // Handle create beneficio
  const handleCreateBeneficio = () => {
    setCreateModalOpen(true);
  };

  // Handle beneficio creation success
  const handleBeneficioCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="asociacion-page-container flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cargando Gestión de Beneficios
            </h2>
            <p className="text-gray-600">
              Preparando ofertas y promociones...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout 
        activeSection="beneficios" 
        onSectionChange={() => {}}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="asociacion-page-container">
          <div className="p-8 space-y-12">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                {/* Enhanced logo icon */}
                <div className="relative group">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                    <Gift className="w-10 h-10 text-white transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                </div>
                
                <div className="text-left">
                  <h1 className="text-5xl md:text-6xl font-bold gradient-text font-playfair tracking-tight leading-none py-2">
                    Gestión de Beneficios
                  </h1>
                  <p className="text-xl text-slate-600 font-jakarta mt-2">
                    Crea y administra ofertas exclusivas
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {activeTab === 'todos' && (
                  <button
                    onClick={handleCreateBeneficio}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Beneficio
                  </button>
                )}
              </div>

              {/* Tab Description */}
              <div className="mb-6">
                <p className="text-gray-600">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={`${activeTab}-${refreshKey}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {activeTab === 'todos' && (
                <BeneficiosManagement onCreateBeneficio={handleCreateBeneficio} />
              )}
              
              {activeTab === 'validaciones' && (
                <ValidacionesHistory />
              )}
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

      {/* Create Beneficio Modal */}
      <CreateBeneficioModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleBeneficioCreated}
      />

      {/* Enhanced Modal de Logout */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* Enhanced scroll to top button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 group relative overflow-hidden"
        >
          <svg className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-full" />
        </button>
      </motion.div>
    </>
  );
}