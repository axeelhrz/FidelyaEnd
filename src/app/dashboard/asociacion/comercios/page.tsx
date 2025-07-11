'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { ComercioManagement } from '@/components/asociacion/ComercioManagement';
import { useAuth } from '@/hooks/useAuth';
import { Store } from 'lucide-react';

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

// Loading component for Suspense fallback
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-sky-50/50 via-white to-celestial-50/30 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cargando Gestión de Comercios
        </h2>
        <p className="text-gray-600">
          Preparando el panel de administración...
        </p>
      </div>
    </motion.div>
  </div>
);

// Main component that uses useSearchParams
function AsociacionComerciosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Get filter from URL parameters
  const filter = searchParams.get('filter');

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

  // Navigation handlers
  const handleNavigate = (section: string) => {
    const sectionRoutes: Record<string, string> = {
      'dashboard': '/dashboard/asociacion',
      'socios': '/dashboard/asociacion/socios',
      'comercios': '/dashboard/asociacion/comercios',
      'analytics': '/dashboard/asociacion/analytics',
      'notificaciones': '/dashboard/asociacion/notificaciones',
      'reportes': '/dashboard/asociacion/reportes',
      'configuracion': '/dashboard/asociacion/configuracion',
      'beneficios': '/dashboard/asociacion/beneficios',
      'pagos': '/dashboard/asociacion/pagos'
    };

    const route = sectionRoutes[section];
    if (route && route !== '/dashboard/asociacion/comercios') {
      router.push(route);
    }
  };

  // Get page title based on filter
  const getPageTitle = () => {
    switch (filter) {
      case 'solicitudes':
        return 'Solicitudes Pendientes';
      default:
        return 'Gestión de Comercios';
    }
  };

  // Get page description based on filter
  const getPageDescription = () => {
    switch (filter) {
      case 'solicitudes':
        return 'Revisa y gestiona las solicitudes de vinculación pendientes';
      default:
        return 'Administra tu red de comercios afiliados';
    }
  };

  // Loading state
  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <DashboardLayout 
        activeSection="comercios" 
        onSectionChange={() => {}}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="dashboard-container min-h-screen">
          {/* Enhanced animated background elements */}
          <div className="absolute inset-0 bg-grid opacity-30"></div>
          
          {/* Dynamic floating geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/40 to-green-200/40 rounded-full blur-xl animate-float-gentle"></div>
          <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-green-200/30 to-emerald-300/30 rounded-full blur-2xl animate-float-delay"></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-emerald-300/35 to-green-300/35 rounded-full blur-lg animate-float"></div>
          <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-green-400/40 to-emerald-400/40 rounded-full blur-md animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-emerald-300/30 to-green-400/30 rounded-full blur-lg animate-bounce-slow"></div>

          <div className="relative z-10 p-8 space-y-12">
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
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                    <Store className="w-10 h-10 text-white transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/30 to-green-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                </div>
                
                <div className="text-left">
                  <h1 className="text-5xl md:text-6xl font-bold gradient-text font-playfair tracking-tight leading-none py-2">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xl text-slate-600 font-jakarta mt-2">
                    {getPageDescription()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <ComercioManagement onNavigate={handleNavigate} initialFilter={filter} />
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

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
          className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 group relative overflow-hidden"
        >
          <svg className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-full" />
        </button>
      </motion.div>
    </>
  );
}

// Main exported component with Suspense boundary
export default function AsociacionComerciosPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AsociacionComerciosContent />
    </Suspense>
  );
}