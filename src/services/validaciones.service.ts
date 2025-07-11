import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface ValidacionRequest {
  socioId: string;
  comercioId: string;
  beneficioId?: string;
  asociacionId?: string;
}

export interface ValidacionResponse {
  success: boolean;
  message: string;
  data?: {
    comercio: {
      id: string;
      nombre: string;
      categoria: string;
      direccion?: string;
      logo?: string;
    };
    beneficio?: {
      id: string;
      titulo: string;
      descripcion: string;
      descuento: number;
      tipo: string;
      condiciones?: string;
    };
    socio: {
      id: string;
      nombre: string;
      numeroSocio: string;
      estadoMembresia: string;
    };
    validacion: {
      id: string;
      fechaValidacion: Date;
      montoDescuento: number;
      codigoValidacion: string;
    };
  };
  error?: string;
}

export interface HistorialValidacion {
  id: string;
  comercioId: string;
  comercioNombre: string;
  comercioLogo?: string;
  beneficioId: string;
  beneficioTitulo: string;
  beneficioDescripcion: string;
  descuento: number;
  tipoDescuento: string;
  fechaValidacion: Date;
  montoDescuento: number;
  estado: 'exitosa' | 'fallida' | 'pendiente' | 'cancelada';
  codigoValidacion: string;
  metodoPago?: string;
  notas?: string;
}

class ValidacionesService {
  private readonly collection = COLLECTIONS.VALIDACIONES;
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly comerciosCollection = COLLECTIONS.COMERCIOS;
  private readonly beneficiosCollection = COLLECTIONS.BENEFICIOS;

  /**
   * Validate access for a socio to use benefits - UPDATED to support socios without association
   */
  async validarAcceso(request: ValidacionRequest): Promise<ValidacionResponse> {
    try {
      console.log('🔍 Starting validation process:', request);

      // Run validation in a transaction to ensure consistency
      const result = await runTransaction(db, async (transaction) => {
        // 1. Get and validate socio
        const socioRef = doc(db, this.sociosCollection, request.socioId);
        const socioDoc = await transaction.get(socioRef);

        if (!socioDoc.exists()) {
          throw new Error('Socio no encontrado');
        }

        const socioData = socioDoc.data();
        
        // Check socio status
        if (socioData.estado !== 'activo') {
          throw new Error('Tu cuenta de socio no está activa. Contacta al administrador.');
        }

        // For socios with association, check membership status
        if (socioData.asociacionId) {
          if (socioData.estadoMembresia === 'vencido') {
            throw new Error('Tu membresía está vencida. Renueva tu cuota para acceder a beneficios.');
          }

          if (socioData.estadoMembresia === 'pendiente') {
            throw new Error('Tu membresía está pendiente de activación. Contacta a tu asociación.');
          }
        }

        // 2. Get and validate comercio
        const comercioRef = doc(db, this.comerciosCollection, request.comercioId);
        const comercioDoc = await transaction.get(comercioRef);

        if (!comercioDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const comercioData = comercioDoc.data();

        if (comercioData.estado !== 'activo') {
          throw new Error('Este comercio no está disponible actualmente');
        }

        // 3. Get available benefits for this comercio
        let beneficiosQuery;
        const socioAsociacionId = socioData.asociacionId;

        if (socioAsociacionId) {
          // Socio with association: check association link and get association benefits
          if (!comercioData.asociacionesVinculadas?.includes(socioAsociacionId)) {
            // If not linked through association, check for direct comercio benefits
            beneficiosQuery = query(
              collection(db, this.beneficiosCollection),
              where('comercioId', '==', request.comercioId),
              where('estado', '==', 'activo'),
              where('tipoAcceso', 'in', ['publico', 'directo']) // Allow public and direct access benefits
            );
          } else {
            // Linked through association: get association benefits
            beneficiosQuery = query(
              collection(db, this.beneficiosCollection),
              where('comercioId', '==', request.comercioId),
              where('estado', '==', 'activo'),
              where('asociacionesDisponibles', 'array-contains', socioAsociacionId)
            );
          }
        } else {
          // Socio without association: only direct comercio benefits
          beneficiosQuery = query(
            collection(db, this.beneficiosCollection),
            where('comercioId', '==', request.comercioId),
            where('estado', '==', 'activo'),
            where('tipoAcceso', 'in', ['publico', 'directo']) // Only public and direct access benefits
          );
        }

        const beneficiosSnapshot = await getDocs(beneficiosQuery);
        
        if (beneficiosSnapshot.empty) {
          if (socioAsociacionId) {
            throw new Error('No hay beneficios disponibles para ti en este comercio');
          } else {
            throw new Error('No hay beneficios públicos disponibles en este comercio');
          }
        }

        // 4. Select benefit (if specific benefit requested, validate it; otherwise use first available)
        type BeneficioData = {
          titulo: string;
          descripcion: string;
          descuento: number;
          tipo: string;
          condiciones?: string;
          fechaInicio?: import('firebase/firestore').Timestamp | Date | undefined;
          fechaFin?: import('firebase/firestore').Timestamp | Date | undefined;
          limiteTotal?: number;
          usosActuales?: number;
          limitePorSocio?: number;
          asociacionesDisponibles?: string[];
          tipoAcceso?: 'asociacion' | 'publico' | 'directo';
        };

        let selectedBeneficio: { id: string } & BeneficioData;
        
        if (request.beneficioId) {
          const beneficioDoc = beneficiosSnapshot.docs.find(doc => doc.id === request.beneficioId);
          if (!beneficioDoc) {
            throw new Error('El beneficio solicitado no está disponible');
          }
          selectedBeneficio = { id: beneficioDoc.id, ...(beneficioDoc.data() as BeneficioData) };
        } else {
          // Use the first available benefit
          const firstBeneficio = beneficiosSnapshot.docs[0];
          selectedBeneficio = { id: firstBeneficio.id, ...(firstBeneficio.data() as BeneficioData) };
        }

        // 5. Check benefit limits and usage
        const now = new Date();
        const beneficioData = selectedBeneficio;

        // Check date validity
        const fechaInicio =
          beneficioData.fechaInicio instanceof Date
            ? beneficioData.fechaInicio
            : beneficioData.fechaInicio?.toDate
            ? beneficioData.fechaInicio.toDate()
            : undefined;
        if (fechaInicio && fechaInicio > now) {
          throw new Error('Este beneficio aún no está disponible');
        }

        const fechaFin =
          beneficioData.fechaFin instanceof Date
            ? beneficioData.fechaFin
            : beneficioData.fechaFin?.toDate
            ? beneficioData.fechaFin.toDate()
            : undefined;
        if (fechaFin && fechaFin < now) {
          throw new Error('Este beneficio ha expirado');
        }

        // Check total usage limit
        if (beneficioData.limiteTotal && (beneficioData.usosActuales ?? 0) >= beneficioData.limiteTotal) {
          throw new Error('Este beneficio ha alcanzado su límite de usos');
        }

        // Check per-socio usage limit
        if (beneficioData.limitePorSocio) {
          const socioUsageQuery = query(
            collection(db, this.collection),
            where('socioId', '==', request.socioId),
            where('beneficioId', '==', selectedBeneficio.id),
            where('estado', '==', 'exitosa')
          );

          const socioUsageSnapshot = await getDocs(socioUsageQuery);
          
          if (socioUsageSnapshot.size >= beneficioData.limitePorSocio) {
            throw new Error(`Ya has usado este beneficio el máximo de veces permitidas (${beneficioData.limitePorSocio})`);
          }
        }

        // 6. Create validation record
        const validacionId = doc(collection(db, this.collection)).id;
        const codigoValidacion = this.generateValidationCode();
        
        const validacionData = {
          socioId: request.socioId,
          socioNombre: socioData.nombre,
          socioNumero: socioData.numeroSocio,
          asociacionId: socioAsociacionId || null, // Can be null for independent socios
          asociacionNombre: socioData.asociacionNombre || null,
          comercioId: request.comercioId,
          comercioNombre: comercioData.nombreComercio,
          beneficioId: selectedBeneficio.id,
          beneficioTitulo: beneficioData.titulo,
          beneficioDescripcion: beneficioData.descripcion,
          descuento: beneficioData.descuento,
          tipoDescuento: beneficioData.tipo,
          tipoAcceso: beneficioData.tipoAcceso || (socioAsociacionId ? 'asociacion' : 'directo'),
          montoDescuento: this.calculateDiscountAmount(beneficioData),
          fechaValidacion: serverTimestamp(),
          estado: 'exitosa',
          codigoValidacion,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        };

        // Save validation
        transaction.set(doc(db, this.collection, validacionId), validacionData);

        // Update benefit usage count
        transaction.update(doc(db, this.beneficiosCollection, selectedBeneficio.id), {
          usosActuales: (beneficioData.usosActuales || 0) + 1,
          actualizadoEn: serverTimestamp(),
        });

        // Update socio usage count
        transaction.update(socioRef, {
          beneficiosUsados: (socioData.beneficiosUsados || 0) + 1,
          ultimaValidacion: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });

        // Update comercio stats
        transaction.update(comercioRef, {
          validacionesRealizadas: (comercioData.validacionesRealizadas || 0) + 1,
          clientesAtendidos: (comercioData.clientesAtendidos || 0) + 1,
          actualizadoEn: serverTimestamp(),
        });

        return {
          validacionId,
          codigoValidacion,
          socioData,
          comercioData,
          beneficioData: selectedBeneficio,
          montoDescuento: validacionData.montoDescuento,
        };
      });

      console.log('✅ Validation successful:', result.validacionId);

      return {
        success: true,
        message: '¡Beneficio validado exitosamente!',
        data: {
          comercio: {
            id: request.comercioId,
            nombre: result.comercioData.nombreComercio,
            categoria: result.comercioData.categoria,
            direccion: result.comercioData.direccion,
            logo: result.comercioData.logo,
          },
          beneficio: {
            id: result.beneficioData.id,
            titulo: result.beneficioData.titulo,
            descripcion: result.beneficioData.descripcion,
            descuento: result.beneficioData.descuento,
            tipo: result.beneficioData.tipo,
            condiciones: result.beneficioData.condiciones,
          },
          socio: {
            id: request.socioId,
            nombre: result.socioData.nombre,
            numeroSocio: result.socioData.numeroSocio,
            estadoMembresia: result.socioData.estadoMembresia || 'independiente',
          },
          validacion: {
            id: result.validacionId,
            fechaValidacion: new Date(),
            montoDescuento: result.montoDescuento,
            codigoValidacion: result.codigoValidacion,
          },
        },
      };

    } catch (error) {
      console.error('❌ Validation failed:', error);
      
      // Record failed validation attempt
      try {
        await this.recordFailedValidation(request, error);
      } catch (recordError) {
        console.error('Failed to record validation attempt:', recordError);
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante la validación';
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Get validation history for a socio - UPDATED to handle socios without association
   */
  async getHistorialValidaciones(
    socioId: string,
    maxResults: number = 20,
    lastDoc?: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null
  ): Promise<{ validaciones: HistorialValidacion[]; hasMore: boolean; lastDoc: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null }> {
    try {
      let q = query(
        collection(db, this.collection),
        where('socioId', '==', socioId),
        orderBy('fechaValidacion', 'desc')
      );

      if (lastDoc) {
        q = query(
          collection(db, this.collection),
          where('socioId', '==', socioId),
          orderBy('fechaValidacion', 'desc'),
          limit(maxResults + 1)
        );
      } else {
        q = query(q, limit(maxResults + 1));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > maxResults;

      if (hasMore) {
        docs.pop(); // Remove the extra document
      }

      const validaciones = docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          comercioId: data.comercioId,
          comercioNombre: data.comercioNombre,
          comercioLogo: data.comercioLogo,
          beneficioId: data.beneficioId,
          beneficioTitulo: data.beneficioTitulo,
          beneficioDescripcion: data.beneficioDescripcion,
          descuento: data.descuento,
          tipoDescuento: data.tipoDescuento,
          fechaValidacion: data.fechaValidacion?.toDate() || new Date(),
          montoDescuento: data.montoDescuento,
          estado: data.estado,
          codigoValidacion: data.codigoValidacion,
          metodoPago: data.metodoPago,
          notas: data.notas,
        } as HistorialValidacion;
      });

      return {
        validaciones,
        hasMore,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null
      };
    } catch (error) {
      handleError(error, 'Get Historial Validaciones');
      return { validaciones: [], hasMore: false, lastDoc: null };
    }
  }

  /**
   * Get validation statistics for a socio - UPDATED to handle socios without association
   */
  async getEstadisticasSocio(socioId: string): Promise<{
    totalValidaciones: number;
    ahorroTotal: number;
    beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
    comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
    validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
  }> {
    try {
      const q = query(
        collection(db, this.collection),
        where('socioId', '==', socioId),
        where('estado', '==', 'exitosa')
      );

      const snapshot = await getDocs(q);
      const validaciones = snapshot.docs.map(doc => doc.data());

      const totalValidaciones = validaciones.length;
      const ahorroTotal = validaciones.reduce((total, v) => total + (v.montoDescuento || 0), 0);

      // Beneficios más usados
      const beneficiosCount: { [key: string]: { titulo: string; usos: number } } = {};
      validaciones.forEach(v => {
        const key = v.beneficioId;
        if (beneficiosCount[key]) {
          beneficiosCount[key].usos++;
        } else {
          beneficiosCount[key] = { titulo: v.beneficioTitulo, usos: 1 };
        }
      });

      const beneficiosMasUsados = Object.values(beneficiosCount)
        .sort((a, b) => b.usos - a.usos)
        .slice(0, 5);

      // Comercios favoritos
      const comerciosCount: { [key: string]: { nombre: string; visitas: number } } = {};
      validaciones.forEach(v => {
        const key = v.comercioId;
        if (comerciosCount[key]) {
          comerciosCount[key].visitas++;
        } else {
          comerciosCount[key] = { nombre: v.comercioNombre, visitas: 1 };
        }
      });

      const comerciosFavoritos = Object.values(comerciosCount)
        .sort((a, b) => b.visitas - a.visitas)
        .slice(0, 5);

      // Validaciones por mes (últimos 6 meses)
      const validacionesPorMes = this.processValidacionesPorMes(validaciones);

      return {
        totalValidaciones,
        ahorroTotal,
        beneficiosMasUsados,
        comerciosFavoritos,
        validacionesPorMes,
      };
    } catch (error) {
      handleError(error, 'Get Estadisticas Socio');
      return {
        totalValidaciones: 0,
        ahorroTotal: 0,
        beneficiosMasUsados: [],
        comerciosFavoritos: [],
        validacionesPorMes: [],
      };
    }
  }

  /**
   * Parse QR data to extract comercio and beneficio IDs
   */
  parseQRData(qrData: string): { comercioId: string; beneficioId?: string } | null {
    try {
      // Handle URL format: /validar-beneficio?comercio=ID&beneficio=ID
      if (qrData.includes('validar-beneficio')) {
        const url = new URL(qrData.startsWith('http') ? qrData : `https://example.com${qrData}`);
        const comercioId = url.searchParams.get('comercio');
        const beneficioId = url.searchParams.get('beneficio');

        if (!comercioId) {
          return null;
        }

        return {
          comercioId,
          beneficioId: beneficioId || undefined,
        };
      }

      // Handle direct JSON format
      if (qrData.startsWith('{')) {
        const data = JSON.parse(qrData);
        if (data.comercioId) {
          return {
            comercioId: data.comercioId,
            beneficioId: data.beneficioId,
          };
        }
      }

      // Handle simple comercio ID
      if (qrData.length > 10 && qrData.length < 50) {
        return {
          comercioId: qrData,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private generateValidationCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${random}`.toUpperCase();
  }

  private calculateDiscountAmount(beneficio: {
    tipo: string;
    descuento: number;
  }): number {
    // This is a simplified calculation
    // In a real implementation, you might need the original amount to calculate percentage discounts
    switch (beneficio.tipo) {
      case 'porcentaje':
        // For percentage discounts, we'll return the percentage value
        // The actual amount would be calculated at the point of sale
        return beneficio.descuento;
      case 'monto_fijo':
        return beneficio.descuento;
      case 'producto_gratis':
        return 0; // Free product, no monetary discount
      default:
        return 0;
    }
  }

  private async recordFailedValidation(request: ValidacionRequest, error: unknown): Promise<void> {
    try {
      const validacionId = doc(collection(db, this.collection)).id;
      
      const failedValidationData = {
        socioId: request.socioId,
        comercioId: request.comercioId,
        beneficioId: request.beneficioId || null,
        fechaValidacion: serverTimestamp(),
        estado: 'fallida',
        error: error instanceof Error ? error.message : 'Error desconocido',
        creadoEn: serverTimestamp(),
      };

      await setDoc(doc(db, this.collection, validacionId), failedValidationData);
    } catch (recordError) {
      console.error('Failed to record failed validation:', recordError);
    }
  }

  private processValidacionesPorMes(
    validaciones: Array<{
      fechaValidacion?: { toDate?: () => Date };
      montoDescuento?: number;
    }>
  ): Array<{ mes: string; validaciones: number; ahorro: number }> {
    const now = new Date();
    const meses: { [key: string]: { validaciones: number; ahorro: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toISOString().substr(0, 7); // YYYY-MM format
      meses[key] = { validaciones: 0, ahorro: 0 };
    }

    // Process validaciones
    validaciones.forEach(v => {
      const fecha =
        v.fechaValidacion && typeof v.fechaValidacion.toDate === 'function'
          ? v.fechaValidacion.toDate()
          : new Date();
      const key = fecha.toISOString().substr(0, 7);
      
      if (meses[key]) {
        meses[key].validaciones++;
        meses[key].ahorro += v.montoDescuento || 0;
      }
    });

    return Object.entries(meses).map(([mes, data]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      ...data,
    }));
  }
}

// Export singleton instance
export const validacionesService = new ValidacionesService();
export default validacionesService;