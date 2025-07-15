'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { EnhancedMemberManagement } from '@/components/asociacion/EnhancedMemberManagement';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
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

  // Navigation handlers

  // Get page title based on filter
  const getPageTitle = () => {
    switch (filter) {
      case 'activos':
        return 'Socios Activos';
      case 'vencidos':
        return 'Socios Vencidos';
      default:
        return 'Gestión de Socios';
    }
  };

  // Get page description based on filter
  const getPageDescription = () => {
    switch (filter) {
      case 'activos':
        return 'Miembros con membresía vigente';
      case 'vencidos':
        return 'Miembros con membresía vencida que requieren atención';
      default:
        return 'Administra y supervisa tu comunidad de miembros';
    }
  };

  // Loading state
  if (authLoading) {
    return (
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
              Cargando {getPageTitle()}
            </h2>
            <p className="text-gray-600">
              Preparando el panel de administración...
            </p>
          </div>
        </motion.div>
      </div>
    );
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
        <div className="asociacion-page-container">
          <div className="p-8 space-y-8">
            {/* Clean Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                
                <div className="text-left">
                  <h1 className="text-4xl font-bold text-slate-900">
                    {getPageTitle()}
                  </h1>
                  <p className="text-lg text-slate-600 mt-1">
                    {getPageDescription()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <EnhancedMemberManagement />
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}

// Loading fallback component
function SociosPageLoading() {
  return (
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
            Cargando Gestión de Socios
          </h2>
          <p className="text-gray-600">
            Preparando el panel de administración...
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AsociacionSociosPage() {
  return (
    <Suspense fallback={<SociosPageLoading />}>
      <SociosPageContent />
    </Suspense>
  );
}