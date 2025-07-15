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
  AlertCircle,
  CheckCircle,
  Bell,
  HelpCircle,
  Star,
  Zap
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
  ahorroTotal: number;
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
  
  // Optimized state management
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalBeneficios: 0,
    beneficiosUsados: 0,
    ahorroTotal: 0,
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

  // Optimized stats calculation
  const memoizedStats = useMemo(() => ({
    totalBeneficios: beneficiosActivos?.length || 0,
    beneficiosUsados: estadisticas?.totalValidaciones || estadisticasRapidas?.usados || 0,
    ahorroTotal: estadisticas?.ahorroTotal || estadisticasRapidas?.ahorroTotal || 0,
    estadoMembresia: socio?.estadoMembresia || 'pendiente',
    actividadReciente: estadisticas?.totalValidaciones || 0,
    beneficiosEstesMes: estadisticasRapidas?.ahorroEsteMes || 0
  }), [
    beneficiosActivos?.length,
    estadisticas?.totalValidaciones,
    estadisticas?.ahorroTotal,
    estadisticasRapidas?.usados,
    estadisticasRapidas?.ahorroTotal,
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
      const ahorroCalculado = validaciones.reduce((total, v) => total + (v.montoDescuento || 0), 0);
      
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
        ahorroTotal: ahorroCalculado,
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

  // Get membership status
  const membershipStatus = useMemo(() => {
    const estado = realtimeStats.estadoMembresia;
    switch (estado) {
      case 'al_dia':
        return { 
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200', 
          text: 'Activo', 
          icon: CheckCircle,
          dot: 'bg-emerald-500'
        };
      case 'vencido':
        return { 
          color: 'text-red-600 bg-red-50 border-red-200', 
          text: 'Vencido', 
          icon: AlertCircle,
          dot: 'bg-red-500'
        };
      case 'pendiente':
        return { 
          color: 'text-amber-600 bg-amber-50 border-amber-200', 
          text: 'Pendiente', 
          icon: AlertCircle,
          dot: 'bg-amber-500'
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-50 border-gray-200', 
          text: 'Desconocido', 
          icon: AlertCircle,
          dot: 'bg-gray-500'
        };
    }
  }, [realtimeStats.estadoMembresia]);

  // Loading skeleton
  if (socioLoading) {
    return (
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 space-y-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
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
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${membershipStatus.dot} rounded-full border-2 border-white`}></div>
              </div>
              
              {open && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {socio?.nombre || user?.nombre || 'Socio'}
                  </h2>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${membershipStatus.color}`}>
                    <membershipStatus.icon className="w-3 h-3 mr-1" />
                    {membershipStatus.text}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <SocioSidebarStats
            totalBeneficios={realtimeStats.totalBeneficios}
            ahorroTotal={realtimeStats.ahorroTotal}
            beneficiosUsados={realtimeStats.beneficiosUsados}
            beneficiosEstesMes={realtimeStats.beneficiosEstesMes}
            isOpen={open}
          />

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = isActiveItem(item);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.route, item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${!open && 'lg:justify-center lg:px-2'}
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                    ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}
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
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full min-w-[20px]">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          {open && (
            <div className="p-4 border-t border-gray-100">
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
          <div className="p-4 border-t border-gray-100">
            {open ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {socio?.nombre || user?.nombre || 'Socio'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      #{socio?.numeroSocio || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                
                <button
                  onClick={onLogoutClick}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogoutClick}
                className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export { SocioSidebar };
export default SocioSidebar;