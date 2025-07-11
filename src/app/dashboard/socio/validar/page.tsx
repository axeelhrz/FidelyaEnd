'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  QrCode,
  Zap, 
  CheckCircle, 
  Info,
  Clock,
  History,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Gift,
  Users,
  Activity,
  Scan,
  Star,
  Target,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  UserCheck
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { QRScannerButton } from '@/components/socio/QRScannerButton';
import { ValidationResultModal } from '@/components/socio/ValidationResultModal';
import { useAuth } from '@/hooks/useAuth';
import { validacionesService as ValidacionesService } from '@/services/validaciones.service';
import { ValidacionResponse } from '@/types/validacion';
import { BeneficiosService } from '@/services/beneficios.service';
import { Beneficio } from '@/types/beneficio';
// Import Timestamp if using Firebase
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// Sidebar personalizado que maneja el logout
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

interface ValidationStats {
  validacionesHoy: number;
  validacionesExitosas: number;
  ahorroTotal: number;
  ultimaValidacion: Date | null;
  beneficiosDisponibles: number;
  rachaActual: number;
  promedioAhorro: number;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: number;
  subtitle?: string;
  onClick?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Stats Card Component
const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  gradient, 
  change, 
  subtitle, 
  onClick 
}) => (
  <motion.div
    className={cn(
      "bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group",
      onClick && "cursor-pointer hover:-translate-y-1"
    )}
    whileHover={{ y: onClick ? -4 : 0 }}
    onClick={onClick}
    variants={itemVariants}
  >
    {/* Background gradient */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
    
    {/* Shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
            change >= 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
          )}>
            <TrendingUp size={12} className={change >= 0 ? "text-emerald-600" : "text-red-600 rotate-180"} />
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <div className="text-sm font-semibold text-gray-600">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-500">{subtitle}</div>
        )}
      </div>
    </div>
  </motion.div>
);

const SocioValidarContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  
  // Estados para el modal de logout
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Estados para validación - Fixed typing
  const [validationResult, setValidationResult] = useState<ValidacionResponse | null>(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  // Estados para datos
  const [stats, setStats] = useState<ValidationStats>({
    validacionesHoy: 0,
    validacionesExitosas: 0,
    ahorroTotal: 0,
    ultimaValidacion: null,
    beneficiosDisponibles: 0,
    rachaActual: 0,
    promedioAhorro: 0
  });
  const [recentValidations, setRecentValidations] = useState<ValidacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales con manejo de errores mejorado - UPDATED to support socios without association
  const loadInitialData = useCallback(async () => {
    if (!user) {
      console.log('❌ Usuario no disponible');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Cargando datos iniciales para:', user.uid, 'asociación:', user.asociacionId || 'independiente');
      setLoading(true);
      setError(null);
      
      // Cargar datos en paralelo con timeouts
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La carga de datos está tomando demasiado tiempo')), 15000)
      );

      const dataPromises = [
        // Cargar beneficios disponibles con manejo de errores específico - UPDATED
        BeneficiosService.getBeneficiosDisponibles(user.uid, user.asociacionId)
          .catch(error => {
            console.warn('⚠️ Error cargando beneficios, usando datos por defecto:', error);
            return []; // Retornar array vacío en caso de error
          }),
        
        // Cargar historial de validaciones con manejo de errores específico
        ValidacionesService.getHistorialValidaciones(user.uid)
          .then(result => result.validaciones)
          .catch(error => {
            console.warn('⚠️ Error cargando historial, usando datos por defecto:', error);
            return []; // Retornar array vacío en caso de error
          })
      ];

      const [beneficios, historial] = await Promise.race([
        Promise.all(dataPromises),
        timeoutPromise
      ]) as [Beneficio[], ValidacionResponse[]];

      console.log('✅ Datos cargados:', { 
        beneficios: beneficios.length, 
        historial: historial.length 
      });

      // Cast historial to ExtendedValidacionResponse for type safety
      const typedHistorial = historial.map(v => ({
        ...v,
        resultado: v.resultado as 'habilitado' | 'no_habilitado' | 'vencido' | 'suspendido'
      }));

      setRecentValidations(typedHistorial.slice(0, 5)); // Mostrar solo las 5 más recientes

      // Calcular estadísticas de forma segura
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const validacionesHoy = typedHistorial.filter(v => {
        try {
          const validationDateRaw = v.fechaHora ?? null;
          if (!validationDateRaw) return false;
          
          const validationDate =
            typeof validationDateRaw === 'object' &&
            validationDateRaw !== null &&
            typeof (validationDateRaw as { toDate?: () => Date }).toDate === 'function'
              ? (validationDateRaw as { toDate: () => Date }).toDate()
              : new Date(validationDateRaw as Date);
          validationDate.setHours(0, 0, 0, 0);
          return validationDate.getTime() === today.getTime();
        } catch {
          return false;
        }
      }).length;

      const validacionesExitosas = typedHistorial.filter(v => v.resultado === 'habilitado').length;
      
      // Calcular ahorro total de forma segura
      const ahorroTotal = typedHistorial
        .filter(v => v.resultado === 'habilitado')
        .reduce((total, v) => total + (v.montoDescuento || 0), 0);

      const ultimaValidacion = typedHistorial.length > 0 && typedHistorial[0].fechaHora 
        ? (typeof (typedHistorial[0].fechaHora) === 'object' &&
            typedHistorial[0].fechaHora !== null &&
            'toDate' in typedHistorial[0].fechaHora &&
            typeof (typedHistorial[0].fechaHora as { toDate?: () => Date }).toDate === 'function'
            ? (typedHistorial[0].fechaHora as Timestamp).toDate()
            : new Date(typedHistorial[0].fechaHora as string | Date))
        : null;

      // Calcular racha actual (días consecutivos con validaciones)
      const rachaActual = calculateCurrentStreak(typedHistorial);
      
      // Calcular promedio de ahorro
      const promedioAhorro = validacionesExitosas > 0 ? ahorroTotal / validacionesExitosas : 0;

      setStats({
        validacionesHoy,
        validacionesExitosas,
        ahorroTotal,
        ultimaValidacion,
        beneficiosDisponibles: beneficios.length,
        rachaActual,
        promedioAhorro
      });

    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Establecer datos por defecto en caso de error
      setStats({
        validacionesHoy: 0,
        validacionesExitosas: 0,
        ahorroTotal: 0,
        ultimaValidacion: null,
        beneficiosDisponibles: 0,
        rachaActual: 0,
        promedioAhorro: 0
      });
      setRecentValidations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Función para calcular racha actual
  const calculateCurrentStreak = (validations: ValidacionResponse[]): number => {
    if (validations.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    const currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Revisar últimos 30 días
      const hasValidationOnDate = validations.some(v => {
        try {
          const validationDateRaw = v.fechaHora;
          if (!validationDateRaw) return false;
          
          const validationDate = typeof validationDateRaw === 'object' &&
            validationDateRaw !== null &&
            typeof (validationDateRaw as { toDate?: () => Date }).toDate === 'function'
            ? (validationDateRaw as { toDate: () => Date }).toDate()
            : new Date(validationDateRaw as Date);
            
          return validationDate.toDateString() === currentDate.toDateString() && v.resultado === 'habilitado';
        } catch {
          return false;
        }
      });
      
      if (hasValidationOnDate) {
        streak++;
      } else if (streak > 0) {
        break; // Romper la racha si no hay validación en un día
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  // QR Scan handler
  const handleQRScan = useCallback(
    async (qrData: string) => {
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      setScannerLoading(true);
      try {
        console.log('🔍 Procesando QR escaneado:', qrData);
        
        // Parse QR data
        const parsedData = ValidacionesService.parseQRData(qrData);
        if (!parsedData) {
          throw new Error('Código QR inválido o formato no reconocido');
        }

        console.log('✅ QR parseado correctamente:', parsedData);

        // Validate access - UPDATED to support socios without association
        const result = await ValidacionesService.validarAcceso({
          socioId: user.uid,
          comercioId: parsedData.comercioId,
          beneficioId: parsedData.beneficioId,
          asociacionId: user.asociacionId // Can be undefined for independent socios
        });

        console.log('🎯 Resultado de validación:', result);

        // Cast result to ExtendedValidacionResponse for type safety
        const typedResult: ValidacionResponse = {
          ...result,
          resultado: ((result as unknown) as ValidacionResponse).resultado as 'habilitado' | 'no_habilitado' | 'vencido' | 'suspendido',
          socio: (result as unknown as ValidacionResponse).socio ?? (result as { data?: { socio?: ValidacionResponse['socio'] } }).data?.socio ?? null,
          fechaHora: (result as unknown as ValidacionResponse).fechaHora ?? (result as { data?: { validacion?: { fechaHora?: ValidacionResponse['fechaHora'] } } }).data?.validacion?.fechaHora ?? new Date(),
        };

        setValidationResult(typedResult);
        setValidationModalOpen(true);
        
        if (typedResult.resultado === 'habilitado') {
          toast.success('¡Validación exitosa! Beneficio activado');
          // Recargar datos después de una validación exitosa
          loadInitialData();
        } else {
          toast.error(`Validación fallida: ${typedResult.motivo || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('❌ Error validating QR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al validar el código QR';
        toast.error(errorMessage);
      } finally {
        setScannerLoading(false);
      }
    },
    [user, setScannerLoading, setValidationResult, setValidationModalOpen, loadInitialData]
  );

  // Handle QR from URL parameters
  useEffect(() => {
    const qrParam = searchParams.get('qr');
    if (qrParam && user) {
      try {
        const decodedQr = decodeURIComponent(qrParam);
        handleQRScan(decodedQr);
      } catch (error) {
        console.error('Error processing QR from URL:', error);
        toast.error('Error al procesar el código QR de la URL');
      }
    }
  }, [searchParams, user, handleQRScan]);

  // Cargar datos iniciales - UPDATED to support socios without association
  useEffect(() => {
    if (user && user.role === 'socio') {
      loadInitialData();
    } else if (user && user.role !== 'socio') {
      // Redirigir si no es socio
      console.log('❌ Usuario no es socio, redirigiendo...');
      router.push('/dashboard');
    }
  }, [user, loadInitialData, router]);

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

  const handleValidationModalClose = () => {
    setValidationModalOpen(false);
    setValidationResult(null);
    
    // Clear QR parameter from URL if present
    if (searchParams.get('qr')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('qr');
      router.replace(newUrl.pathname + newUrl.search);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadInitialData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'habilitado':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'no_habilitado':
        return <AlertCircle className="text-red-500" size={16} />;
      case 'vencido':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <Info className="text-gray-500" size={16} />;
    }
  };

  const getResultColor = (resultado: string) => {
    switch (resultado) {
      case 'habilitado':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'no_habilitado':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'vencido':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Mostrar error si hay problemas
  if (error && !loading) {
    return (
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 -z-10"></div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div 
              className="text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Error al cargar datos</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw size={16} className="inline mr-2" />
                Reintentar
              </button>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Mostrar loading
  if (loading) {
    return (
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-violet-50/30 -z-10"></div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw size={32} className="text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cargando datos...</h3>
              <p className="text-gray-500">Preparando tu experiencia de validación</p>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <motion.div
          className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-violet-50/30 -z-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-sky-100/20 to-transparent rounded-full blur-3xl -z-10"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-3 h-3 bg-violet-400 rounded-full animate-pulse -z-10"></div>
          <div className="absolute top-40 left-16 w-2 h-2 bg-sky-400 rounded-full animate-ping -z-10"></div>
          <div className="absolute bottom-32 right-32 w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce -z-10"></div>

          {/* Header */}
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-lg">
                <QrCode size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-sky-600 via-violet-600 to-purple-700 bg-clip-text text-transparent mb-2">
                  Validar Beneficios
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Escanea códigos QR para acceder a beneficios {user?.asociacionId ? 'de tu asociación y comercios afiliados' : 'públicos y directos'}
                </p>
              </div>
            </div>

            {/* Status indicator for socio type */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              user?.asociacionId 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {user?.asociacionId ? (
                <>
                  <Users size={16} />
                  Socio con Asociación
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  Socio Independiente
                </>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8"
            variants={containerVariants}
          >
            <StatsCard
              title="Validaciones Hoy"
              value={stats.validacionesHoy}
              icon={<Activity size={24} />}
              gradient="from-blue-500 to-indigo-600"
              subtitle="Hoy"
            />
            
            <StatsCard
              title="Exitosas"
              value={stats.validacionesExitosas}
              icon={<CheckCircle size={24} />}
              gradient="from-emerald-500 to-teal-600"
              subtitle="Total"
            />
            
            <StatsCard
              title="Ahorro Total"
              value={formatCurrency(stats.ahorroTotal)}
              icon={<DollarSign size={24} />}
              gradient="from-green-500 to-emerald-600"
              subtitle="Acumulado"
            />
            
            <StatsCard
              title="Racha Actual"
              value={`${stats.rachaActual} días`}
              icon={<Zap size={24} />}
              gradient="from-orange-500 to-red-600"
              subtitle="Consecutivos"
            />
            
            <StatsCard
              title="Beneficios"
              value={stats.beneficiosDisponibles}
              icon={<Gift size={24} />}
              gradient="from-purple-500 to-pink-600"
              subtitle="Disponibles"
            />
            
            <StatsCard
              title="Promedio Ahorro"
              value={formatCurrency(stats.promedioAhorro)}
              icon={<Target size={24} />}
              gradient="from-indigo-500 to-purple-600"
              subtitle="Por validación"
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Scanner Section */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              variants={itemVariants}
            >
              {/* Main Scanner Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/40 shadow-lg">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Scan size={40} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Escanear Código QR</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Apunta tu cámara al código QR del comercio para validar y acceder a tus beneficios {user?.asociacionId ? 'exclusivos' : 'disponibles'}
                  </p>
                </div>

                <div className="max-w-sm mx-auto mb-8">
                  <QRScannerButton
                    onScan={handleQRScan}
                    loading={scannerLoading}
                  />
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-sky-50 to-violet-50 rounded-2xl p-6 border border-sky-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Info size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-violet-600" />
                        ¿Cómo funciona?
                      </h3>
                      <ul className="text-sm text-gray-700 space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                          Solicita al comercio que muestre su código QR
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                          Presiona &quot;Escanear Código QR&quot; y permite el acceso a la cámara
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          Apunta la cámara al código QR hasta que se detecte
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                          ¡Disfruta tu beneficio validado!
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Zap size={24} />
                  <h3 className="text-xl font-bold">Acciones Rápidas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/dashboard/socio/beneficios')}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift size={20} />
                        <div>
                          <div className="font-semibold">Ver Beneficios</div>
                          <div className="text-sm opacity-75">Explora ofertas disponibles</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/dashboard/socio/perfil')}
                    className="bg-white/20 hover:bg-white/30 rounded-xl p-4 text-left transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users size={20} />
                        <div>
                          <div className="font-semibold">Mi Perfil</div>
                          <div className="text-sm opacity-75">Gestiona tu cuenta</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              className="space-y-6"
              variants={itemVariants}
            >
              {/* Recent Validations */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <History size={20} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900">Validaciones Recientes</h3>
                </div>

                {recentValidations.length > 0 ? (
                  <div className="space-y-3">
                    {recentValidations.map((validation, index) => (
                      <motion.div
                        key={validation.id || index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${getResultColor(validation.resultado)} transition-all duration-200 hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getResultIcon(validation.resultado)}
                            <span className="font-semibold text-sm">
                              {validation.comercioNombre || 'Comercio'}
                            </span>
                          </div>
                          <span className="text-xs opacity-75">
                            {validation.fechaHora && typeof (validation.fechaHora as Timestamp | { toDate?: () => Date }) !== 'string' && typeof (validation.fechaHora as Timestamp | { toDate?: () => Date }).toDate === 'function'
                              ? formatDate((validation.fechaHora as Timestamp).toDate())
                              : formatDate(new Date(validation.fechaHora as Date))
                            }
                          </span>
                        </div>
                        {validation.beneficioTitulo && (
                          <p className="text-xs opacity-75 mb-1">{validation.beneficioTitulo}</p>
                        )}
                        {validation.montoDescuento && validation.resultado === 'habilitado' && (
                          <p className="text-xs font-semibold">
                            Ahorro: {formatCurrency(validation.montoDescuento)}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <History size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">No hay validaciones recientes</p>
                    <p className="text-xs text-gray-400">¡Escanea tu primer QR para comenzar!</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp size={20} className="text-gray-600" />
                  <h3 className="font-bold text-gray-900">Resumen</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Última validación</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {stats.ultimaValidacion 
                        ? formatDate(stats.ultimaValidacion)
                        : 'Nunca'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Target size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Tasa de éxito</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {recentValidations.length > 0 
                        ? Math.round((stats.validacionesExitosas / recentValidations.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Beneficios activos</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {stats.beneficiosDisponibles}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {user?.asociacionId ? <Users size={16} className="text-gray-500" /> : <UserCheck size={16} className="text-gray-500" />}
                      <span className="text-sm font-medium text-gray-700">Tipo de socio</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {user?.asociacionId ? 'Con Asociación' : 'Independiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Achievement Badge */}
              {stats.rachaActual > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">¡Racha Activa!</h3>
                    <p className="text-sm opacity-90 mb-3">
                      Llevas {stats.rachaActual} días consecutivos validando beneficios
                    </p>
                    <div className="bg-white/20 rounded-xl p-2">
                      <span className="text-xs font-semibold">¡Sigue así para mantener tu racha!</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </DashboardLayout>

      {/* Modal de Logout */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* Modal de Resultado de Validación */}
      <ValidationResultModal
        open={validationModalOpen}
        onClose={handleValidationModalClose}
        result={
          validationResult
            ? {
                ...validationResult,
                success: (validationResult as { success?: boolean }).success ?? true,
                message: (validationResult as { message?: string }).message ?? '',
              }
            : null
        }
      />
    </>
  );
};

export default function SocioValidarPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen relative">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-violet-50/30 -z-10"></div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <RefreshCw size={32} className="text-white animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cargando...</h3>
              <p className="text-gray-500">Preparando validación</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <SocioValidarContent />
    </Suspense>
  );
}
