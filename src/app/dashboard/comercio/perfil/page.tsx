'use client';

import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ProfileForm } from '@/components/comercio/perfil/ProfileForm';
import { QRSection } from '@/components/comercio/perfil/QRSection';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useComercios } from '@/hooks/useComercios';
import { 
  Store, 
  RefreshCw,
  QrCode,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// Sidebar personalizado que maneja el logout
const ComercioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <ComercioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Loading component
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Cargando perfil...
        </h3>
        <p className="text-gray-600">Obteniendo información del comercio</p>
      </motion.div>
    </div>
  </div>
);

// Main component content
const ComercioPerfilContent: React.FC = () => {
  const { signOut } = useAuth();
  const { loading } = useComercios();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'datos';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const tabs = [
    {
      id: 'datos',
      label: 'Información General',
      icon: User,
      description: 'Datos básicos y contacto del comercio',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'qr',
      label: 'Códigos QR',
      icon: QrCode,
      description: 'Gestión y descarga de códigos QR',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const handleTabChange = (tabId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout
        activeSection="perfil"
        sidebarComponent={(props) => (
          <ComercioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="perfil"
      sidebarComponent={(props) => (
        <ComercioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center lg:justify-start gap-3 mb-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Mi Perfil
                    </h1>
                    <p className="text-lg text-gray-600 font-medium mt-1">
                      Gestiona la información de tu comercio
                    </p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center lg:justify-end"
              >
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<RefreshCw size={18} />}
                  onClick={() => window.location.reload()}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Actualizar
                </Button>
              </motion.div>
            </div>

            {/* Modern Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
                {tabs.map((tab, index) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex-1 group transition-all duration-300 ${
                        isActive ? 'z-10' : 'z-0'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className={`
                        relative p-4 sm:p-5 rounded-xl transition-all duration-300
                        ${isActive 
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-blue-500/25` 
                          : 'bg-transparent text-gray-600 hover:bg-white/50 hover:text-gray-900'
                        }
                      `}>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                          <div className={`
                            p-2 rounded-lg transition-all duration-300
                            ${isActive 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 group-hover:bg-gray-200'
                            }
                          `}>
                            <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="text-left hidden sm:block">
                            <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                              {tab.label}
                            </div>
                            <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                              {tab.description}
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                            isActive ? 'rotate-90 text-white' : 'text-gray-400 group-hover:translate-x-1'
                          } hidden sm:block`} />
                        </div>
                        
                        {/* Mobile label */}
                        <div className="sm:hidden mt-2">
                          <div className={`font-bold text-xs ${isActive ? 'text-white' : 'text-gray-900'}`}>
                            {tab.label}
                          </div>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl -z-10"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'datos' && (
                  <motion.div
                    key="datos"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfileForm />
                  </motion.div>
                )}

                {activeTab === 'qr' && (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <QRSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <div className="fixed top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse hidden lg:block"></div>
          <div className="fixed bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse hidden lg:block"></div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function ComercioPerfilPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ComercioPerfilContent />
    </Suspense>
  );
}