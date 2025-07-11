'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  X, 
  Home, 
  Users, 
  Store, 
  BarChart3, 
  Gift,
  LogOut,
  ChevronDown,
  UserCheck,
  Building2,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AsociacionSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
}

interface RealtimeStats {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalComercios: number;
  comerciosActivos: number;
  solicitudesPendientes: number;
  actividadReciente: number;
}

export const AsociacionSidebar: React.FC<AsociacionSidebarProps> = ({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { stats } = useSocios();
  const { stats: comerciosStats } = useComercios();
  
  // Real-time stats state
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalSocios: stats?.total || 0,
    sociosActivos: stats?.activos || 0,
    sociosVencidos: stats?.vencidos || 0,
    totalComercios: comerciosStats?.totalComercios || 0,
    comerciosActivos: comerciosStats?.comerciosActivos || 0,
    solicitudesPendientes: comerciosStats?.solicitudesPendientes || 0,
    actividadReciente: 0
  });

  // Update stats when hooks change
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      totalSocios: stats?.total || 0,
      sociosActivos: stats?.activos || 0,
      sociosVencidos: stats?.vencidos || 0,
      totalComercios: comerciosStats?.totalComercios || 0,
      comerciosActivos: comerciosStats?.comerciosActivos || 0,
      solicitudesPendientes: comerciosStats?.solicitudesPendientes || 0
    }));
  }, [stats, comerciosStats]);

  // Submenu item type
  type SubmenuItem = {
    id: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    route: string;
    count?: number;
    urgent?: boolean;
  };
  
  // Simplified menu structure without notifications
  const menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    description: string;
    gradient: string;
    route: string;
    badge?: number;
    urgent?: boolean;
    submenu?: SubmenuItem[];
  }> = [
    {
      id: 'dashboard',
      label: 'Vista General',
      icon: Home,
      description: 'Dashboard principal',
      gradient: 'from-sky-500 to-blue-600',
      route: '/dashboard/asociacion'
    },
    {
      id: 'socios',
      label: 'Gestión de Socios',
      icon: Users,
      description: 'Administrar miembros',
      gradient: 'from-blue-500 to-indigo-600',
      route: '/dashboard/asociacion/socios',
      badge: realtimeStats.totalSocios,
      submenu: [
        { 
          id: 'socios-lista', 
          label: 'Lista de Socios', 
          icon: Users,
          count: realtimeStats.totalSocios,
          route: '/dashboard/asociacion/socios'
        },
        { 
          id: 'socios-activos', 
          label: 'Socios Activos', 
          icon: CheckCircle,
          count: realtimeStats.sociosActivos,
          route: '/dashboard/asociacion/socios?filter=activos'
        },
        { 
          id: 'socios-vencidos', 
          label: 'Socios Vencidos', 
          icon: AlertCircle,
          count: realtimeStats.sociosVencidos,
          urgent: realtimeStats.sociosVencidos > 0,
          route: '/dashboard/asociacion/socios?filter=vencidos'
        }
      ]
    },
    {
      id: 'comercios',
      label: 'Gestión de Comercios',
      icon: Store,
      description: 'Red de comercios afiliados',
      gradient: 'from-emerald-500 to-green-600',
      route: '/dashboard/asociacion/comercios',
      badge: realtimeStats.comerciosActivos,
      submenu: [
        { 
          id: 'comercios-vinculados', 
          label: 'Comercios Vinculados', 
          icon: Store,
          count: realtimeStats.comerciosActivos,
          route: '/dashboard/asociacion/comercios'
        },
        { 
          id: 'comercios-solicitudes', 
          label: 'Solicitudes Pendientes', 
          icon: Clock,
          count: realtimeStats.solicitudesPendientes,
          urgent: realtimeStats.solicitudesPendientes > 0,
          route: '/dashboard/asociacion/comercios?filter=solicitudes'
        }
      ]
    },
    {
      id: 'beneficios',
      label: 'Gestión de Beneficios',
      icon: Gift,
      description: 'Ofertas y promociones',
      gradient: 'from-purple-500 to-pink-600',
      route: '/dashboard/asociacion/beneficios',
      submenu: [
        { 
          id: 'beneficios-lista', 
          label: 'Todos los Beneficios', 
          icon: Gift,
          route: '/dashboard/asociacion/beneficios'
        },
        { 
          id: 'beneficios-validaciones', 
          label: 'Validaciones', 
          icon: UserCheck,
          route: '/dashboard/asociacion/beneficios?tab=validaciones'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics Avanzado',
      icon: BarChart3,
      description: 'Métricas y análisis',
      gradient: 'from-violet-500 to-purple-600',
      route: '/dashboard/asociacion/analytics'
    }
  ];

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['socios']));

  // Real-time Firebase listeners
  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to socios collection
      const sociosRef = collection(db, 'socios');
      const sociosQuery = query(sociosRef, where('asociacionId', '==', user.uid));
      
      const unsubscribeSocios = onSnapshot(sociosQuery, (snapshot) => {
        type SocioDoc = { id: string; estado?: string; estadoMembresia?: string };
        const socios: SocioDoc[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activos = socios.filter(s => s.estado === 'activo').length;
        const vencidos = socios.filter(s => s.estadoMembresia === 'vencido').length;
        
        setRealtimeStats(prev => ({
          ...prev,
          totalSocios: socios.length,
          sociosActivos: activos,
          sociosVencidos: vencidos
        }));
      }, (error) => {
        console.error('Error listening to socios:', error);
      });
      unsubscribers.push(unsubscribeSocios);

      // Listen to comercios collection
      const comerciosRef = collection(db, 'comercios');
      const comerciosQuery = query(comerciosRef, where('asociacionId', '==', user.uid));
      
      const unsubscribeComercios = onSnapshot(comerciosQuery, (snapshot) => {
        type ComercioDoc = { id: string; estado?: string; estadoSolicitud?: string };
        const comercios: ComercioDoc[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activos = comercios.filter(c => c.estado === 'activo').length;
        const solicitudes = comercios.filter(c => c.estadoSolicitud === 'pendiente').length;
        
        setRealtimeStats(prev => ({
          ...prev,
          totalComercios: comercios.length,
          comerciosActivos: activos,
          solicitudesPendientes: solicitudes
        }));
      }, (error) => {
        console.error('Error listening to comercios:', error);
      });
      unsubscribers.push(unsubscribeComercios);

      // Listen to recent activity
      const activityRef = collection(db, 'activities');
      const activityQuery = query(
        activityRef,
        where('asociacionId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
        setRealtimeStats(prev => ({
          ...prev,
          actividadReciente: snapshot.docs.length
        }));
      }, (error) => {
        console.error('Error listening to activity:', error);
      });
      unsubscribers.push(unsubscribeActivity);

    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleMenuClick = (itemId: string, hasSubmenu: boolean = false, route?: string) => {
    if (hasSubmenu) {
      toggleExpanded(itemId);
    } else if (route) {
      router.push(route);
    } else {
      onMenuClick(itemId);
    }
  };

  // Enhanced active state detection
  const isActive = (itemId: string) => {
    return activeSection === itemId || activeSection.startsWith(itemId + '-');
  };

  const isSubmenuItemActive = (subItem: SubmenuItem) => {
    const currentPath = pathname;
    const currentFilter = searchParams.get('filter');
    const currentTab = searchParams.get('tab');
    
    // Check if we're on the socios page
    if (currentPath === '/dashboard/asociacion/socios') {
      if (subItem.id === 'socios-lista' && !currentFilter) {
        return true;
      }
      if (subItem.id === 'socios-activos' && currentFilter === 'activos') {
        return true;
      }
      if (subItem.id === 'socios-vencidos' && currentFilter === 'vencidos') {
        return true;
      }
    }
    
    // Check if we're on the comercios page
    if (currentPath === '/dashboard/asociacion/comercios') {
      if (subItem.id === 'comercios-vinculados' && !currentFilter) {
        return true;
      }
      if (subItem.id === 'comercios-solicitudes' && currentFilter === 'solicitudes') {
        return true;
      }
    }

    // Check if we're on the beneficios page
    if (currentPath === '/dashboard/asociacion/beneficios') {
      if (subItem.id === 'beneficios-lista' && !currentTab) {
        return true;
      }
      if (subItem.id === 'beneficios-validaciones' && currentTab === 'validaciones') {
        return true;
      }
      if (subItem.id === 'beneficios-destacados' && currentTab === 'destacados') {
        return true;
      }
    }
    
    // For other submenu items, check if the current path matches the route
    const routeParts = subItem.route.split('?');
    const routePath = routeParts[0];
    const routeParams = new URLSearchParams(routeParts[1] || '');
    
    if (currentPath !== routePath) return false;
    
    // Check if all route parameters match current parameters
    for (const [key, value] of routeParams.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    
    return true;
  };

  const getItemGradient = (item: typeof menuItems[0]) => {
    return item.gradient || 'from-gray-500 to-gray-600';
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: open ? 0 : -320 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-50 lg:relative lg:translate-x-0 lg:shadow-xl border-r border-white/20"
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Floating elements */}
            <div className="absolute top-2 right-4 w-8 h-8 bg-white/20 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute bottom-4 left-6 w-6 h-6 bg-white/15 rounded-full blur-sm animate-bounce"></div>
            
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Building2 className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">Panel Ejecutivo</h2>
                  <p className="text-sm text-sky-100 truncate max-w-32">
                    {user?.nombre || 'Asociación'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                className="bg-white rounded-2xl p-3 text-center shadow-lg border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-lg font-black text-blue-600">{realtimeStats.totalSocios}</div>
                </div>
                <div className="text-xs text-gray-600 font-medium">Socios</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-2xl p-3 text-center shadow-lg border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Store className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-lg font-black text-emerald-600">{realtimeStats.comerciosActivos}</div>
                </div>
                <div className="text-xs text-gray-600 font-medium">Comercios</div>
              </motion.div>
            </div>
            
            {/* Activity indicator */}
            <motion.div 
              className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-3 h-3" />
              <span>Actualización en tiempo real</span>
            </motion.div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  <motion.button
                    onClick={() => handleMenuClick(item.id, !!item.submenu, item.route)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.id)
                        ? 'bg-gradient-to-r from-white to-gray-50 text-gray-900 shadow-lg border border-gray-200'
                        : 'text-gray-700 hover:bg-white/80 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${getItemGradient(item)} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
                    
                    <div className="flex items-center space-x-3 flex-1 min-w-0 relative z-10">
                      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                        isActive(item.id) 
                          ? `bg-gradient-to-r ${getItemGradient(item)} text-white shadow-lg` 
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm truncate block">{item.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                      </div>
                    </div>
                    
                    {/* Badge and indicators */}
                    <div className="flex items-center space-x-2 relative z-10">
                      {item.badge !== undefined && item.badge > 0 && (
                        <motion.div
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.urgent 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : 'bg-blue-500 text-white'
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </motion.div>
                      )}
                      
                      {item.submenu && (
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                          expandedItems.has(item.id) ? 'rotate-180' : ''
                        } ${isActive(item.id) ? 'text-gray-700' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </motion.button>

                  {/* Enhanced Submenu */}
                  <AnimatePresence>
                    {item.submenu && expandedItems.has(item.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="ml-4 mt-2 space-y-1 border-l-2 border-gradient-to-b from-gray-200 to-transparent pl-4"
                      >
                        {item.submenu.map((subItem) => (
                          <motion.button
                            key={subItem.id}
                            onClick={() => handleMenuClick(subItem.id, false, subItem.route)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                              isSubmenuItemActive(subItem)
                                ? 'bg-gradient-to-r from-gray-50 to-white text-gray-900 border border-gray-200 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                                isSubmenuItemActive(subItem)
                                  ? `bg-gradient-to-r ${getItemGradient(item)} text-white shadow-md` 
                                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                              }`}>
                                <subItem.icon className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-medium truncate">{subItem.label}</span>
                            </div>
                            
                            {/* Submenu badges */}
                            {subItem.count !== undefined && subItem.count > 0 && (
                              <motion.div
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  subItem.urgent 
                                    ? 'bg-red-500 text-white animate-pulse' 
                                    : 'bg-gray-500 text-white'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {subItem.count}
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </nav>

          {/* Enhanced User Info */}
          <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center space-x-3 mb-4">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-sky-500 to-celestial-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-bold text-lg">
                  {user?.nombre?.charAt(0).toUpperCase() || 'A'}
                </span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.nombre || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@asociacion.com'}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-600 font-medium">En línea</span>
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={onLogoutClick}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 group border border-red-200 hover:border-red-300 hover:shadow-md"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-2 rounded-xl bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors duration-200">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Cerrar Sesión</span>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AsociacionSidebar;