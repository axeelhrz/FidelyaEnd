'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { EnhancedMemberManagement } from '@/components/asociacion/EnhancedMemberManagement';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Sparkles,
  TrendingUp,
  Shield
} from 'lucide-react';

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

// Modern loading component
function ModernLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-indigo-400 rounded-full mx-auto"
          />
        </div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Cargando Gestión de Socios
          </h2>
          <p className="text-slate-600 text-lg">
            Preparando tu panel de administración...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SociosPageContent() {
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

  // Always show "Gestión de Socios" as title regardless of filter
  const getPageTitle = () => {
    return 'Gestión de Socios';
  };

  // Get page description based on filter for context
  const getPageDescription = () => {
    switch (filter) {
      case 'activos':
        return 'Administra y supervisa tu comunidad de miembros activos';
      case 'vencidos':
        return 'Gestiona socios con membresías vencidas';
      default:
        return 'Administra y supervisa tu comunidad de miembros';
    }
  };

  // Loading state
  if (authLoading) {
    return <ModernLoadingState />;
  }

  return (
    <>
      <DashboardLayout 
        activeSection="socios" 
        onSectionChange={() => {}}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
            {/* Modern Header with enhanced design */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl blur-3xl" />
              
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    {/* Icon with modern design */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                      className="relative"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl sm:rounded-3xl opacity-20"
                        />
                      </div>
                      {/* Floating decoration */}
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                      >
                        <Sparkles className="w-4 h-4 text-white m-1" />
                      </motion.div>
                    </motion.div>
                    
                    <div className="text-center sm:text-left">
                      <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent leading-tight"
                      >
                        {getPageTitle()}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-lg sm:text-xl text-slate-600 mt-2 font-medium"
                      >
                        {getPageDescription()}
                      </motion.p>
                    </div>
                  </div>

                  {/* Quick stats badges */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-wrap gap-3 justify-center lg:justify-end"
                  >
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-full border border-emerald-200/50">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Crecimiento</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200/50">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Gestión Segura</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Main Content with enhanced container */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative"
            >
              {/* Background decoration for content */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-50/20 to-indigo-50/30 rounded-3xl blur-3xl" />
              
              <div className="relative">
                <EnhancedMemberManagement />
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

      {/* Enhanced Logout Modal */}
      <AnimatePresence>
        {logoutModalOpen && (
          <LogoutModal
            isOpen={logoutModalOpen}
            isLoading={loggingOut}
            onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Enhanced loading fallback component
function SociosPageLoading() {
  return <ModernLoadingState />;
}

export default function AsociacionSociosPage() {
  return (
    <Suspense fallback={<SociosPageLoading />}>
      <SociosPageContent />
    </Suspense>
  );
}