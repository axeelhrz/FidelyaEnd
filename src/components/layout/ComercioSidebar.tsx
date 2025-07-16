'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Store, 
  Gift, 
  QrCode, 
  Users, 
  UserCheck,
  Plus,
  LogOut,
  ChevronRight,
  CheckCircle,
  Activity,
  BarChart3,
  Bell,
  HelpCircle,
  Star,
  Zap,
  Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ComercioSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick?: () => void;
  activeSection: string;
}

interface RealtimeStats {
  validacionesHoy: number;
  validacionesMes: number;
  beneficiosActivos: number;
  clientesUnicos: number;
  qrGenerado: boolean;
  qrEscaneos: number;
  qrEscaneosSemana: number;
  actividadReciente: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  isNew?: boolean;
  description?: string;
  submenu?: SubmenuItem[];
}

interface SubmenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  count?: number;
  urgent?: boolean;
}

export const ComercioSidebar: React.FC<ComercioSidebarProps> = ({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { comercio, stats, loading: comercioLoading } = useComercio();
  
  // Optimized state management
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    validacionesHoy: 0,
    validacionesMes: 0,
    beneficiosActivos: 0,
    clientesUnicos: 0,
    qrGenerado: false,
    qrEscaneos: 0,
    qrEscaneosSemana: 0,
    actividadReciente: 0
  });

  // Memoized menu items to prevent unnecessary re-renders
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard/comercio',
      description: 'Vista general'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: Store,
      route: '/dashboard/comercio/perfil',
      description: 'Información del comercio'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      route: '/dashboard/comercio/beneficios',
      badge: realtimeStats.beneficiosActivos,
      description: 'Gestionar ofertas',
      submenu: [
        { 
          id: 'beneficios-lista', 
          label: 'Mis Beneficios', 
          icon: Gift,
          count: realtimeStats.beneficiosActivos,
          route: '/dashboard/comercio/beneficios'
        },
        { 
          id: 'beneficios-crear', 
          label: 'Crear Beneficio', 
          icon: Plus,
          route: '/dashboard/comercio/beneficios?action=crear'
        }
      ]
    },
    {
      id: 'qr',
      label: 'Código QR',
      icon: QrCode,
      route: '/dashboard/comercio/qr',
      badge: realtimeStats.qrEscaneos,
      description: 'Gestión de QR',
      submenu: [
        { 
          id: 'qr-generar', 
          label: 'Generar QR', 
          icon: QrCode,
          route: '/dashboard/comercio/qr/generar'
        },
        { 
          id: 'qr-estadisticas', 
          label: 'Estadísticas', 
          icon: Activity,
          count: realtimeStats.qrEscaneos,
          route: '/dashboard/comercio/qr/estadisticas'
        }
      ]
    },
    {
      id: 'validaciones',
      label: 'Validaciones',
      icon: UserCheck,
      route: '/dashboard/comercio/validaciones',
      badge: realtimeStats.validacionesHoy,
      description: 'Historial de validaciones'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      route: '/dashboard/comercio/clientes',
      badge: realtimeStats.clientesUnicos,
      description: 'Gestión de clientes'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      route: '/dashboard/comercio/analytics',
      isNew: true,
      description: 'Métricas y reportes'
    }
  ], [realtimeStats]);

  // Optimized stats calculation
  const memoizedStats = useMemo(() => ({
    validacionesHoy: stats?.validacionesHoy || 0,
    validacionesMes: stats?.validacionesMes || 0,
    beneficiosActivos: stats?.beneficiosActivos || 0,
    clientesUnicos: stats?.clientesUnicos || 0,
    qrGenerado: !!comercio?.qrCode,
    qrEscaneos: 0,
    qrEscaneosSemana: 0,
    actividadReciente: 0
  }), [stats, comercio]);

  // Update stats only when memoized values change
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      ...memoizedStats
    }));
  }, [memoizedStats]);

  // Optimized Firebase listener with cleanup
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribers: (() => void)[] = [];

    try {
      // Listen to validaciones collection
      const validacionesRef = collection(db, 'validaciones');
      const validacionesQuery = query(
        validacionesRef, 
        where('comercioId', '==', user.uid),
        orderBy('fechaHora', 'desc'),
        limit(100)
      );
      
      const unsubscribeValidaciones = onSnapshot(validacionesQuery, (snapshot) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const validacionesHoy = snapshot.docs.filter(doc => {
          const data = doc.data();
          const fechaValidacion = data.fechaHora?.toDate();
          return fechaValidacion && fechaValidacion >= today;
        }).length;

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const validacionesMes = snapshot.docs.filter(doc => {
          const data = doc.data();
          const fechaValidacion = data.fechaHora?.toDate();
          return fechaValidacion && fechaValidacion >= thisMonth;
        }).length;

        const clientesUnicos = new Set(
          snapshot.docs.map(doc => doc.data().socioId)
        ).size;
        
        setRealtimeStats(prev => ({
          ...prev,
          validacionesHoy,
          validacionesMes,
          clientesUnicos
        }));
      }, (error) => {
        console.error('Error listening to validaciones:', error);
      });
      unsubscribers.push(unsubscribeValidaciones);

      // Listen to beneficios collection
      const beneficiosRef = collection(db, 'beneficios');
      const beneficiosQuery = query(
        beneficiosRef, 
        where('comercioId', '==', user.uid),
        where('estado', '==', 'activo')
      );
      
      const unsubscribeBeneficios = onSnapshot(beneficiosQuery, (snapshot) => {
        setRealtimeStats(prev => ({
          ...prev,
          beneficiosActivos: snapshot.docs.length
        }));
      }, (error) => {
        console.error('Error listening to beneficios:', error);
      });
      unsubscribers.push(unsubscribeBeneficios);

    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  // Optimized navigation handler
  const handleNavigation = useCallback((route: string, itemId: string) => {
    if (pathname !== route) {
      router.push(route);
    }
    onMenuClick(itemId);
  }, [router, pathname, onMenuClick]);

  // Check if menu item is active
  const isActiveItem = useCallback((item: MenuItem) => {
    return pathname === item.route || activeSection === item.id;
  }, [pathname, activeSection]);

  // Check if submenu item is active
  const isSubmenuItemActive = useCallback((subItem: SubmenuItem) => {
    const currentPath = pathname;
    const currentAction = searchParams.get('action');
    
    // Direct route match
    if (currentPath === subItem.route) {
      return true;
    }
    
    // Check for action-based routes
    if (subItem.id === 'beneficios-crear' && currentAction === 'crear') {
      return true;
    }
    
    return false;
  }, [pathname, searchParams]);

  // Auto-expand menu items that have active sub-items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Update expanded items based on current route
  useEffect(() => {
    const newExpanded = new Set<string>();
    
    menuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveSubItem = item.submenu.some(subItem => isSubmenuItemActive(subItem));
        if (hasActiveSubItem || isActiveItem(item)) {
          newExpanded.add(item.id);
        }
      }
    });
    
    setExpandedItems(newExpanded);
  }, [pathname, searchParams, isActiveItem, isSubmenuItemActive, menuItems]);

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
      handleNavigation(route, itemId);
    } else {
      onMenuClick(itemId);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      try {
        await signOut();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  };

  // Loading skeleton
  if (comercioLoading) {
    return (
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-4 space-y-3">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            
            {open && (
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {comercio?.nombreComercio || user?.nombre || 'Comercio'}
                </h2>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border text-emerald-600 bg-emerald-50 border-emerald-200">
                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                  Activo
                </div>
              </div>
            )}
            
            {/* Mobile toggle button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Compact Quick Stats */}
        {open && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                <div className="flex items-center justify-between mb-1">
                  <UserCheck className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">{realtimeStats.validacionesHoy}</span>
                </div>
                <p className="text-xs text-purple-600/80 font-medium">Hoy</p>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">{realtimeStats.beneficiosActivos}</span>
                </div>
                <p className="text-xs text-emerald-600/80 font-medium">Activos</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-2.5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">Este mes</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{realtimeStats.validacionesMes}</span>
                    <span className="ml-1">validaciones</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{realtimeStats.clientesUnicos}</span>
                    <span className="ml-1">clientes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const isActive = isActiveItem(item);
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id, !!item.submenu, item.route)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${!open && 'lg:justify-center lg:px-2'}
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-7 h-7 rounded-md transition-colors
                    ${isActive ? 'bg-purple-100 text-purple-600' : 'text-gray-500'}
                  `}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  
                  {open && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate text-sm">{item.label}</span>
                          {item.isNew && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Zap className="w-2.5 h-2.5 mr-0.5" />
                              Nuevo
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-purple-500 rounded-full min-w-[18px]">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {item.submenu && (
                          <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${
                            expandedItems.has(item.id) ? 'rotate-90' : ''
                          } ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </>
                  )}
                </button>

                {/* Compact Submenu */}
                {item.submenu && expandedItems.has(item.id) && open && (
                  <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleMenuClick(subItem.id, false, subItem.route)}
                        className={`
                          w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all duration-200
                          ${isSubmenuItemActive(subItem)
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2.5 flex-1">
                          <div className={`p-1 rounded-md transition-all duration-200 ${
                            isSubmenuItemActive(subItem)
                              ? 'bg-purple-100 text-purple-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <subItem.icon className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium truncate">{subItem.label}</span>
                        </div>
                        
                        {subItem.count !== undefined && subItem.count > 0 && (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-gray-500 rounded-full min-w-[16px]">
                            {subItem.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Compact Quick Actions */}
        {open && (
          <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notificaciones</span>
              </button>
              
              <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Ayuda</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact User Section */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          {open ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2.5 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(comercio?.nombreComercio || user?.nombre)?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {comercio?.nombreComercio || user?.nombre || 'Comercio'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'comercio@email.com'}
                  </p>
                </div>
                <Star className="w-3 h-3 text-amber-400" />
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ComercioSidebar;