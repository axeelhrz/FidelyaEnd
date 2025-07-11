'use client';

import { useState, useEffect, useCallback } from 'react';
import { validacionesService, HistorialValidacion } from '@/services/validaciones.service';
import { socioService } from '@/services/socio.service';
import { Socio, UpdateSocioProfileData } from '@/types/socio';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface UseSocioProfileReturn {
  socio: Socio | null;
  historialValidaciones: HistorialValidacion[];
  estadisticas: {
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
  };
  loading: boolean;
  error: string | null;
  hasMoreValidaciones: boolean;
  loadSocioProfile: () => Promise<void>;
  loadHistorialValidaciones: () => Promise<void>;
  loadMoreValidaciones: () => Promise<void>;
  loadEstadisticas: () => Promise<void>;
  updateProfile: (data: UpdateSocioProfileData) => Promise<boolean>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  asociacionesList?: Socio[];
  stats?: {
    totalAsociaciones: number;
    totalActivas: number;
    totalVencidas: number;
    totalPendientes: number;
  };
  asociaciones: Socio[];
  activity: {
    totalValidaciones: number;
    totalAhorro: number;    
  };
  updating: boolean;
}

export function useSocioProfile(): UseSocioProfileReturn {
  const { user } = useAuth();
  const [socio, setSocio] = useState<Socio | null>(null);
  const [historialValidaciones, setHistorialValidaciones] = useState<HistorialValidacion[]>([]);
  const [estadisticas, setEstadisticas] = useState<{
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
  }>({
    totalValidaciones: 0,
    ahorroTotal: 0,
    beneficiosMasUsados: [],
    comerciosFavoritos: [],
    validacionesPorMes: [],
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastValidacionDoc, setLastValidacionDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreValidaciones, setHasMoreValidaciones] = useState<boolean>(false);

  const socioId = user?.uid || '';

  // Load socio profile
  const loadSocioProfile = useCallback(async () => {
    if (!socioId) return;

    try {
      setLoading(true);
      setError(null);

      const socioData = await socioService.getSocioById(socioId);
      setSocio(socioData);

      if (!socioData) {
        setError('Perfil de socio no encontrado');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [socioId]);

  // Load historial validaciones
  const loadHistorialValidaciones = useCallback(async () => {
    if (!socioId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await validacionesService.getHistorialValidaciones(socioId, 20);
      
      setHistorialValidaciones(result.validaciones);
      setHasMoreValidaciones(result.hasMore);
      setLastValidacionDoc(result.lastDoc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar historial';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [socioId]);

  // Load more validaciones
  const loadMoreValidaciones = useCallback(async () => {
    if (!socioId || !hasMoreValidaciones || loading) return;

    try {
      setLoading(true);

      const result = await validacionesService.getHistorialValidaciones(
        socioId, 
        20, 
        lastValidacionDoc
      );
      
      setHistorialValidaciones(prev => [...prev, ...result.validaciones]);
      setHasMoreValidaciones(result.hasMore);
      setLastValidacionDoc(result.lastDoc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar más validaciones';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [socioId, hasMoreValidaciones, loading, lastValidacionDoc]);

  // Load estadisticas
  const loadEstadisticas = useCallback(async () => {
    if (!socioId) return;

    try {
      const stats = await validacionesService.getEstadisticasSocio(socioId);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error loading estadisticas:', error);
    }
  }, [socioId]);

  const updateProfile = useCallback(async (data: UpdateSocioProfileData): Promise<boolean> => {
    if (!socioId) return false;

    try {
      setUpdating(true);
      setError(null);

      // Convert the UpdateSocioProfileData to SocioFormData format
      const updateData = {
        nombre: data.nombre,
        telefono: data.telefono,
        dni: data.dni,
        direccion: data.direccion,
        fechaNacimiento: typeof data.fechaNacimiento === 'string'
          ? new Date(data.fechaNacimiento)
          : data.fechaNacimiento,
      };

      const success = await socioService.updateSocio(socioId, updateData);
      
      if (success) {
        toast.success('Perfil actualizado exitosamente');
        await loadSocioProfile(); // Refresh data
        return true;
      } else {
        throw new Error('Error al actualizar perfil');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [socioId, loadSocioProfile]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadSocioProfile(),
      loadHistorialValidaciones(),
      loadEstadisticas(),
    ]);
  }, [loadSocioProfile, loadHistorialValidaciones, loadEstadisticas]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (socioId) {
      refreshData();
    }
  }, [socioId, refreshData]);
  return {
    socio,
    historialValidaciones,
    estadisticas,
    loading,
    error,
    hasMoreValidaciones,
    loadSocioProfile,
    loadHistorialValidaciones,
    loadMoreValidaciones,
    loadEstadisticas,
    updateProfile,
    refreshData,
    clearError,
    asociaciones: [], // Default empty array, adjust as needed
    activity: {
      totalValidaciones: estadisticas.totalValidaciones,
      totalAhorro: estadisticas.ahorroTotal,
    },
    updating,
  };
}