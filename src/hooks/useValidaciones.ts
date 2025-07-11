'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Validacion, ValidacionStats } from '@/types/comercio';
import { useAuth } from './useAuth';

export const useValidaciones = () => {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 20;

  // Fetch validaciones with pagination
  const fetchValidaciones = useCallback(async (loadMore = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!loadMore) {
        setLoading(true);
      }

      let validacionesQuery = query(
        collection(db, 'validaciones'),
        where('comercioId', '==', user.uid),
        orderBy('fechaHora', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        validacionesQuery = query(
          collection(db, 'validaciones'),
          where('comercioId', '==', user.uid),
          orderBy('fechaHora', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }

      const unsubscribe = onSnapshot(validacionesQuery, (snapshot) => {
        const validacionesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Validacion[];

        if (loadMore) {
          setValidaciones(prev => [...prev, ...validacionesData]);
        } else {
          setValidaciones(validacionesData);
        }

        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching validaciones:', error);
        setError('Error al cargar las validaciones');
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error in fetchValidaciones:', error);
      setError('Error al cargar las validaciones');
      setLoading(false);
    }
  }, [user, lastDoc]);

  // Initial fetch
  useEffect(() => {
    const unsubscribe = fetchValidaciones();
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub?.());
      }
    };
  }, [user, fetchValidaciones]);

  // Load more validaciones
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchValidaciones(true);
    }
  }, [loading, hasMore, fetchValidaciones]);

  // Get validaciones statistics
  const getStats = useCallback((): ValidacionStats => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const validacionesMes = validaciones.filter(v => 
      v.fechaHora.toDate() >= startOfMonth
    );

    const validacionesExitosas = validaciones.filter(v => v.resultado === 'valido');
    const validacionesFallidas = validaciones.filter(v => v.resultado !== 'valido');

    // Calculate unique clients (socios)
    const clientesUnicos = new Set(validaciones.map(v => v.socioId)).size;

    // Calculate total discount amount
    const montoTotalDescuentos = validaciones.reduce((total, v) => {
      return total + (v.descuentoAplicado || 0);
    }, 0);

    // Group by association
    const porAsociacion: Record<string, number> = {};
    validaciones.forEach(v => {
      porAsociacion[v.asociacionId] = (porAsociacion[v.asociacionId] || 0) + 1;
    });

    // Group by benefit
    const porBeneficio: Record<string, number> = {};
    validaciones.forEach(v => {
      porBeneficio[v.beneficioId] = (porBeneficio[v.beneficioId] || 0) + 1;
    });

    // Group by day (last 30 days)
    const porDia: Record<string, number> = {};
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    validaciones
      .filter(v => v.fechaHora.toDate() >= last30Days)
      .forEach(v => {
        const day = v.fechaHora.toDate().toISOString().split('T')[0];
        porDia[day] = (porDia[day] || 0) + 1;
      });

    return {
      totalValidaciones: validaciones.length,
      validacionesExitosas: validacionesExitosas.length,
      validacionesFallidas: validacionesFallidas.length,
      clientesUnicos,
      montoTotalDescuentos,
      porAsociacion,
      porBeneficio,
      porDia,
      promedioValidacionesDiarias: validacionesMes.length / new Date().getDate()
    };
  }, [validaciones]);

  // Filter validaciones
  const filterValidaciones = useCallback((filters: {
    asociacionId?: string;
    beneficioId?: string;
    resultado?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }) => {
    return validaciones.filter(validacion => {
      if (filters.asociacionId && validacion.asociacionId !== filters.asociacionId) {
        return false;
      }
      if (filters.beneficioId && validacion.beneficioId !== filters.beneficioId) {
        return false;
      }
      if (filters.resultado && validacion.resultado !== filters.resultado) {
        return false;
      }
      if (filters.fechaInicio && validacion.fechaHora.toDate() < filters.fechaInicio) {
        return false;
      }
      if (filters.fechaFin && validacion.fechaHora.toDate() > filters.fechaFin) {
        return false;
      }
      return true;
    });
  }, [validaciones]);

  return {
    validaciones,
    loading,
    error,
    hasMore,
    loadMore,
    getStats,
    filterValidaciones,
    refresh: () => fetchValidaciones(false)
  };
};