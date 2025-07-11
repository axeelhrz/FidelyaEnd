import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { qrStatsService } from './qr-stats.service';

export interface QRValidationRequest {
  qrData: string;
  socioId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  device?: string;
  userAgent?: string;
}

export interface QRValidationResponse {
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
    beneficios: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      descuento: number;
      tipo: string;
      condiciones?: string;
      fechaFin: Date;
    }>;
    socio: {
      id: string;
      nombre: string;
      numeroSocio?: string;
      estadoMembresia: string;
    };
    validacion: {
      id: string;
      fechaValidacion: Date;
      codigoValidacion: string;
    };
  };
  error?: string;
}

class QRValidationService {
  private readonly comerciosCollection = COLLECTIONS.COMERCIOS;
  private readonly sociosCollection = COLLECTIONS.SOCIOS;
  private readonly beneficiosCollection = COLLECTIONS.BENEFICIOS;
  private readonly validacionesCollection = COLLECTIONS.VALIDACIONES;

  /**
   * Validate QR code and process socio access to benefits
   */
  async validateQRCode(request: QRValidationRequest): Promise<QRValidationResponse> {
    try {
      // Track QR scan first
      const comercioIdForTracking = this.extractComercioIdFromQR(request.qrData);
      if (comercioIdForTracking) {
        await qrStatsService.trackQRScan(comercioIdForTracking, {
          socioId: request.socioId,
          location: request.location,
          device: request.device,
          userAgent: request.userAgent,
        });
      }

      // Parse QR data to extract comercio ID
      const comercioId = this.extractComercioIdFromQR(request.qrData);
      if (!comercioId) {
        return {
          success: false,
          message: 'Código QR inválido o corrupto',
          error: 'INVALID_QR_CODE'
        };
      }

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
          throw new Error('Tu cuenta de socio no está activa. Contacta a tu asociación.');
        }

        // Check membership status
        if (socioData.estadoMembresia === 'vencido') {
          throw new Error('Tu membresía está vencida. Renueva tu cuota para acceder a beneficios.');
        }

        if (socioData.estadoMembresia === 'pendiente') {
          throw new Error('Tu membresía está pendiente de activación. Contacta a tu asociación.');
        }

        // 2. Get and validate comercio
        const comercioRef = doc(db, this.comerciosCollection, comercioId);
        const comercioDoc = await transaction.get(comercioRef);
        
        if (!comercioDoc.exists()) {
          throw new Error('Comercio no encontrado');
        }

        const comercioData = comercioDoc.data();

        if (comercioData.estado !== 'activo') {
          throw new Error('Este comercio no está disponible actualmente');
        }

        // Check if socio's association is linked to this comercio
        const socioAsociacionId = socioData.asociacionId;
        if (!comercioData.asociacionesVinculadas?.includes(socioAsociacionId)) {
          throw new Error('Tu asociación no tiene convenio con este comercio');
        }

        // 3. Get available benefits for this comercio and association
        const beneficiosQuery = query(
          collection(db, this.beneficiosCollection),
          where('comercioId', '==', comercioId),
          where('estado', '==', 'activo'),
          where('asociacionesVinculadas', 'array-contains', socioAsociacionId)
        );

        const beneficiosSnapshot = await getDocs(beneficiosQuery);
        const beneficiosDisponibles = beneficiosSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              titulo: data.titulo,
              descripcion: data.descripcion,
              descuento: data.descuento,
              tipo: data.tipo,
              condiciones: data.condiciones,
              fechaFin: data.fechaFin?.toDate() || new Date(),
              limiteTotal: data.limiteTotal,
              usosActuales: data.usosActuales || 0,
            };
          })
          .filter(beneficio => {
            // Filter out expired benefits
            return beneficio.fechaFin > new Date();
          })
          .filter(beneficio => {
            // Filter out benefits that have reached their limit
            if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
              return false;
            }
            return true;
          });

        if (beneficiosDisponibles.length === 0) {
          throw new Error('No hay beneficios disponibles en este comercio para tu asociación');
        }

        // 4. Create validation record
        const validacionData = {
          socioId: request.socioId,
          socioNombre: socioData.nombre,
          socioAsociacionId: socioAsociacionId,
          comercioId: comercioId,
          comercioNombre: comercioData.nombreComercio,
          fechaValidacion: serverTimestamp(),
          resultado: 'valido',
          beneficiosDisponibles: beneficiosDisponibles.length,
          ubicacion: request.location || null,
          dispositivo: request.device || null,
          codigoValidacion: this.generateValidationCode(),
          metadata: {
            userAgent: request.userAgent,
            qrData: request.qrData,
            timestamp: Date.now(),
          },
        };

        const validacionRef = await addDoc(collection(db, this.validacionesCollection), validacionData);

        // Track validation in QR stats
        await qrStatsService.trackQRValidation(comercioId, {
          socioId: request.socioId,
          success: true,
        });

        return {
          validacionId: validacionRef.id,
          comercio: {
            id: comercioId,
            nombre: comercioData.nombreComercio,
            categoria: comercioData.categoria,
            direccion: comercioData.direccion,
            logo: comercioData.logo,
          },
          beneficios: beneficiosDisponibles.map(beneficio => ({
            id: beneficio.id,
            titulo: beneficio.titulo,
            descripcion: beneficio.descripcion,
            descuento: beneficio.descuento,
            tipo: beneficio.tipo,
            condiciones: beneficio.condiciones,
            fechaFin: beneficio.fechaFin,
          })),
          socio: {
            id: request.socioId,
            nombre: socioData.nombre,
            numeroSocio: socioData.numeroSocio,
            estadoMembresia: socioData.estadoMembresia,
          },
          validacion: {
            id: validacionRef.id,
            fechaValidacion: new Date(),
            codigoValidacion: validacionData.codigoValidacion,
          },
        };
      });

      return {
        success: true,
        message: 'Validación exitosa. Beneficios disponibles.',
        data: result,
      };

    } catch (error) {
      // Track failed validation
      const comercioId = this.extractComercioIdFromQR(request.qrData);
      if (comercioId) {
        await qrStatsService.trackQRValidation(comercioId, {
          socioId: request.socioId,
          success: false,
        });
      }

      const errorMessage = error instanceof Error ? error.message : 'Error al validar código QR';
      handleError(error, 'QR Validation');
      
      return {
        success: false,
        message: errorMessage,
        error: 'VALIDATION_FAILED'
      };
    }
  }

  /**
   * Use a specific benefit after QR validation
   */
  async useBenefit(
    validacionId: string,
    beneficioId: string,
    montoOriginal?: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      montoDescuento: number;
      montoFinal: number;
      codigoUso: string;
    };
  }> {
    try {
      const result = await runTransaction(db, async (transaction) => {
        // Get validation record
        const validacionRef = doc(db, this.validacionesCollection, validacionId);
        const validacionDoc = await transaction.get(validacionRef);
        
        if (!validacionDoc.exists()) {
          throw new Error('Validación no encontrada');
        }


        // Get benefit
        const beneficioRef = doc(db, this.beneficiosCollection, beneficioId);
        const beneficioDoc = await transaction.get(beneficioRef);
        
        if (!beneficioDoc.exists()) {
          throw new Error('Beneficio no encontrado');
        }

        const beneficioData = beneficioDoc.data();

        // Check if benefit is still active and available
        if (beneficioData.estado !== 'activo') {
          throw new Error('Este beneficio ya no está disponible');
        }

        if (beneficioData.fechaFin?.toDate() < new Date()) {
          throw new Error('Este beneficio ha expirado');
        }

        // Check usage limits
        if (beneficioData.limiteTotal && beneficioData.usosActuales >= beneficioData.limiteTotal) {
          throw new Error('Este beneficio ha alcanzado su límite de uso');
        }

        // Calculate discount
        const { montoDescuento, montoFinal } = this.calculateDiscount(
          beneficioData as { tipo: string; descuento: number },
          montoOriginal || 0
        );

        // Update benefit usage count
        transaction.update(beneficioRef, {
          usosActuales: (beneficioData.usosActuales || 0) + 1,
          actualizadoEn: serverTimestamp(),
        });

        // Update validation record with benefit usage
        const codigoUso = this.generateUsageCode();
        transaction.update(validacionRef, {
          beneficioUsado: beneficioId,
          beneficioTitulo: beneficioData.titulo,
          montoOriginal: montoOriginal || 0,
          montoDescuento,
          montoFinal,
          codigoUso,
          fechaUso: serverTimestamp(),
          estado: 'usado',
        });

        return {
          montoDescuento,
          montoFinal,
          codigoUso,
        };
      });

      return {
        success: true,
        message: 'Beneficio aplicado exitosamente',
        data: result,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al usar beneficio';
      handleError(error, 'Use Benefit');
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Get validation history for a socio
   */
  async getValidationHistory(socioId: string): Promise<Array<{
    id: string;
    comercioNombre: string;
    fechaValidacion: Date;
    beneficiosDisponibles: number;
    beneficioUsado?: string;
    montoDescuento?: number;
    codigoValidacion: string;
  }>> {
    try {
      const validacionesQuery = query(
        collection(db, this.validacionesCollection),
        where('socioId', '==', socioId),
        where('resultado', '==', 'valido'),
        // orderBy('fechaValidacion', 'desc'),
        // limit(limit)
      );

      const snapshot = await getDocs(validacionesQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          comercioNombre: data.comercioNombre,
          fechaValidacion: data.fechaValidacion?.toDate() || new Date(),
          beneficiosDisponibles: data.beneficiosDisponibles || 0,
          beneficioUsado: data.beneficioTitulo,
          montoDescuento: data.montoDescuento,
          codigoValidacion: data.codigoValidacion,
        };
      });
    } catch (error) {
      handleError(error, 'Get Validation History');
      return [];
    }
  }

  /**
   * Private helper methods
   */
  private extractComercioIdFromQR(qrData: string): string | null {
    try {
      // QR data format: https://fidelya.app/validar-beneficio?comercio=COMERCIO_ID
      const url = new URL(qrData);
      return url.searchParams.get('comercio');
    } catch{
      // Try to extract from simple format: COMERCIO_ID
      if (qrData && qrData.length > 10) {
        return qrData;
      }
      return null;
    }
  }

  private generateValidationCode(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private generateUsageCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private calculateDiscount(
    beneficio: {
      tipo: string;
      descuento: number;
    },
    montoOriginal: number
  ): { montoDescuento: number; montoFinal: number } {
    let montoDescuento = 0;

    switch (beneficio.tipo) {
      case 'descuento_porcentaje':
        montoDescuento = (montoOriginal * beneficio.descuento) / 100;
        break;
      case 'descuento_fijo':
        montoDescuento = Math.min(beneficio.descuento, montoOriginal);
        break;
      case '2x1':
        montoDescuento = montoOriginal / 2;
        break;
      case 'envio_gratis':
        // This would need to be calculated based on shipping cost
        montoDescuento = 0;
        break;
      default:
        montoDescuento = 0;
    }

    const montoFinal = Math.max(0, montoOriginal - montoDescuento);

    return {
      montoDescuento: Math.round(montoDescuento * 100) / 100,
      montoFinal: Math.round(montoFinal * 100) / 100,
    };
  }
}

// Export singleton instance
export const qrValidationService = new QRValidationService();
export default qrValidationService;
