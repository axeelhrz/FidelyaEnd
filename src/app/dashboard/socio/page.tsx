'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { SocioOverviewDashboard } from '@/components/socio/SocioOverviewDashboard';
import { useAuth } from '@/hooks/useAuth';

// Enhanced Sidebar with logout functionality
const SocioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <SocioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

export default function SocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not authenticated or not socio
  if (!authLoading && (!user || user.role !== 'socio')) {
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
      'dashboard': '/dashboard/socio',
      'perfil': '/dashboard/socio/perfil',
      'beneficios': '/dashboard/socio/beneficios',
      'validar': '/dashboard/socio/validar',
      'historial': '/dashboard/socio/historial'
    };

    const route = sectionRoutes[section];
    if (route && route !== '/dashboard/socio') {
      router.push(route);
    } else {
      setActiveSection(section);
    }
  };

  const handleQuickScan = () => {
    router.push('/dashboard/socio/validar');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Cargando Dashboard
          </h2>
          <p className="text-slate-600">
            Preparando tu panel de beneficios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <motion.div
          key={activeSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="p-6">
              <SocioOverviewDashboard
                onNavigate={handleNavigate}
                onQuickScan={handleQuickScan}
              />
            </div>
          </div>
        </motion.div>
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