'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { BeneficiosService } from '@/services/beneficios.service';
import { 
  Beneficio, 
  BeneficioUso, 
  BeneficioStats, 
  BeneficioFormData, 
  BeneficioFilter 
} from '@/types/beneficio';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface UseBeneficiosOptions {
  autoLoad?: boolean;
  useRealtime?: boolean;
  cacheEnabled?: boolean;
}

export const useBeneficios = (options: UseBeneficiosOptions = {}) => {
  const { 
    autoLoad = true, 
    useRealtime = false, 
  } = options;

  const { user } = useAuth();
  
  // Estados principales
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [beneficiosUsados, setBeneficiosUsados] = useState<BeneficioUso[]>([]);
  const [stats, setStats] = useState<BeneficioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Referencias para cleanup
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const mountedRef = useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Cargar beneficios según el rol del usuario - ACTUALIZADO PARA SOCIOS
  const cargarBeneficios = useCallback(async (filtros?: BeneficioFilter) => {
    if (!user || loading) return;

    try {
      setLoading(true);
      setError(null);

      let beneficiosData: Beneficio[] = [];

      switch (user.role) {
        case 'socio':
          if (user.asociacionId) {
            console.log('🔍 Cargando beneficios para socio:', user.uid);
            // Usar el método actualizado que incluye comercios afiliados
            beneficiosData = await BeneficiosService.obtenerBeneficiosDisponibles(
              user.uid,
              user.asociacionId,
              filtros
            );
          } else {
            console.warn('⚠️ Socio sin asociación asignada');
            setError('No tienes una asociación asignada. Contacta al administrador.');
          }
          break;

        case 'comercio':
          beneficiosData = await BeneficiosService.obtenerBeneficiosPorComercio(user.uid);
          break;

        case 'asociacion':
          beneficiosData = await BeneficiosService.obtenerBeneficiosPorAsociacion(user.uid);
          break;

        default:
          console.warn('Rol de usuario no reconocido:', user.role);
      }

      if (mountedRef.current) {
        setBeneficios(beneficiosData);
        console.log(`✅ Se cargaron ${beneficiosData.length} beneficios para ${user.role}`);
      }
    } catch (err) {
      console.error('Error cargando beneficios:', err);
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar beneficios';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, loading]);

  // Cargar historial de usos (solo para socios)
  const cargarHistorialUsos = useCallback(async () => {
    if (!user || user.role !== 'socio') return;

    try {
      const usos = await BeneficiosService.obtenerHistorialUsos(user.uid);
      if (mountedRef.current) {
        setBeneficiosUsados(usos);
        console.log(`✅ Se cargaron ${usos.length} usos del historial`);
      }
    } catch (err) {
      console.error('Error cargando historial de usos:', err);
      if (mountedRef.current) {
        toast.error('Error al cargar el historial de beneficios');
      }
    }
  }, [user]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    if (!user) return;

    try {
      const filtros: { comercioId?: string; asociacionId?: string; socioId?: string } = {};
      
      if (user.role === 'comercio') {
        filtros.comercioId = user.uid;
      } else if (user.role === 'asociacion') {
        filtros.asociacionId = user.uid;
      } else if (user.role === 'socio' && user.asociacionId) {
        // Para socios, pasar tanto el socioId como la asociacionId para estadísticas específicas
        filtros.socioId = user.uid;
        filtros.asociacionId = user.asociacionId;
      }

      console.log('🔍 Cargando estadísticas con filtros:', filtros);
      const estadisticas = await BeneficiosService.obtenerEstadisticas(filtros);
      if (mountedRef.current) {
        setStats(estadisticas);
        console.log('✅ Estadísticas cargadas:', estadisticas);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, [user]);

  // Configurar listener en tiempo real - ACTUALIZADO PARA SOCIOS
  const configurarRealtime = useCallback(() => {
    if (!user || !useRealtime) return;

    // Limpiar listener anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    switch (user.role) {
      case 'socio':
        if (user.asociacionId) {
          console.log('🔄 Configurando listener en tiempo real para socio');
          unsubscribeRef.current = BeneficiosService.suscribirBeneficiosDisponibles(
            user.uid,
            user.asociacionId,
            (beneficiosData) => {
              if (mountedRef.current) {
                setBeneficios(beneficiosData);
                console.log(`🔄 Beneficios actualizados en tiempo real: ${beneficiosData.length}`);
              }
            }
          );
        }
        break;

      case 'comercio':
        unsubscribeRef.current = BeneficiosService.suscribirBeneficiosComercio(
          user.uid,
          (beneficiosData) => {
            if (mountedRef.current) {
              setBeneficios(beneficiosData);
            }
          }
        );
        break;
    }
  }, [user, useRealtime]);

  // Efecto principal para cargar datos
  useEffect(() => {
    if (autoLoad && user) {
      if (useRealtime) {
        configurarRealtime();
      } else {
        cargarBeneficios();
      }
      
      if (user.role === 'socio') {
        cargarHistorialUsos();
      }
      
      cargarEstadisticas();
    }
  }, [user, autoLoad, useRealtime, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, configurarRealtime]);

  // Funciones de acción
  const crearBeneficio = useCallback(async (data: BeneficioFormData): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      toast.error('No tienes permisos para crear beneficios');
      return false;
    }

    try {
      setLoading(true);
      
      await BeneficiosService.crearBeneficio(data, user.uid, user.role);
      toast.success('Beneficio creado exitosamente');
      
      // Recargar datos
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear beneficio';
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const actualizarBeneficio = useCallback(async (id: string, data: Partial<BeneficioFormData>): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      toast.error('No tienes permisos para actualizar beneficios');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.actualizarBeneficio(id, data);
      
      toast.success('Beneficio actualizado exitosamente');
      
      // Recargar datos
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar beneficio';
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const eliminarBeneficio = useCallback(async (id: string): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      toast.error('No tienes permisos para eliminar beneficios');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.eliminarBeneficio(id);
      
      toast.success('Beneficio eliminado exitosamente');
      
      // Recargar datos
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar beneficio';
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const cambiarEstadoBeneficio = useCallback(async (
    id: string, 
    estado: 'activo' | 'inactivo' | 'vencido' | 'agotado'
  ): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      toast.error('No tienes permisos para cambiar el estado del beneficio');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.actualizarEstadoBeneficio(id, estado);
      
      const estadoTexto = {
        'activo': 'activado',
        'inactivo': 'desactivado',
        'vencido': 'marcado como vencido',
        'agotado': 'marcado como agotado'
      }[estado];
      
      toast.success(`Beneficio ${estadoTexto} exitosamente`);
      
      // Recargar datos
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado del beneficio';
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const usarBeneficio = useCallback(async (
    beneficioId: string, 
    comercioId: string,
    montoOriginal?: number
  ): Promise<boolean> => {
    if (!user || user.role !== 'socio') {
      toast.error('Solo los socios pueden usar beneficios');
      return false;
    }

    if (!user.asociacionId) {
      toast.error('Debes estar asociado a una asociación para usar beneficios');
      return false;
    }

    try {
      setLoading(true);
      
      const socioData = {
        nombre: user.nombre || user.email || 'Usuario',
        email: user.email || ''
      };

      await BeneficiosService.usarBeneficio(
        beneficioId,
        user.uid,
        socioData,
        comercioId,
        user.asociacionId,
        montoOriginal
      );
      
      toast.success('¡Beneficio usado exitosamente!');
      
      // Recargar datos
      await Promise.all([
        cargarHistorialUsos(),
        cargarEstadisticas(),
        !useRealtime && cargarBeneficios()
      ].filter(Boolean));
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al usar beneficio';
      toast.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, useRealtime]);

  const buscarBeneficios = useCallback(async (
    termino: string, 
    filtros?: BeneficioFilter
  ): Promise<Beneficio[]> => {
    try {
      const resultados = await BeneficiosService.buscarBeneficios(termino, filtros);
      return resultados;
    } catch (err) {
      console.error('Error en búsqueda:', err);
      toast.error('Error al buscar beneficios');
      return [];
    }
  }, []);

  const refrescar = useCallback(async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      await Promise.all([
        cargarBeneficios(),
        user?.role === 'socio' && cargarHistorialUsos(),
        cargarEstadisticas()
      ].filter(Boolean));
      
      toast.success('Datos actualizados');
    } catch (err) {
      console.error('Error al refrescar:', err);
      toast.error('Error al actualizar datos');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, user]);

  const filtrarBeneficios = useCallback(async (filtros: BeneficioFilter) => {
    await cargarBeneficios(filtros);
  }, [cargarBeneficios]);

  // Datos derivados
  const beneficiosActivos = beneficios.filter(b => b.estado === 'activo');
  const beneficiosInactivos = beneficios.filter(b => b.estado === 'inactivo');
  const beneficiosVencidos = beneficios.filter(b => b.estado === 'vencido');
  const beneficiosAgotados = beneficios.filter(b => b.estado === 'agotado');
  const beneficiosDestacados = beneficios.filter(b => b.destacado);

  // Estadísticas rápidas - CORREGIDAS PARA USAR LOS MISMOS DATOS QUE EL SIDEBAR
  const estadisticasRapidas = {
    // Usar los beneficios filtrados localmente (igual que el sidebar)
    total: beneficiosActivos.length,
    activos: beneficiosActivos.length,
    usados: beneficiosUsados.length,
    ahorroTotal: beneficiosUsados.reduce((total, uso) => total + (uso.montoDescuento || 0), 0),
    ahorroEsteMes: beneficiosUsados
      .filter(uso => {
        const fecha = uso.fechaUso.toDate();
        const ahora = new Date();
        return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      })
      .reduce((total, uso) => total + (uso.montoDescuento || 0), 0)
  };

  return {
    // Estados
    beneficios,
    beneficiosUsados,
    stats,
    loading,
    error,
    refreshing,

    // Datos derivados
    beneficiosActivos,
    beneficiosInactivos,
    beneficiosVencidos,
    beneficiosAgotados,
    beneficiosDestacados,
    estadisticasRapidas,

    // Acciones
    crearBeneficio,
    actualizarBeneficio,
    eliminarBeneficio,
    cambiarEstadoBeneficio,
    usarBeneficio,
    buscarBeneficios,
    filtrarBeneficios,
    refrescar,

    // Funciones de carga manual
    cargarBeneficios,
    cargarHistorialUsos,
    cargarEstadisticas
  };
};

// Hook especializado para socios - MEJORADO
export const useBeneficiosSocio = () => {
  return useBeneficios({
    autoLoad: true,
    useRealtime: true,
    cacheEnabled: true
  });
};

// Hook especializado para comercios
export const useBeneficiosComercios = () => {
  
  return useBeneficios({
    autoLoad: true,
    useRealtime: true,
    cacheEnabled: false
  });
};

// Hook especializado para asociaciones
export const useBeneficiosAsociacion = () => {
  return useBeneficios({
    autoLoad: true,
    useRealtime: false,
    cacheEnabled: false
  });
};