'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { ComercioOverviewDashboard } from '@/components/comercio/ComercioOverviewDashboard';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Store,
  Sparkles,
  TrendingUp,
  Gift,
  QrCode,
  Activity,
  ArrowRight,
  Zap
} from 'lucide-react';

// Modern Quick Actions Component with enhanced responsiveness
const QuickActions: React.FC<{
  onNavigate: (section: string) => void;
}> = ({ onNavigate }) => {
  const quickActions = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 size={24} />,
      gradient: 'from-violet-500 via-purple-500 to-indigo-500',
      onClick: () => onNavigate('analytics'),
      description: 'Métricas avanzadas',
      badge: 'Pro',
      stats: '+25%'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: <Gift size={24} />,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      onClick: () => onNavigate('beneficios'),
      description: 'Gestionar ofertas',
      stats: 'Activos'
    },
    {
      id: 'validaciones',
      label: 'Validaciones',
      icon: <Activity size={24} />,
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      onClick: () => onNavigate('validaciones'),
      description: 'Historial completo',
      stats: 'Hoy'
    },
    {
      id: 'qr',
      label: 'Código QR',
      icon: <QrCode size={24} />,
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      onClick: () => onNavigate('qr'),
      description: 'Gestión QR',
      stats: 'Activo'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {quickActions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ 
            scale: 1.02, 
            y: -4,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className={`
            relative p-6 lg:p-8 rounded-3xl text-white shadow-xl transition-all duration-300
            bg-gradient-to-br ${action.gradient}
            hover:shadow-2xl group overflow-hidden
            border border-white/10 backdrop-blur-sm
          `}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full -translate-x-6 -translate-y-6 group-hover:rotate-45 transition-transform duration-500" />
          </div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Content */}
          <div className="relative z-10">
            {/* Badge */}
            {action.badge && (
              <div className="absolute -top-2 -right-2">
                <motion.div 
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20"
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {action.badge}
                </motion.div>
              </div>
            )}

            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 mx-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              {action.icon}
            </div>

            {/* Title */}
            <h3 className="font-bold text-xl mb-2 group-hover:scale-105 transition-transform duration-300">
              {action.label}
            </h3>

            {/* Description */}
            <p className="text-sm opacity-90 mb-3">
              {action.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {action.stats}
              </span>
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// Enhanced Sidebar with logout functionality
const ComercioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
  isMobile: boolean;
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

// Modern Welcome Header Component
type User = {
  nombre?: string;
  role?: string;
  // Add other properties as needed
};

const WelcomeHeader: React.FC<{
  user: User | null;
  onRefresh: () => void;
  onNavigate: (section: string) => void;
}> = ({ user, onRefresh, onNavigate }) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-xl border border-slate-200/50 p-6 lg:p-8 mb-8 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full translate-y-16 -translate-x-16" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Welcome Section */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Store className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-lg"
              />
            </motion.div>
            
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl lg:text-4xl font-bold text-slate-900 mb-1"
              >
                {greeting}, {user?.nombre || 'Comercio'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base lg:text-lg text-slate-600 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2 text-emerald-500" />
                Bienvenido a tu panel de control modernizado
              </motion.p>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <TrendingUp className="w-5 h-5" />
              </motion.div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('analytics')}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline">Ver Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ComercioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [activeSection, setActiveSection] = useState('dashboard');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not authenticated or not comercio
  if (!authLoading && (!user || user.role !== 'comercio')) {
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
      'dashboard': '/dashboard/comercio',
      'validaciones': '/dashboard/comercio/validaciones',
      'qr': '/dashboard/comercio/qr',
      'analytics': '/dashboard/comercio/analytics',
      'beneficios': '/dashboard/comercio/beneficios',
      'clientes': '/dashboard/comercio/clientes',
      'perfil': '/dashboard/comercio/perfil',
      'notificaciones': '/dashboard/comercio/notificaciones',
      'configuracion': '/dashboard/comercio/configuracion'
    };

    const route = sectionRoutes[section];
    if (route && route !== '/dashboard/comercio') {
      router.push(route);
    } else {
      setActiveSection(section);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Enhanced loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full mx-auto mb-6"
          />
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-slate-900 mb-2"
          >
            Cargando Dashboard
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600"
          >
            Preparando tu experiencia modernizada...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Render dashboard content
  const renderDashboardContent = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="p-4 lg:p-6 xl:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <WelcomeHeader 
            user={user}
            onRefresh={handleRefresh}
            onNavigate={handleNavigate}
          />

          {/* Quick Actions */}
          <QuickActions onNavigate={handleNavigate} />

          {/* Main Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ComercioOverviewDashboard
              onNavigate={handleNavigate}
            />
          </motion.div>
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
          <ComercioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
        enableTransitions={true}
      >
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
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