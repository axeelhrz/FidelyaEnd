'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  X, 
  Home, 
  User, 
  Gift, 
  QrCode, 
  History,
  Crown,
  LogOut,
  ChevronDown,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficiosSocio } from '@/hooks/useBeneficios';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SocioSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
}

interface RealtimeStats {
  totalBeneficios: number;
  beneficiosUsados: number;
  ahorroTotal: number;
  estadoMembresia: string;
  actividadReciente: number;
}

// Loading fallback component
const SocioSidebarSkeleton: React.FC<SocioSidebarProps> = ({
  open,
  onToggle,
}) => {
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
          {/* Header Skeleton */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600"></div>
            <div className="relative z-10 flex items-center justify-between p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Portal Socio</h2>
                  <div className="w-24 h-3 bg-white/20 rounded animate-pulse mt-1"></div>
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

          {/* Loading Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-celestial-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw size={32} className="text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cargando...</h3>
              <p className="text-gray-500">Preparando tu panel de socio</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Main sidebar content component that uses useSearchParams
const SocioSidebarContent: React.FC<SocioSidebarProps> = ({
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
  const { socio, estadisticas, loading: socioLoading } = useSocioProfile();
  const { beneficiosActivos, estadisticasRapidas } = useBeneficiosSocio();
  
  // Real-time stats state
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalBeneficios: 0,
    beneficiosUsados: 0,
    ahorroTotal: 0,
    estadoMembresia: 'pendiente',
    actividadReciente: 0
  });

  // Memoize the specific values we need to prevent infinite re-renders
  const memoizedValues = useMemo(() => ({
    totalBeneficios: beneficiosActivos?.length || 0,
    beneficiosUsados: estadisticas?.totalValidaciones || estadisticasRapidas?.usados || 0,
    ahorroTotal: estadisticas?.ahorroTotal || estadisticasRapidas?.ahorroTotal || 0,
    estadoMembresia: socio?.estadoMembresia || 'pendiente',
    actividadReciente: estadisticas?.totalValidaciones || 0
  }), [
    beneficiosActivos?.length,
    estadisticas?.totalValidaciones,
    estadisticas?.ahorroTotal,
    estadisticasRapidas?.usados,
    estadisticasRapidas?.ahorroTotal,
    socio?.estadoMembresia
  ]);

  // Update stats when memoized values change
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      ...memoizedValues
    }));
  }, [memoizedValues]);

  // Real-time Firebase listeners for additional data
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to validaciones for real-time activity
      const validacionesRef = collection(db, 'validaciones');
      const validacionesQuery = query(validacionesRef, where('socioId', '==', user.uid));
      
      const unsubscribeValidaciones = onSnapshot(validacionesQuery, (snapshot) => {
        const validaciones = snapshot.docs.map(doc => doc.data());
        const totalValidaciones = validaciones.length;
        const ahorroCalculado = validaciones.reduce((total, v) => total + (v.montoDescuento || 0), 0);
        
        setRealtimeStats(prev => ({
          ...prev,
          beneficiosUsados: totalValidaciones,
          ahorroTotal: ahorroCalculado,
          actividadReciente: totalValidaciones
        }));
      }, (error) => {
        console.error('Error listening to validaciones:', error);
      });
      unsubscribers.push(unsubscribeValidaciones);

    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  // Submenu item type
  type SubmenuItem = {
    id: string;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    route: string;
    count?: number;
    urgent?: boolean;
  };
  
  // Enhanced menu structure with real data
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
      label: 'Mi Dashboard',
      icon: Home,
      description: 'Vista general y resumen',
      gradient: 'from-sky-500 to-blue-600',
      route: '/dashboard/socio'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      description: 'Datos personales y membresía',
      gradient: 'from-emerald-500 to-teal-600',
      route: '/dashboard/socio/perfil',
      submenu: [
        { 
          id: 'perfil-datos', 
          label: 'Datos Personales', 
          icon: User,
          route: '/dashboard/socio/perfil'
        },
      ]
    },
    {
      id: 'beneficios',
      label: 'Mis Beneficios',
      icon: Gift,
      description: 'Catálogo y ofertas disponibles',
      gradient: 'from-purple-500 to-indigo-600',
      route: '/dashboard/socio/beneficios',
      badge: realtimeStats.totalBeneficios > 0 ? realtimeStats.totalBeneficios : undefined,
      submenu: [
        { 
          id: 'beneficios-disponibles', 
          label: 'Beneficios Disponibles', 
          icon: Gift,
          count: realtimeStats.totalBeneficios,
          route: '/dashboard/socio/beneficios'
        },
      ]
    },
    {
      id: 'validar',
      label: 'Validar Beneficio',
      icon: QrCode,
      description: 'Escáner QR para canjear',
      gradient: 'from-teal-500 to-cyan-600',
      route: '/dashboard/socio/validar'
    },
    {
      id: 'historial',
      label: 'Mi Historial',
      icon: History,
      description: 'Registro de beneficios usados',
      gradient: 'from-amber-500 to-orange-600',
      route: '/dashboard/socio/historial',
      badge: realtimeStats.beneficiosUsados > 0 ? realtimeStats.beneficiosUsados : undefined
    }
  ];

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['perfil']));

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
    return activeSection === itemId || activeSection.startsWith(itemId + '-') || pathname.includes(itemId);
  };

  const isSubmenuItemActive = (subItem: SubmenuItem) => {
    const currentPath = pathname;
    
    // Direct route match
    if (currentPath === subItem.route) {
      return true;
    }
    
    // Check for tab-based routes
    const routeParts = subItem.route.split('?');
    const routePath = routeParts[0];
    
    if (currentPath === routePath) {
      const routeParams = new URLSearchParams(routeParts[1] || '');
      
      // Check if all route parameters match current parameters
      for (const [key, value] of routeParams.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      
      return true;
    }
    
    return false;
  };

  const getItemGradient = (item: typeof menuItems[0]) => {
    return item.gradient || 'from-gray-500 to-gray-600';
  };

  const getMembershipStatus = () => {
    const estado = realtimeStats.estadoMembresia;
    switch (estado) {
      case 'al_dia':
        return { color: 'emerald', text: 'Socio Activo', icon: CheckCircle };
      case 'vencido':
        return { color: 'red', text: 'Membresía Vencida', icon: AlertCircle };
      case 'pendiente':
        return { color: 'amber', text: 'Pendiente', icon: AlertCircle };
      default:
        return { color: 'gray', text: 'Estado Desconocido', icon: AlertCircle };
    }
  };

  const membershipStatus = getMembershipStatus();

  // Show loading state
  if (socioLoading) {
    return <SocioSidebarSkeleton {...{ open, onToggle, onMenuClick, onLogoutClick, activeSection }} />;
  }

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
                  <User className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">Portal Socio</h2>
                  <p className="text-sm text-sky-100 truncate max-w-32">
                    {socio?.nombre || user?.nombre || 'Mi Portal'}
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
            {/* Membership Status */}
            <div className="bg-white rounded-2xl p-3 mb-3 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <membershipStatus.icon className={`w-3 h-3 text-${membershipStatus.color}-500`} />
                  <span className={`text-sm font-medium text-${membershipStatus.color}-700`}>
                    {membershipStatus.text}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600">
                    {socio?.numeroSocio || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                <span>Ahorro Total: ${realtimeStats.ahorroTotal.toFixed(2)}</span>
                <span>Usos: {realtimeStats.beneficiosUsados}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                className="bg-white rounded-2xl p-3 text-center shadow-lg border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Gift className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-lg font-black text-purple-600">{realtimeStats.totalBeneficios}</div>
                </div>
                <div className="text-xs text-gray-600 font-medium">Disponibles</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-2xl p-3 text-center shadow-lg border border-gray-100"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <History className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-lg font-black text-amber-600">{realtimeStats.beneficiosUsados}</div>
                </div>
                <div className="text-xs text-gray-600 font-medium">Usados</div>
              </motion.div>
            </div>
            
            {/* Activity indicator */}
            <motion.div 
              className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-3 h-3" />
              <span>Datos en tiempo real</span>
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
                  {(socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'}
                </span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {socio?.nombre || user?.nombre || 'Socio'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {socio?.email || user?.email || 'socio@email.com'}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-2 h-2 bg-${membershipStatus.color}-500 rounded-full animate-pulse`}></div>
                  <span className={`text-xs text-${membershipStatus.color}-600 font-medium`}>
                    {membershipStatus.text}
                  </span>
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

// Main component with Suspense boundary
export const SocioSidebar: React.FC<SocioSidebarProps> = (props) => {
  return (
    <Suspense fallback={<SocioSidebarSkeleton {...props} />}>
      <SocioSidebarContent {...props} />
    </Suspense>
  );
};

export default SocioSidebar;