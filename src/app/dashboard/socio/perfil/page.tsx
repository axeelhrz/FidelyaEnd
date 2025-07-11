'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3,
  Shield,
  QrCode,
  Award,
  TrendingUp,
  Gift,
  DollarSign,
  Store,
  Zap,
  Star,
  Crown,
  Sparkles,
  Loader2,
  Save,
  X,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Interfaces
interface ProfileFormData {
  nombre: string;
  telefono: string;
  dni: string;
  direccion: string;
  fechaNacimiento: string;
}

// Utility functions
const getStatusColor = (estado: string) => {
  switch (estado) {
    case 'activo':
      return 'bg-emerald-500';
    case 'vencido':
      return 'bg-amber-500';
    case 'pendiente':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (estado: string) => {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'vencido':
      return 'Vencido';
    case 'pendiente':
      return 'Pendiente';
    default:
      return 'Inactivo';
  }
};

const getNivelIcon = (nivel: string) => {
  switch (nivel) {
    case 'Bronze':
      return <Award className="w-4 h-4 text-amber-600" />;
    case 'Silver':
      return <Star className="w-4 h-4 text-gray-500" />;
    case 'Gold':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'Platinum':
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case 'Diamond':
      return <Zap className="w-4 h-4 text-blue-500" />;
    default:
      return <Award className="w-4 h-4 text-gray-400" />;
  }
};

const getNivelGradient = (nivel: string) => {
  switch (nivel) {
    case 'Bronze':
      return 'from-amber-500 to-orange-600';
    case 'Silver':
      return 'from-gray-400 to-gray-600';
    case 'Gold':
      return 'from-yellow-400 to-yellow-600';
    case 'Platinum':
      return 'from-purple-400 to-purple-600';
    case 'Diamond':
      return 'from-blue-400 to-blue-600';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

// Helper function to convert Firebase Timestamp to Date
const convertToDate = (value: Date | Timestamp | string | undefined): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') return new Date(value);
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: number;
  subtitle?: string;
}> = ({ title, value, icon, color, change, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
        {icon}
      </div>
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
          change >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
        )}>
          <TrendingUp size={10} className={change >= 0 ? "text-emerald-600" : "text-red-600 rotate-180"} />
          {Math.abs(change)}%
        </div>
      )}
    </div>
    
    <div className="space-y-1">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs font-medium text-gray-600">{title}</div>
      {subtitle && (
        <div className="text-xs text-gray-500">{subtitle}</div>
      )}
    </div>
  </motion.div>
);

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

// Main component
export default function SocioPerfilPage() {
  const { user, signOut } = useAuth();
  const { 
    socio, 
    estadisticas, 
    loading, 
    updateProfile, 
    refreshData,
  } = useSocioProfile();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // UI states
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Profile data with safe fallbacks
  const profileData = useMemo(() => {
    const fechaNacimientoDate = convertToDate(socio?.fechaNacimiento);
    const creadoEnDate = convertToDate(socio?.creadoEn) || new Date();
    
    return {
      nombre: socio?.nombre || user?.nombre || 'Usuario',
      email: socio?.email || user?.email || '',
      telefono: socio?.telefono || '',
      dni: socio?.dni || '',
      direccion: socio?.direccion || '',
      fechaNacimiento: fechaNacimientoDate,
      estado: socio?.estado || 'activo',
      creadoEn: creadoEnDate,
      numeroSocio: socio?.numeroSocio || '',
      nivel: {
        nivel: 'Bronze' as const,
        puntos: Math.floor(estadisticas.totalValidaciones * 10),
        puntosParaProximoNivel: 1000,
        proximoNivel: 'Silver',
      }
    };
  }, [socio, user, estadisticas]);

  // Enhanced stats with real Firebase data
  const enhancedStats = useMemo(() => {
    const creadoEnDate = convertToDate(profileData.creadoEn);
    const tiempoComoSocio = creadoEnDate ? differenceInDays(new Date(), creadoEnDate) : 0;
    
    return {
      beneficiosUsados: estadisticas.totalValidaciones || 0,
      ahorroTotal: estadisticas.ahorroTotal || 0,
      comerciosVisitados: estadisticas.comerciosFavoritos?.length || 0,
      tiempoComoSocio,
      beneficiosEsteMes: estadisticas.validacionesPorMes?.[0]?.validaciones || 0,
      ahorroEsteMes: estadisticas.validacionesPorMes?.[0]?.ahorro || 0,
    };
  }, [estadisticas, profileData.creadoEn]);

  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: profileData.nombre,
    telefono: profileData.telefono,
    dni: profileData.dni,
    direccion: profileData.direccion,
    fechaNacimiento: profileData.fechaNacimiento 
      ? format(profileData.fechaNacimiento, 'yyyy-MM-dd')
      : ''
  });

  // Update form data when socio data changes
  useEffect(() => {
    if (socio) {
      const fechaNacimientoDate = convertToDate(socio.fechaNacimiento);
      setFormData({
        nombre: socio.nombre || '',
        telefono: socio.telefono || '',
        dni: socio.dni || '',
        direccion: socio.direccion || '',
        fechaNacimiento: fechaNacimientoDate 
          ? format(fechaNacimientoDate, 'yyyy-MM-dd')
          : ''
      });
    }
  }, [socio]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshData();
      toast.success('Datos actualizados');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Error al actualizar');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshData, refreshing]);

  const handleSaveProfile = useCallback(async () => {
    setUpdating(true);
    try {
      const updateData = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        dni: formData.dni,
        direccion: formData.direccion,
        fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : undefined
      };
      
      const success = await updateProfile(updateData);
      if (success) {
        setEditModalOpen(false);
        toast.success('Perfil actualizado');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  }, [formData, updateProfile]);

  // Logout handlers
  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        activeSection="perfil"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Cargando perfil
            </h2>
            <p className="text-gray-600">
              Obteniendo tu información...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        activeSection="perfil"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header Background */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-4 right-4">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </div>
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
                  <div className="flex items-end space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <User size={32} className="text-white" />
                        </div>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(profileData.estado)} rounded-full border-2 border-white`}></div>
                    </div>

                    {/* Profile Info */}
                    <div className="pb-2">
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {profileData.nombre}
                      </h1>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-gray-600">
                          Socio #{profileData.numeroSocio}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {getStatusText(profileData.estado)}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${getNivelGradient(profileData.nivel.nivel)} text-white text-sm font-medium shadow-sm`}>
                        {getNivelIcon(profileData.nivel.nivel)}
                        <span>{profileData.nivel.nivel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-4 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<QrCode size={16} />}
                      onClick={() => setQrModalOpen(true)}
                    >
                      Mi QR
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Edit3 size={16} />}
                      onClick={() => setEditModalOpen(true)}
                    >
                      Editar Perfil
                    </Button>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progreso a {profileData.nivel.proximoNivel}
                    </span>
                    <span className="text-sm text-gray-600">
                      {profileData.nivel.puntos} / {profileData.nivel.puntosParaProximoNivel} pts
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className={`h-2 rounded-full bg-gradient-to-r ${getNivelGradient(profileData.nivel.proximoNivel)}`}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(profileData.nivel.puntos / profileData.nivel.puntosParaProximoNivel) * 100}%` 
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatsCard
                    title="Beneficios Usados"
                    value={enhancedStats.beneficiosUsados}
                    icon={<Gift size={20} />}
                    color="bg-emerald-500"
                    subtitle="Total"
                  />
                  <StatsCard
                    title="Ahorro Total"
                    value={`$${enhancedStats.ahorroTotal.toLocaleString()}`}
                    icon={<DollarSign size={20} />}
                    color="bg-green-500"
                    subtitle="Acumulado"
                  />
                  <StatsCard
                    title="Comercios"
                    value={enhancedStats.comerciosVisitados}
                    icon={<Store size={20} />}
                    color="bg-blue-500"
                    subtitle="Visitados"
                  />
                  <StatsCard
                    title="Días como Socio"
                    value={enhancedStats.tiempoComoSocio}
                    icon={<Calendar size={20} />}
                    color="bg-purple-500"
                    subtitle="Desde registro"
                  />
                </div>
              </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 size={16} />}
                    onClick={() => setEditModalOpen(true)}
                  >
                    Editar
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-900">{profileData.email}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Teléfono</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-900">{profileData.telefono || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">DNI</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield size={16} className="text-gray-500" />
                        <span className="text-gray-900">{profileData.dni || 'No especificado'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Dirección</label>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="text-gray-900">{profileData.direccion || 'No especificado'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {profileData.fechaNacimiento && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Fecha de Nacimiento</label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="text-gray-900">
                        {format(profileData.fechaNacimiento, 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Sidebar - Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                
                {estadisticas.beneficiosMasUsados.length > 0 ? (
                  <div className="space-y-3">
                    {estadisticas.beneficiosMasUsados.slice(0, 5).map((beneficio, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {beneficio.usos}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{beneficio.titulo}</div>
                          <div className="text-xs text-gray-500">{beneficio.usos} usos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">No hay actividad reciente</p>
                    <p className="text-gray-500 text-xs mt-1">Comienza a usar beneficios para ver tu actividad</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Edit3 size={20} />
                Editar Perfil
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                label="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Tu nombre completo"
                required
              />

              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Tu número de teléfono"
              />

              <Input
                label="DNI"
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                placeholder="Tu número de documento"
              />

              <Input
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Tu dirección"
              />

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                leftIcon={<X size={16} />}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveProfile}
                loading={updating}
                leftIcon={<Save size={16} />}
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Modal */}
        <Dialog open={qrModalOpen} onClose={() => setQrModalOpen(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <QrCode size={20} />
                Mi Código QR
              </DialogTitle>
            </DialogHeader>

            <div className="text-center py-6">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <QrCode size={64} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {profileData.nombre}
              </h3>
              <p className="text-gray-600 mb-4">
                Socio #{profileData.numeroSocio}
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Muestra este código QR en comercios para validar tus beneficios
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setQrModalOpen(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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