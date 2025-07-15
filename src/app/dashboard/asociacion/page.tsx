'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OverviewDashboard } from '@/components/asociacion/OverviewDashboard';
import { useAuth } from '@/hooks/useAuth';
import { 
  Store, 
  BarChart3, 
  Plus,
  Building2,
} from 'lucide-react';

// Simplified Quick Actions Component
const QuickActions: React.FC<{
  onNavigate: (section: string) => void;
}> = ({ onNavigate }) => {
  const quickActions = [
    {
      id: 'add-member',
      label: 'Nuevo Socio',
      icon: <Plus size={20} />,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      onClick: () => onNavigate('socios'),
      description: 'Agregar miembro'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 size={20} />,
      color: 'bg-violet-500 hover:bg-violet-600',
      onClick: () => onNavigate('analytics'),
      description: 'Ver métricas'
    },
    {
      id: 'comercios',
      label: 'Comercios',
      icon: <Store size={20} />,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => onNavigate('comercios'),
      description: 'Gestionar red'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`
            relative p-6 rounded-2xl text-white shadow-lg transition-all duration-200
            hover:shadow-xl hover:-translate-y-1 ${action.color}
            group overflow-hidden
          `}
        >
          {/* Simple background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-white rounded-full translate-y-6 -translate-x-6" />
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl mb-4 mx-auto transition-transform duration-200 group-hover:scale-110">
              {action.icon}
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {action.label}
            </h3>
            <p className="text-sm opacity-90">
              {action.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

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

export default function AsociacionDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
    if (route && route !== '/dashboard/asociacion') {
      router.push(route);
    } else {
      setActiveSection(section);
    }
  };

  const handleAddMember = () => {
    router.push('/dashboard/asociacion/socios');
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
            Preparando tu panel de control...
          </p>
        </div>
      </div>
    );
  }

  // Render dashboard content
  const renderDashboardContent = () => {
    return (
      <div className="asociacion-page-container">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      Hola, {user?.nombre || 'Administrador'}
                    </h1>
                    <p className="text-lg text-slate-600 mt-1">
                      Bienvenido a tu panel de control
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddMember}
                  className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nuevo Socio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions onNavigate={handleNavigate} />

          {/* Main Dashboard */}
          <OverviewDashboard
            onNavigate={handleNavigate}
            onAddMember={handleAddMember}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <DashboardLayout 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
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
          {renderDashboardContent()}
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