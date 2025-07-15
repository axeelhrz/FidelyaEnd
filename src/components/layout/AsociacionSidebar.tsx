'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Users, 
  Store, 
  BarChart3, 
  Gift,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Activity,
  Building2,
  Bell,
  HelpCircle,
  Star,
  Zap,
  Clock,
  UserCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSidebarNavigation } from '@/hooks/useSidebarNavigation';

interface AsociacionSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
  isMobile?: boolean;
}

interface RealtimeStats {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalComercios: number;
  comerciosActivos: number;
  solicitudesPendientes: number;
  actividadReciente: number;
  beneficiosActivos: number;
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

export const AsociacionSidebar: React.FC<AsociacionSidebarProps> = ({
  open,
  onMenuClick,
  onLogoutClick,
  activeSection,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { stats } = useSocios();
  const { stats: comerciosStats } = useComercios();
  
  // Use the custom navigation hook
  const { navigate } = useSidebarNavigation({
    onMenuClick,
    debounceMs: 150
  });

  // Optimized state management
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalSocios: 0,
    sociosActivos: 0,
    sociosVencidos: 0,
    totalComercios: 0,
    comerciosActivos: 0,
    solicitudesPendientes: 0,
    actividadReciente: 0,
    beneficiosActivos: 0
  });

  // Memoized menu items to prevent unnecessary re-renders
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard/asociacion',
      description: 'Vista general'
    },
    {
      id: 'socios',
      label: 'Gestión de Socios',
      icon: Users,
      route: '/dashboard/asociacion/socios',
      badge: realtimeStats.totalSocios,
      description: 'Administrar miembros',
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
      route: '/dashboard/asociacion/comercios',
      badge: realtimeStats.comerciosActivos,
      description: 'Red de comercios afiliados',
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
      route: '/dashboard/asociacion/beneficios',
      badge: realtimeStats.beneficiosActivos,
      description: 'Ofertas y promociones',
      submenu: [
        { 
          id: 'beneficios-lista', 
          label: 'Todos los Beneficios', 
          icon: Gift,
          count: realtimeStats.beneficiosActivos,
          route: '/dashboard/asociacion/beneficios'
        },
        { 
          id: 'beneficios-crear', 
          label: 'Crear Beneficio', 
          icon: Plus,
          route: '/dashboard/asociacion/beneficios?action=crear'
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
      route: '/dashboard/asociacion/analytics',
      isNew: true,
      description: 'Métricas y análisis'
    }
  ], [realtimeStats]);

  // Optimized stats calculation
  const memoizedStats = useMemo(() => ({
    totalSocios: stats?.total || 0,
    sociosActivos: stats?.activos || 0,
    sociosVencidos: stats?.vencidos || 0,
    totalComercios: comerciosStats?.totalComercios || 0,
    comerciosActivos: comerciosStats?.comerciosActivos || 0,
    solicitudesPendientes: comerciosStats?.solicitudesPendientes || 0,
    actividadReciente: 0,
    beneficiosActivos: 0
  }), [stats, comerciosStats]);

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
      const comerciosQuery = query(comerciosRef, where('asociacionesVinculadas', 'array-contains', user.uid));
      
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

      // Listen to beneficios collection
      const beneficiosRef = collection(db, 'beneficios');
      const beneficiosQuery = query(
        beneficiosRef, 
        where('asociacionesDisponibles', 'array-contains', user.uid),
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

      // Listen to recent activity
      const activityRef = collection(db, 'validaciones');
      const activityQuery = query(
        activityRef,
        where('asociacionId', '==', user.uid),
        orderBy('fechaHora', 'desc'),
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
  }, [user?.uid]);

  // Auto-expand menu items that have active sub-items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Optimized navigation handler

  // Check if menu item is active
  const isActiveItem = useCallback((item: MenuItem) => {
    return pathname === item.route || activeSection === item.id;
  }, [pathname, activeSection]);

  // Check if submenu item is active
  const isSubmenuItemActive = useCallback((subItem: SubmenuItem) => {
    const currentPath = pathname;
    const currentFilter = searchParams.get('filter');
    const currentTab = searchParams.get('tab');
    const currentAction = searchParams.get('action');
    
    // Direct route match
    if (currentPath === subItem.route) {
      return true;
    }
    
    // Check for filter-based routes
    if (currentPath === '/dashboard/asociacion/socios') {
      if (subItem.id === 'socios-lista' && !currentFilter) return true;
      if (subItem.id === 'socios-activos' && currentFilter === 'activos') return true;
      if (subItem.id === 'socios-vencidos' && currentFilter === 'vencidos') return true;
    }
    
    if (currentPath === '/dashboard/asociacion/comercios') {
      if (subItem.id === 'comercios-vinculados' && !currentFilter) return true;
      if (subItem.id === 'comercios-solicitudes' && currentFilter === 'solicitudes') return true;
    }

    if (currentPath === '/dashboard/asociacion/beneficios') {
      if (subItem.id === 'beneficios-lista' && !currentTab && !currentAction) return true;
      if (subItem.id === 'beneficios-crear' && currentAction === 'crear') return true;
      if (subItem.id === 'beneficios-validaciones' && currentTab === 'validaciones') return true;
    }
    
    return false;
  }, [pathname, searchParams]);

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

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  }, []);

  const handleMenuClick = useCallback((itemId: string, hasSubmenu: boolean = false, route?: string) => {
    if (hasSubmenu) {
      toggleExpanded(itemId);
    } else if (route) {
      // Use the navigation hook instead of direct router calls
      navigate(route, itemId);
    } else {
      onMenuClick(itemId);
    }
  }, [navigate, onMenuClick, toggleExpanded]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          
          {open && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {user?.nombre || 'Asociación'}
              </h2>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border text-emerald-600 bg-emerald-50 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Panel Ejecutivo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {open && (
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-sky-600">{realtimeStats.totalSocios}</p>
                  <p className="text-sm text-sky-600/80">Socios</p>
                </div>
                <Users className="w-8 h-8 text-sky-500" />
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{realtimeStats.comerciosActivos}</p>
                  <p className="text-sm text-emerald-600/80">Comercios</p>
                </div>
                <Store className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Estado actual</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{realtimeStats.sociosActivos}</p>
                  <p className="text-xs text-gray-500">Activos</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{realtimeStats.beneficiosActivos}</p>
                  <p className="text-xs text-gray-500">Beneficios</p>
                </div>
              </div>
            </div>
            
            {realtimeStats.sociosVencidos > 0 && (
              <div className="mt-3 flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Socios vencidos</span>
                </div>
                <span className="text-sm font-semibold text-red-600">{realtimeStats.sociosVencidos}</span>
              </div>
            )}
            
            {realtimeStats.solicitudesPendientes > 0 && (
              <div className="mt-2 flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600">Solicitudes pendientes</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">{realtimeStats.solicitudesPendientes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = isActiveItem(item);
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id, !!item.submenu, item.route)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!open && 'justify-center px-2'}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                  ${isActive ? 'bg-sky-100 text-sky-600' : 'text-gray-500'}
                `}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                {open && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.isNew && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Zap className="w-3 h-3 mr-1" />
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
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-sky-500 rounded-full min-w-[20px]">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {item.submenu && (
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                          expandedItems.has(item.id) ? 'rotate-90' : ''
                        } ${isActive ? 'text-sky-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </>
                )}
              </button>

              {/* Submenu */}
              {item.submenu && expandedItems.has(item.id) && open && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleMenuClick(subItem.id, false, subItem.route)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200
                        ${isSubmenuItemActive(subItem)
                          ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isSubmenuItemActive(subItem)
                            ? 'bg-sky-100 text-sky-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <subItem.icon className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium truncate">{subItem.label}</span>
                      </div>
                      
                      {subItem.count !== undefined && subItem.count > 0 && (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full min-w-[16px] ${
                          subItem.urgent 
                            ? 'text-white bg-red-500' 
                            : 'text-white bg-gray-500'
                        }`}>
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

      {/* Quick Actions */}
      {open && (
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Notificaciones</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Ayuda</span>
            </button>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        {open ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.nombre?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@asociacion.com'}
                </p>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AsociacionSidebar;