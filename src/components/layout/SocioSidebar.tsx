'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  User, 
  Gift, 
  QrCode, 
  History,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  Star,
  Menu,
  Sparkles,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficiosSocio } from '@/hooks/useBeneficios';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SocioSidebarStats from '@/components/socio/SocioSidebarStats';

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
  estadoMembresia: string;
  actividadReciente: number;
  beneficiosEstesMes: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  isNew?: boolean;
  description?: string;
}

const SocioSidebar: React.FC<SocioSidebarProps> = ({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { socio, estadisticas, loading: socioLoading } = useSocioProfile();
  const { beneficiosActivos, estadisticasRapidas } = useBeneficiosSocio();
  
  // Optimized state management without savings
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalBeneficios: 0,
    beneficiosUsados: 0,
    estadoMembresia: 'pendiente',
    actividadReciente: 0,
    beneficiosEstesMes: 0
  });

  // Memoized menu items to prevent unnecessary re-renders
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      route: '/dashboard/socio',
      description: 'Vista general'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      route: '/dashboard/socio/perfil',
      description: 'Información personal'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      route: '/dashboard/socio/beneficios',
      badge: realtimeStats.totalBeneficios,
      description: 'Ofertas disponibles'
    },
    {
      id: 'asociaciones',
      label: 'Asociaciones',
      icon: Building2,
      route: '/dashboard/socio/asociaciones',
      description: 'Organizaciones disponibles'
    },
    {
      id: 'validar',
      label: 'Validar QR',
      icon: QrCode,
      route: '/dashboard/socio/validar',
      isNew: true,
      description: 'Escanear código'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      route: '/dashboard/socio/historial',
      badge: realtimeStats.beneficiosUsados,
      description: 'Beneficios usados'
    }
  ], [realtimeStats.totalBeneficios, realtimeStats.beneficiosUsados]);

  // Optimized stats calculation without savings
  const memoizedStats = useMemo(() => ({
    totalBeneficios: beneficiosActivos?.length || 0,
    beneficiosUsados: estadisticas?.totalValidaciones || estadisticasRapidas?.usados || 0,
    estadoMembresia: socio?.estadoMembresia || 'pendiente',
    actividadReciente: estadisticas?.totalValidaciones || 0,
    beneficiosEstesMes: estadisticasRapidas?.ahorroEsteMes || 0
  }), [
    beneficiosActivos?.length,
    estadisticas?.totalValidaciones,
    estadisticasRapidas?.usados,
    estadisticasRapidas?.ahorroEsteMes,
    socio?.estadoMembresia
  ]);

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

    const validacionesRef = collection(db, 'validaciones');
    const validacionesQuery = query(validacionesRef, where('socioId', '==', user.uid));
    
    const unsubscribe = onSnapshot(validacionesQuery, (snapshot) => {
      const validaciones = snapshot.docs.map(doc => doc.data());
      const totalValidaciones = validaciones.length;
      
      // Get current month validations
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const beneficiosEstesMes = validaciones.filter(v => {
        const validacionDate = v.fechaValidacion?.toDate?.() || new Date(v.fechaValidacion);
        return validacionDate.getMonth() === currentMonth && validacionDate.getFullYear() === currentYear;
      }).length;
      
      setRealtimeStats(prev => ({
        ...prev,
        beneficiosUsados: totalValidaciones,
        actividadReciente: totalValidaciones,
        beneficiosEstesMes
      }));
    }, (error) => {
      console.error('Error listening to validaciones:', error);
    });

    return () => unsubscribe();
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

  // Modern loading skeleton
  if (socioLoading) {
    return (
      <div className={`
        fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-2xl z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-4 space-y-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modern mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={onToggle}
        />
      )}

      {/* Modern Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-2xl z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Modern Header */}
        <div className="px-4 py-4 border-b border-gray-100/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg">
                <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {open && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-gray-900 truncate">
                  {socio?.nombre || user?.nombre || 'Socio'}
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  #{socio?.numeroSocio || 'N/A'}
                </p>
              </div>
            )}
            
            {/* Mobile toggle button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modern Stats */}
        <SocioSidebarStats
          totalBeneficios={realtimeStats.totalBeneficios}
          beneficiosUsados={realtimeStats.beneficiosUsados}
          beneficiosEstesMes={realtimeStats.beneficiosEstesMes}
          isOpen={open}
        />

        {/* Modern Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-2 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const isActive = isActiveItem(item);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.route, item.id)}
                className={`
                  group w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-left transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-lg transform scale-[1.02]' 
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
                  }
                  ${!open && 'lg:justify-center lg:px-2'}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                    : 'text-gray-500 group-hover:bg-gradient-to-r group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-600'
                  }
                `}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                {open && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold truncate">{item.label}</span>
                        {item.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Nuevo
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate font-medium">{item.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-black text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full min-w-[20px] shadow-lg">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? 'text-blue-600 transform rotate-90' : 'text-gray-400 group-hover:text-blue-500'
                      }`} />
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Modern Quick Actions */}
        {open && (
          <div className="px-3 py-3 border-t border-gray-100/50 flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-xl transition-all duration-300 hover:shadow-md">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Alertas</span>
              </button>
              
              <button className="flex items-center justify-center space-x-2 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all duration-300 hover:shadow-md">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ayuda</span>
              </button>
            </div>
          </div>
        )}

        {/* Modern User Section */}
        <div className="px-3 py-4 border-t border-gray-100/50 flex-shrink-0">
          {open ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-sm">
                    {(socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {socio?.nombre || user?.nombre || 'Socio'}
                  </p>
                  <p className="text-xs text-gray-500 truncate font-medium">
                    Socio #{socio?.numeroSocio || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-600">VIP</span>
                </div>
              </div>
              
              <button
                onClick={onLogoutClick}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-300 border border-red-200/50 hover:border-red-300 hover:shadow-lg font-bold"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogoutClick}
              className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-300 hover:shadow-lg"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export { SocioSidebar };
export default SocioSidebar;