import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Beneficio,
  BeneficioUso,
  BeneficioStats,
  BeneficioFormData,
  BeneficioFilter,
} from '@/types/beneficio';

export class BeneficiosService {
  private static readonly BENEFICIOS_COLLECTION = 'beneficios';
  private static readonly USOS_COLLECTION = 'beneficio_usos';
  private static readonly VALIDACIONES_COLLECTION = 'beneficio_validaciones';
  private static readonly COMERCIOS_COLLECTION = 'comercios';
  private static readonly ASOCIACIONES_COLLECTION = 'asociaciones';
  private static readonly SOCIOS_COLLECTION = 'socios';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Cache simple
  private static cache = new Map<string, { data: unknown; timestamp: number }>();

  // Métodos de cache
  private static getCacheKey(key: string, params?: Record<string, unknown>): string {
    return params ? `${key}_${JSON.stringify(params)}` : key;
  }

  private static isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < this.CACHE_DURATION;
  }

  private static setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private static getCache(key: string): unknown {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Función auxiliar para limpiar datos antes de enviar a Firebase
  private static cleanDataForFirestore(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Solo incluir campos que no sean undefined
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  // Obtener información del comercio
  private static async obtenerInfoComercio(comercioId: string): Promise<{ nombre: string; logo?: string } | null> {
    try {
      const comercioDoc = await getDoc(doc(db, this.COMERCIOS_COLLECTION, comercioId));
      if (comercioDoc.exists()) {
        const data = comercioDoc.data();
        return {
          nombre: data.nombreComercio || data.nombre || 'Comercio',
          logo: data.logo || data.logoUrl || undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info del comercio:', error);
      return null;
    }
  }

  // Obtener información de la asociación
  private static async obtenerInfoAsociacion(asociacionId: string): Promise<{ nombre: string; logo?: string } | null> {
    try {
      const asociacionDoc = await getDoc(doc(db, this.ASOCIACIONES_COLLECTION, asociacionId));
      if (asociacionDoc.exists()) {
        const data = asociacionDoc.data();
        return {
          nombre: data.nombre || 'Asociación',
          logo: data.logo || data.logoUrl || undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info de la asociación:', error);
      return null;
    }
  }

  // Obtener información del socio
  private static async obtenerInfoSocio(socioId: string): Promise<{ asociacionId?: string; comerciosAfiliados?: string[] } | null> {
    try {
      const socioDoc = await getDoc(doc(db, this.SOCIOS_COLLECTION, socioId));
      if (socioDoc.exists()) {
        const data = socioDoc.data();
        return {
          asociacionId: data.asociacionId || undefined,
          comerciosAfiliados: data.comerciosAfiliados || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info del socio:', error);
      return null;
    }
  }

  // Obtener comercios afiliados a un socio - UPDATED to handle socios without association
  private static async obtenerComerciosAfiliadosSocio(socioId: string): Promise<string[]> {
    try {
      const cacheKey = this.getCacheKey('comercios_afiliados_socio', { socioId });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as string[];
      }

      // Primero obtener la información del socio
      const socioInfo = await this.obtenerInfoSocio(socioId);
      if (!socioInfo) {
        return [];
      }

      let comerciosAfiliados: string[] = [];

      // 1. Comercios directamente afiliados al socio (si existe esta relación)
      if (socioInfo.comerciosAfiliados && socioInfo.comerciosAfiliados.length > 0) {
        comerciosAfiliados = [...socioInfo.comerciosAfiliados];
      }

      // 2. Comercios vinculados a la asociación del socio (si tiene asociación)
      if (socioInfo.asociacionId) {
        const comerciosAsociacion = await this.obtenerComerciosVinculadosAsociacion(socioInfo.asociacionId);
        comerciosAfiliados = [...new Set([...comerciosAfiliados, ...comerciosAsociacion])];
      }

      // 3. Para socios sin asociación, obtener comercios con beneficios públicos
      if (!socioInfo.asociacionId) {
        const comerciosPublicos = await this.obtenerComerciosConBeneficiosPublicos();
        comerciosAfiliados = [...new Set([...comerciosAfiliados, ...comerciosPublicos])];
      }

      this.setCache(cacheKey, comerciosAfiliados);
      return comerciosAfiliados;
    } catch (error) {
      console.error('Error obteniendo comercios afiliados del socio:', error);
      return [];
    }
  }

  // Obtener comercios con beneficios públicos - NEW METHOD
  private static async obtenerComerciosConBeneficiosPublicos(): Promise<string[]> {
    try {
      const cacheKey = 'comercios_beneficios_publicos';
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as string[];
      }

      const q = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('estado', '==', 'activo'),
        where('tipoAcceso', 'in', ['publico', 'directo'])
      );

      const snapshot = await getDocs(q);
      const comerciosIds = [...new Set(snapshot.docs.map(doc => doc.data().comercioId))];

      this.setCache(cacheKey, comerciosIds);
      return comerciosIds;
    } catch (error) {
      console.error('Error obteniendo comercios con beneficios públicos:', error);
      return [];
    }
  }

  // Obtener comercios vinculados a una asociación
  private static async obtenerComerciosVinculadosAsociacion(asociacionId: string): Promise<string[]> {
    try {
      const cacheKey = this.getCacheKey('comercios_vinculados_asociacion', { asociacionId });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as string[];
      }

      // Buscar en la colección de asociaciones los comercios vinculados
      const asociacionDoc = await getDoc(doc(db, this.ASOCIACIONES_COLLECTION, asociacionId));
      if (asociacionDoc.exists()) {
        const data = asociacionDoc.data();
        const comerciosVinculados = data.comerciosVinculados || [];
        this.setCache(cacheKey, comerciosVinculados);
        return comerciosVinculados;
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo comercios vinculados a la asociación:', error);
      return [];
    }
  }

  // Obtener asociaciones vinculadas a un comercio
  private static async obtenerAsociacionesVinculadas(comercioId: string): Promise<string[]> {
    try {
      // Buscar en la colección de asociaciones donde el comercio esté vinculado
      const q = query(
        collection(db, this.ASOCIACIONES_COLLECTION),
        where('comerciosVinculados', 'array-contains', comercioId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error obteniendo asociaciones vinculadas:', error);
      return [];
    }
  }

  // NEW METHOD: Get available benefits for a socio (supports socios without association)
  static async getBeneficiosDisponibles(
    socioId: string,
    asociacionId?: string,
    filtros?: BeneficioFilter,
    limite: number = 50
  ): Promise<Beneficio[]> {
    try {
      console.log('🔍 Obteniendo beneficios disponibles para socio:', socioId, 'asociación:', asociacionId);

      const cacheKey = this.getCacheKey('beneficios_disponibles_socio', { socioId, asociacionId, filtros, limite });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as Beneficio[];
      }

      let beneficios: Beneficio[] = [];

      if (asociacionId) {
        // Socio with association: get association benefits + affiliated comercios
        beneficios = await this.obtenerBeneficiosDisponibles(socioId, asociacionId, filtros, limite);
      } else {
        // Socio without association: get public and direct benefits
        const comerciosAfiliados = await this.obtenerComerciosAfiliadosSocio(socioId);
        
        if (comerciosAfiliados.length > 0) {
          // Get public benefits from affiliated comercios
          const lotes = [];
          for (let i = 0; i < comerciosAfiliados.length; i += 10) {
            lotes.push(comerciosAfiliados.slice(i, i + 10));
          }

          for (const lote of lotes) {
            const q = query(
              collection(db, this.BENEFICIOS_COLLECTION),
              where('estado', '==', 'activo'),
              where('comercioId', 'in', lote),
              where('tipoAcceso', 'in', ['publico', 'directo']),
              orderBy('creadoEn', 'desc')
            );

            const snapshot = await getDocs(q);
            const beneficiosLote = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Beneficio[];

            beneficios = [...beneficios, ...beneficiosLote];
          }
        }

        // Also get general public benefits
        const qPublicos = query(
          collection(db, this.BENEFICIOS_COLLECTION),
          where('estado', '==', 'activo'),
          where('tipoAcceso', '==', 'publico'),
          orderBy('creadoEn', 'desc'),
          limit(limite)
        );

        const snapshotPublicos = await getDocs(qPublicos);
        const beneficiosPublicos = snapshotPublicos.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Beneficio[];

        beneficios = [...beneficios, ...beneficiosPublicos];

        // Remove duplicates
        const beneficiosUnicos = beneficios.reduce((acc, beneficio) => {
          if (!acc.find(b => b.id === beneficio.id)) {
            acc.push(beneficio);
          }
          return acc;
        }, [] as Beneficio[]);

        beneficios = beneficiosUnicos;
      }

      // Apply filters
      if (filtros?.categoria) {
        beneficios = beneficios.filter(b => b.categoria === filtros.categoria);
      }

      if (filtros?.comercio) {
        beneficios = beneficios.filter(b => b.comercioId === filtros.comercio);
      }

      if (filtros?.soloDestacados) {
        beneficios = beneficios.filter(b => b.destacado === true);
      }

      // Filter by date and limits
      const now = new Date();
      beneficios = beneficios.filter(beneficio => {
        const fechaFin = beneficio.fechaFin.toDate();
        const fechaInicio = beneficio.fechaInicio.toDate();
        
        if (fechaFin <= now || fechaInicio > now) return false;
        if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) return false;

        if (filtros?.busqueda) {
          const busqueda = filtros.busqueda.toLowerCase();
          const coincide = 
            beneficio.titulo.toLowerCase().includes(busqueda) ||
            beneficio.descripcion.toLowerCase().includes(busqueda) ||
            beneficio.comercioNombre.toLowerCase().includes(busqueda) ||
            beneficio.categoria.toLowerCase().includes(busqueda);
          
          if (!coincide) return false;
        }

        return true;
      });

      // Sort and limit
      beneficios = beneficios
        .sort((a, b) => b.creadoEn.toDate().getTime() - a.creadoEn.toDate().getTime())
        .slice(0, limite);

      this.setCache(cacheKey, beneficios);
      console.log(`✅ Se encontraron ${beneficios.length} beneficios disponibles para el socio`);
      
      return beneficios;
    } catch (error) {
      console.error('❌ Error obteniendo beneficios disponibles:', error);
      throw new Error('Error al obtener beneficios disponibles');
    }
  }

  // CRUD Básico
  static async crearBeneficio(data: BeneficioFormData, userId: string, userRole: string): Promise<string> {
    try {
      console.log('🎁 Creando beneficio:', data.titulo);

      let comercioInfo = null;
      let asociacionInfo = null;
      let comercioId = '';
      let asociacionId = '';
      let asociacionesDisponibles: string[] = [];

      if (userRole === 'comercio') {
        comercioId = userId;
        comercioInfo = await this.obtenerInfoComercio(userId);
        
        // Para comercios, obtener asociaciones vinculadas automáticamente
        if (data.asociacionesDisponibles && data.asociacionesDisponibles.length > 0) {
          asociacionesDisponibles = data.asociacionesDisponibles;
        } else {
          // Si no se especifican, obtener todas las asociaciones vinculadas
          asociacionesDisponibles = await this.obtenerAsociacionesVinculadas(userId);
        }
        
      } else if (userRole === 'asociacion') {
        asociacionId = userId;
        asociacionInfo = await this.obtenerInfoAsociacion(userId);
        asociacionesDisponibles = [userId]; // Solo para esta asociación
        
        // Para asociaciones, el comercio debe especificarse
        if (data.comercioId) {
          comercioId = data.comercioId;
          comercioInfo = await this.obtenerInfoComercio(data.comercioId);
        }
      }

      // Validaciones
      if (!comercioInfo && userRole === 'comercio') {
        throw new Error('No se pudo obtener la información del comercio');
      }

      if (!asociacionInfo && userRole === 'asociacion') {
        throw new Error('No se pudo obtener la información de la asociación');
      }

      // Crear el objeto de datos base
      const beneficioDataBase = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        tipo: data.tipo,
        descuento: data.descuento,
        fechaInicio: Timestamp.fromDate(data.fechaInicio),
        fechaFin: Timestamp.fromDate(data.fechaFin),
        categoria: data.categoria,
        usosActuales: 0,
        estado: 'activo' as const,
        tipoAcceso: asociacionesDisponibles.length > 0 ? 'asociacion' : 'publico', // Default access type
        creadoEn: Timestamp.now(),
        actualizadoEn: Timestamp.now(),
        creadoPor: userId,
        comercioId,
        comercioNombre: comercioInfo?.nombre || 'Comercio',
        asociacionId,
        asociacionNombre: asociacionInfo?.nombre || '',
        asociacionesDisponibles
      };

      // Agregar campos opcionales solo si tienen valor
      const beneficioData: Record<string, unknown> = { ...beneficioDataBase };

      if (data.limitePorSocio !== undefined && data.limitePorSocio > 0) {
        beneficioData.limitePorSocio = data.limitePorSocio;
      }

      if (data.limiteTotal !== undefined && data.limiteTotal > 0) {
        beneficioData.limiteTotal = data.limiteTotal;
      }

      if (data.condiciones && data.condiciones.trim()) {
        beneficioData.condiciones = data.condiciones.trim();
      }

      if (data.tags && data.tags.length > 0) {
        beneficioData.tags = data.tags;
      }

      if (data.destacado === true) {
        beneficioData.destacado = true;
      }

      if (comercioInfo?.logo) {
        beneficioData.comercioLogo = comercioInfo.logo;
      }

      // Limpiar datos antes de enviar a Firebase
      const cleanedData = this.cleanDataForFirestore(beneficioData);

      const docRef = await addDoc(collection(db, this.BENEFICIOS_COLLECTION), cleanedData);
      
      // Limpiar cache
      this.clearCache('beneficios');
      
      console.log('✅ Beneficio creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando beneficio:', error);
      throw new Error('Error al crear el beneficio');
    }
  }

  static async obtenerBeneficio(id: string): Promise<Beneficio | null> {
    try {
      const cacheKey = this.getCacheKey('beneficio', { id });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as Beneficio;
      }

      const docRef = doc(db, this.BENEFICIOS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const beneficio = { id: docSnap.id, ...docSnap.data() } as Beneficio;
        this.setCache(cacheKey, beneficio);
        return beneficio;
      }

      return null;
    } catch (error) {
      console.error('❌ Error obteniendo beneficio:', error);
      throw new Error('Error al obtener el beneficio');
    }
  }

  static async actualizarBeneficio(id: string, data: Partial<BeneficioFormData>): Promise<void> {
    try {
      console.log('📝 Actualizando beneficio:', id);

      // Crear el objeto de actualización con tipos correctos
      const updateDataBase: Partial<Omit<BeneficioFormData, 'fechaInicio' | 'fechaFin'>>
        & { fechaInicio?: Timestamp; fechaFin?: Timestamp; actualizadoEn: Timestamp } = {
        actualizadoEn: Timestamp.now()
      };

      // Agregar campos que no son fechas
      if (data.titulo !== undefined) updateDataBase.titulo = data.titulo;
      if (data.descripcion !== undefined) updateDataBase.descripcion = data.descripcion;
      if (data.tipo !== undefined) updateDataBase.tipo = data.tipo;
      if (data.descuento !== undefined) updateDataBase.descuento = data.descuento;
      if (data.categoria !== undefined) updateDataBase.categoria = data.categoria;

      // Campos opcionales - solo agregar si tienen valor
      if (data.limitePorSocio !== undefined && data.limitePorSocio > 0) {
        updateDataBase.limitePorSocio = data.limitePorSocio;
      }

      if (data.limiteTotal !== undefined && data.limiteTotal > 0) {
        updateDataBase.limiteTotal = data.limiteTotal;
      }

      if (data.condiciones !== undefined) {
        if (data.condiciones.trim()) {
          updateDataBase.condiciones = data.condiciones.trim();
        } else {
          updateDataBase.condiciones = undefined;
        }
      }

      if (data.tags !== undefined) {
        if (data.tags.length > 0) {
          updateDataBase.tags = data.tags;
        } else {
          updateDataBase.tags = undefined;
        }
      }

      if (data.destacado !== undefined) {
        updateDataBase.destacado = data.destacado;
      }

      if (data.asociacionesDisponibles !== undefined) {
        updateDataBase.asociacionesDisponibles = data.asociacionesDisponibles;
      }

      // Convertir fechas si están presentes
      if (data.fechaInicio) {
        updateDataBase.fechaInicio = Timestamp.fromDate(data.fechaInicio);
      }
      if (data.fechaFin) {
        updateDataBase.fechaFin = Timestamp.fromDate(data.fechaFin);
      }

      // Limpiar datos antes de enviar a Firebase
      const cleanedUpdateData = this.cleanDataForFirestore(updateDataBase);

      const docRef = doc(db, this.BENEFICIOS_COLLECTION, id);
      await updateDoc(docRef, cleanedUpdateData as Partial<BeneficioFormData>);

      // Limpiar cache
      this.clearCache('beneficio');
      this.clearCache('beneficios');

      console.log('✅ Beneficio actualizado');
    } catch (error) {
      console.error('❌ Error actualizando beneficio:', error);
      throw new Error('Error al actualizar el beneficio');
    }
  }

  static async eliminarBeneficio(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando beneficio:', id);

      // En lugar de eliminar, marcamos como inactivo
      await this.actualizarEstadoBeneficio(id, 'inactivo');

      console.log('✅ Beneficio eliminado (marcado como inactivo)');
    } catch (error) {
      console.error('❌ Error eliminando beneficio:', error);
      throw new Error('Error al eliminar el beneficio');
    }
  }

  static async actualizarEstadoBeneficio(id: string, estado: 'activo' | 'inactivo' | 'vencido' | 'agotado'): Promise<void> {
    try {
      const docRef = doc(db, this.BENEFICIOS_COLLECTION, id);
      await updateDoc(docRef, {
        estado,
        actualizadoEn: Timestamp.now()
      });

      this.clearCache('beneficio');
      this.clearCache('beneficios');
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw new Error('Error al actualizar el estado del beneficio');
    }
  }

  // Consultas avanzadas - MÉTODO ACTUALIZADO PARA SOCIOS
  static async obtenerBeneficiosDisponibles(
    socioId: string,
    asociacionId: string,
    filtros?: BeneficioFilter,
    limite: number = 50
  ): Promise<Beneficio[]> {
    try {
      console.log('🔍 Obteniendo beneficios disponibles para socio:', socioId);

      const cacheKey = this.getCacheKey('beneficios_disponibles', { socioId, asociacionId, filtros, limite });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as Beneficio[];
      }

      // Obtener comercios afiliados al socio
      const comerciosAfiliados = await this.obtenerComerciosAfiliadosSocio(socioId);
      console.log('🏪 Comercios afiliados encontrados:', comerciosAfiliados.length);

      let beneficios: Beneficio[] = [];

      // 1. Obtener beneficios de la asociación del socio
      const qAsociacion = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('estado', '==', 'activo'),
        where('asociacionesDisponibles', 'array-contains', asociacionId),
        orderBy('creadoEn', 'desc'),
        limit(limite)
      );

      const snapshotAsociacion = await getDocs(qAsociacion);
      const beneficiosAsociacion = snapshotAsociacion.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      beneficios = [...beneficiosAsociacion];

      // 2. Obtener beneficios de comercios afiliados (si hay comercios afiliados)
      if (comerciosAfiliados.length > 0) {
        // Firebase tiene límite de 10 elementos en array-contains-any, así que dividimos en lotes
        const lotes = [];
        for (let i = 0; i < comerciosAfiliados.length; i += 10) {
          lotes.push(comerciosAfiliados.slice(i, i + 10));
        }

        for (const lote of lotes) {
          const qComercios = query(
            collection(db, this.BENEFICIOS_COLLECTION),
            where('estado', '==', 'activo'),
            where('comercioId', 'in', lote),
            orderBy('creadoEn', 'desc')
          );

          const snapshotComercios = await getDocs(qComercios);
          const beneficiosComercios = snapshotComercios.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Beneficio[];

          beneficios = [...beneficios, ...beneficiosComercios];
        }
      }

      // Eliminar duplicados (un beneficio puede aparecer tanto por asociación como por comercio)
      const beneficiosUnicos = beneficios.reduce((acc, beneficio) => {
        if (!acc.find(b => b.id === beneficio.id)) {
          acc.push(beneficio);
        }
        return acc;
      }, [] as Beneficio[]);

      // Aplicar filtros adicionales
      if (filtros?.categoria) {
        beneficios = beneficiosUnicos.filter(b => b.categoria === filtros.categoria);
      } else {
        beneficios = beneficiosUnicos;
      }

      if (filtros?.comercio) {
        beneficios = beneficios.filter(b => b.comercioId === filtros.comercio);
      }

      if (filtros?.soloDestacados) {
        beneficios = beneficios.filter(b => b.destacado === true);
      }

      // Filtros adicionales en el cliente
      const now = new Date();
      
      beneficios = beneficios.filter(beneficio => {
        // Verificar fecha de vencimiento
        const fechaFin = beneficio.fechaFin.toDate();
        if (fechaFin <= now) return false;

        // Verificar fecha de inicio
        const fechaInicio = beneficio.fechaInicio.toDate();
        if (fechaInicio > now) return false;

        // Verificar límite total
        if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
          return false;
        }

        // Filtro de búsqueda
        if (filtros?.busqueda) {
          const busqueda = filtros.busqueda.toLowerCase();
          const coincide = 
            beneficio.titulo.toLowerCase().includes(busqueda) ||
            beneficio.descripcion.toLowerCase().includes(busqueda) ||
            beneficio.comercioNombre.toLowerCase().includes(busqueda) ||
            beneficio.categoria.toLowerCase().includes(busqueda);
          
          if (!coincide) return false;
        }

        // Filtro de nuevos (últimos 7 días)
        if (filtros?.soloNuevos) {
          const hace7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (beneficio.creadoEn.toDate() < hace7Dias) return false;
        }

        // Filtro de próximos a vencer (próximos 7 días)
        if (filtros?.proximosAVencer) {
          const en7Dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (fechaFin > en7Dias) return false;
        }

        return true;
      });

      // Ordenar por fecha de creación (más recientes primero) y limitar
      beneficios = beneficios
        .sort((a, b) => b.creadoEn.toDate().getTime() - a.creadoEn.toDate().getTime())
        .slice(0, limite);

      this.setCache(cacheKey, beneficios);
      console.log(`✅ Se encontraron ${beneficios.length} beneficios disponibles para el socio`);
      
      return beneficios;
    } catch (error) {
      console.error('❌ Error obteniendo beneficios disponibles:', error);
      throw new Error('Error al obtener beneficios disponibles');
    }
  }

  static async obtenerBeneficiosPorComercio(comercioId: string): Promise<Beneficio[]> {
    try {
      const cacheKey = this.getCacheKey('beneficios_comercio', { comercioId });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as Beneficio[];
      }

      const q = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('comercioId', '==', comercioId),
        orderBy('creadoEn', 'desc')
      );

      const snapshot = await getDocs(q);
      const beneficios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      this.setCache(cacheKey, beneficios);
      return beneficios;
    } catch (error) {
      console.error('❌ Error obteniendo beneficios por comercio:', error);
      throw new Error('Error al obtener beneficios del comercio');
    }
  }

  static async obtenerBeneficiosPorAsociacion(asociacionId: string): Promise<Beneficio[]> {
    try {
      const cacheKey = this.getCacheKey('beneficios_asociacion', { asociacionId });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as Beneficio[];
      }

      const q = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('asociacionesDisponibles', 'array-contains', asociacionId),
        orderBy('creadoEn', 'desc')
      );

      const snapshot = await getDocs(q);
      const beneficios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      this.setCache(cacheKey, beneficios);
      return beneficios;
    } catch (error) {
      console.error('❌ Error obteniendo beneficios por asociación:', error);
      throw new Error('Error al obtener beneficios de la asociación');
    }
  }

  // Resto de métodos permanecen igual...
  // [Incluir todos los métodos restantes del archivo anterior]

  // Uso de beneficios
  static async usarBeneficio(
    beneficioId: string,
    socioId: string,
    socioData: { nombre: string; email: string },
    comercioId: string,
    asociacionId: string,
    montoOriginal?: number
  ): Promise<BeneficioUso> {
    try {
      console.log('🎯 Usando beneficio:', beneficioId);

      // Obtener el beneficio
      const beneficio = await this.obtenerBeneficio(beneficioId);
      if (!beneficio) {
        throw new Error('Beneficio no encontrado');
      }

      // Verificaciones
      if (beneficio.estado !== 'activo') {
        throw new Error('El beneficio no está disponible');
      }

      const now = new Date();
      if (beneficio.fechaFin.toDate() <= now) {
        throw new Error('El beneficio ha expirado');
      }

      if (beneficio.fechaInicio.toDate() > now) {
        throw new Error('El beneficio aún no está disponible');
      }

      if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
        throw new Error('El beneficio ha alcanzado su límite de usos');
      }

      // Verificar límite por socio
      if (beneficio.limitePorSocio) {
        const usosDelSocio = await this.obtenerUsosDelSocio(beneficioId, socioId);
        if (usosDelSocio >= beneficio.limitePorSocio) {
          throw new Error('Has alcanzado el límite de usos para este beneficio');
        }
      }

      // Verificar que el socio tenga acceso a este beneficio
      const comerciosAfiliados = await this.obtenerComerciosAfiliadosSocio(socioId);
      const tieneAcceso = 
        beneficio.asociacionesDisponibles.includes(asociacionId) ||
        comerciosAfiliados.includes(beneficio.comercioId) ||
        beneficio.tipoAcceso === 'publico';

      if (!tieneAcceso) {
        throw new Error('No tienes acceso a este beneficio');
      }

      // Calcular descuento
      const montoDescuento = this.calcularDescuento(beneficio, montoOriginal || 0);
      const montoFinal = montoOriginal ? Math.max(0, montoOriginal - montoDescuento) : 0;

      // Crear registro de uso
      const usoDataBase = {
        beneficioId,
        beneficioTitulo: beneficio.titulo,
        socioId,
        socioNombre: socioData.nombre,
        socioEmail: socioData.email,
        comercioId,
        comercioNombre: beneficio.comercioNombre,
        asociacionId: asociacionId || null,
        asociacionNombre: beneficio.asociacionNombre || null,
        fechaUso: Timestamp.now(),
        montoDescuento,
        estado: 'usado' as const,
        creadoEn: Timestamp.now(),
        actualizadoEn: Timestamp.now()
      };

      // Agregar campos opcionales solo si tienen valor
      const usoData: Record<string, unknown> = { ...usoDataBase };
      
      if (montoOriginal !== undefined) {
        usoData.montoOriginal = montoOriginal;
      }
      
      if (montoFinal !== undefined) {
        usoData.montoFinal = montoFinal;
      }

      // Limpiar datos antes de enviar a Firebase
      const cleanedUsoData = this.cleanDataForFirestore(usoData);

      // Usar batch para operaciones atómicas
      const batch = writeBatch(db);

      // Agregar uso
      const usoRef = doc(collection(db, this.USOS_COLLECTION));
      batch.set(usoRef, cleanedUsoData);

      // Actualizar contador del beneficio
      const beneficioRef = doc(db, this.BENEFICIOS_COLLECTION, beneficioId);
      batch.update(beneficioRef, {
        usosActuales: increment(1),
        actualizadoEn: Timestamp.now()
      });

      // Verificar si se agotó
      if (beneficio.limiteTotal && beneficio.usosActuales + 1 >= beneficio.limiteTotal) {
        batch.update(beneficioRef, { estado: 'agotado' });
      }

      await batch.commit();

      // Limpiar cache
      this.clearCache();

      const usoCompleto: BeneficioUso = { id: usoRef.id, ...(cleanedUsoData as Omit<BeneficioUso, 'id'>) };
      console.log('✅ Beneficio usado exitosamente');
      
      return usoCompleto;
    } catch (error) {
      console.error('❌ Error usando beneficio:', error);
      throw error;
    }
  }

  static async obtenerUsosDelSocio(beneficioId: string, socioId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.USOS_COLLECTION),
        where('beneficioId', '==', beneficioId),
        where('socioId', '==', socioId),
        where('estado', '==', 'usado')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error obteniendo usos del socio:', error);
      return 0;
    }
  }

  static async obtenerHistorialUsos(socioId: string, limite: number = 50): Promise<BeneficioUso[]> {
    try {
      const cacheKey = this.getCacheKey('historial_usos', { socioId, limite });
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as BeneficioUso[];
      }

      const q = query(
        collection(db, this.USOS_COLLECTION),
        where('socioId', '==', socioId),
        orderBy('fechaUso', 'desc'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      const usos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BeneficioUso[];

      this.setCache(cacheKey, usos);
      return usos;
    } catch (error) {
      console.error('❌ Error obteniendo historial de usos:', error);
      throw new Error('Error al obtener el historial de usos');
    }
  }

  // Estadísticas
  static async obtenerEstadisticas(
    filtros?: {
      comercioId?: string;
      asociacionId?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
    }
  ): Promise<BeneficioStats> {
    try {
      console.log('📊 Calculando estadísticas de beneficios');

      const cacheKey = this.getCacheKey('estadisticas', filtros);
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as BeneficioStats;
      }

      // Consultas paralelas para mejor rendimiento
      const [beneficiosSnapshot, usosSnapshot] = await Promise.all([
        this.obtenerBeneficiosParaEstadisticas(filtros),
        this.obtenerUsosParaEstadisticas(filtros)
      ]);

      const beneficios = beneficiosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      const usos = usosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BeneficioUso[];

      // Calcular estadísticas
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: BeneficioStats = {
        totalBeneficios: beneficios.length,
        beneficiosActivos: beneficios.filter(b => b.estado === 'activo').length,
        beneficiosUsados: usos.length,
        beneficiosVencidos: beneficios.filter(b => b.estado === 'vencido').length,
        ahorroTotal: usos.reduce((total, uso) => total + (uso.montoDescuento || 0), 0),
        ahorroEsteMes: usos
          .filter(uso => uso.fechaUso.toDate() >= inicioMes)
          .reduce((total, uso) => total + (uso.montoDescuento || 0), 0),
        usosPorMes: this.calcularUsosPorMes(usos),
        topBeneficios: this.calcularTopBeneficios(beneficios, usos),
        categorias: this.calcularEstadisticasCategorias(beneficios, usos),
        comercios: this.calcularEstadisticasComercios(beneficios, usos),
        activos: beneficios.filter(b => b.estado === 'activo').length
      };

      this.setCache(cacheKey, stats);
      console.log('✅ Estadísticas calculadas');
      
      return stats;
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      throw new Error('Error al calcular estadísticas');
    }
  }

  // Métodos auxiliares
  private static calcularDescuento(beneficio: Beneficio, montoOriginal: number): number {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return montoOriginal * (beneficio.descuento / 100);
      case 'monto_fijo':
        return Math.min(beneficio.descuento, montoOriginal);
      case 'producto_gratis':
        return montoOriginal;
      default:
        return 0;
    }
  }

  private static async obtenerBeneficiosParaEstadisticas(filtros?: { comercioId?: string; asociacionId?: string }) {
    let q = query(collection(db, this.BENEFICIOS_COLLECTION));

    if (filtros?.comercioId) {
      q = query(q, where('comercioId', '==', filtros.comercioId));
    }

    if (filtros?.asociacionId) {
      q = query(q, where('asociacionesDisponibles', 'array-contains', filtros.asociacionId));
    }

    return await getDocs(q);
  }

  private static async obtenerUsosParaEstadisticas(filtros?: { comercioId?: string; asociacionId?: string; fechaInicio?: Date; fechaFin?: Date }) {
    let q = query(collection(db, this.USOS_COLLECTION));

    if (filtros?.comercioId) {
      q = query(q, where('comercioId', '==', filtros.comercioId));
    }

    if (filtros?.asociacionId) {
      q = query(q, where('asociacionId', '==', filtros.asociacionId));
    }

    if (filtros?.fechaInicio) {
      q = query(q, where('fechaUso', '>=', Timestamp.fromDate(filtros.fechaInicio)));
    }

    if (filtros?.fechaFin) {
      q = query(q, where('fechaUso', '<=', Timestamp.fromDate(filtros.fechaFin)));
    }

    return await getDocs(q);
  }

  private static calcularUsosPorMes(usos: BeneficioUso[]) {
    const usosPorMes = new Map<string, { usos: number; ahorro: number }>();
    
    usos.forEach(uso => {
      const fecha = uso.fechaUso.toDate();
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      const actual = usosPorMes.get(mes) || { usos: 0, ahorro: 0 };
      actual.usos += 1;
      actual.ahorro += uso.montoDescuento || 0;
      usosPorMes.set(mes, actual);
    });

    return Array.from(usosPorMes.entries()).map(([mes, data]) => ({
      mes,
      ...data
    }));
  }

  private static calcularTopBeneficios(beneficios: Beneficio[], usos: BeneficioUso[]) {
    const usosMap = new Map<string, { usos: number; ahorro: number }>();
    
    usos.forEach(uso => {
      const actual = usosMap.get(uso.beneficioId) || { usos: 0, ahorro: 0 };
      actual.usos += 1;
      actual.ahorro += uso.montoDescuento || 0;
      usosMap.set(uso.beneficioId, actual);
    });

    return beneficios
      .map(beneficio => ({
        id: beneficio.id,
        titulo: beneficio.titulo,
        usos: usosMap.get(beneficio.id)?.usos || 0,
        ahorro: usosMap.get(beneficio.id)?.ahorro || 0
      }))
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 10);
  }

  private static calcularEstadisticasCategorias(beneficios: Beneficio[], usos: BeneficioUso[]) {
    const categoriasMap = new Map<string, { cantidad: number; usos: number }>();
    
    beneficios.forEach(beneficio => {
      const actual = categoriasMap.get(beneficio.categoria) || { cantidad: 0, usos: 0 };
      actual.cantidad += 1;
      categoriasMap.set(beneficio.categoria, actual);
    });

    usos.forEach(uso => {
      const beneficio = beneficios.find(b => b.id === uso.beneficioId);
      if (beneficio) {
        const actual = categoriasMap.get(beneficio.categoria) || { cantidad: 0, usos: 0 };
        actual.usos += 1;
        categoriasMap.set(beneficio.categoria, actual);
      }
    });

    return Array.from(categoriasMap.entries()).map(([nombre, data]) => ({
      nombre,
      ...data
    }));
  }

  private static calcularEstadisticasComercios(beneficios: Beneficio[], usos: BeneficioUso[]) {
    const comerciosMap = new Map<string, { nombre: string; beneficios: number; usos: number }>();
    
    beneficios.forEach(beneficio => {
      const actual = comerciosMap.get(beneficio.comercioId) || { 
        nombre: beneficio.comercioNombre, 
        beneficios: 0, 
        usos: 0 
      };
      actual.beneficios += 1;
      comerciosMap.set(beneficio.comercioId, actual);
    });

    usos.forEach(uso => {
      const actual = comerciosMap.get(uso.comercioId) || { 
        nombre: uso.comercioNombre, 
        beneficios: 0, 
        usos: 0 
      };
      actual.usos += 1;
      comerciosMap.set(uso.comercioId, actual);
    });

    return Array.from(comerciosMap.entries()).map(([id, data]) => ({
      id,
      ...data
    }));
  }

  // Listeners en tiempo real - ACTUALIZADO PARA SOCIOS
  static suscribirBeneficiosDisponibles(
    socioId: string,
    asociacionId: string,
    callback: (beneficios: Beneficio[]) => void
  ): Unsubscribe {
    // Para tiempo real, usamos una aproximación más simple
    // En producción, podrías considerar usar Cloud Functions para mantener una vista materializada
    const q = query(
      collection(db, this.BENEFICIOS_COLLECTION),
      where('estado', '==', 'activo'),
      where('asociacionesDisponibles', 'array-contains', asociacionId),
      orderBy('creadoEn', 'desc'),
      limit(50)
    );

    return onSnapshot(q, async (snapshot) => {
      try {
        let beneficios = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Beneficio[];

        // Obtener también beneficios de comercios afiliados
        const comerciosAfiliados = await this.obtenerComerciosAfiliadosSocio(socioId);
        
        if (comerciosAfiliados.length > 0) {
          // Obtener beneficios de comercios afiliados (simplificado para tiempo real)
          const lotes = [];
          for (let i = 0; i < comerciosAfiliados.length; i += 10) {
            lotes.push(comerciosAfiliados.slice(i, i + 10));
          }

          for (const lote of lotes) {
            const qComercios = query(
              collection(db, this.BENEFICIOS_COLLECTION),
              where('estado', '==', 'activo'),
              where('comercioId', 'in', lote)
            );

            const snapshotComercios = await getDocs(qComercios);
            const beneficiosComercios = snapshotComercios.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Beneficio[];

            beneficios = [...beneficios, ...beneficiosComercios];
          }
        }

        // Eliminar duplicados
        const beneficiosUnicos = beneficios.reduce((acc, beneficio) => {
          if (!acc.find(b => b.id === beneficio.id)) {
            acc.push(beneficio);
          }
          return acc;
        }, [] as Beneficio[]);

        // Filtrar por fecha de vencimiento y inicio
        const now = new Date();
        const beneficiosValidos = beneficiosUnicos.filter(beneficio => {
          const fechaFin = beneficio.fechaFin.toDate();
          const fechaInicio = beneficio.fechaInicio.toDate();
          return fechaFin > now && fechaInicio <= now;
        });

        // Ordenar por fecha de creación
        beneficiosValidos.sort((a, b) => b.creadoEn.toDate().getTime() - a.creadoEn.toDate().getTime());

        callback(beneficiosValidos);
      } catch (error) {
        console.error('Error en listener de beneficios:', error);
        callback([]);
      }
    });
  }

  static suscribirBeneficiosComercio(
    comercioId: string,
    callback: (beneficios: Beneficio[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.BENEFICIOS_COLLECTION),
      where('comercioId', '==', comercioId),
      orderBy('creadoEn', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const beneficios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      callback(beneficios);
    });
  }

  // Validaciones automáticas
  static async verificarBeneficiosVencidos(): Promise<void> {
    try {
      console.log('🔍 Verificando beneficios vencidos...');

      const now = Timestamp.now();
      const q = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('estado', '==', 'activo'),
        where('fechaFin', '<=', now)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('✅ No hay beneficios vencidos');
        return;
      }

      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          estado: 'vencido',
          actualizadoEn: now
        });
      });

      await batch.commit();
      
      console.log(`✅ Se marcaron ${snapshot.size} beneficios como vencidos`);
      
      // Limpiar cache
      this.clearCache();
    } catch (error) {
      console.error('❌ Error verificando beneficios vencidos:', error);
    }
  }

  // Utilidades
  static async buscarBeneficios(
    termino: string,
    filtros?: BeneficioFilter,
    limite: number = 20
  ): Promise<Beneficio[]> {
    try {
      // Para búsquedas de texto completo, necesitarías usar Algolia o similar
      // Por ahora, hacemos una búsqueda básica
      const q = query(
        collection(db, this.BENEFICIOS_COLLECTION),
        where('estado', '==', 'activo'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      let beneficios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beneficio[];

      // Filtrar por término de búsqueda
      const terminoLower = termino.toLowerCase();
      beneficios = beneficios.filter(beneficio => 
        beneficio.titulo.toLowerCase().includes(terminoLower) ||
        beneficio.descripcion.toLowerCase().includes(terminoLower) ||
        beneficio.comercioNombre.toLowerCase().includes(terminoLower) ||
        beneficio.categoria.toLowerCase().includes(terminoLower) ||
        beneficio.tags?.some(tag => tag.toLowerCase().includes(terminoLower))
      );

      return beneficios;
    } catch (error) {
      console.error('❌ Error buscando beneficios:', error);
      throw new Error('Error en la búsqueda de beneficios');
    }
  }

  static async obtenerCategorias(): Promise<string[]> {
    try {
      const cacheKey = 'categorias_beneficios';
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as string[];
      }

      const q = query(collection(db, this.BENEFICIOS_COLLECTION));
      const snapshot = await getDocs(q);
      
      const categorias = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.categoria) {
          categorias.add(data.categoria);
        }
      });

      const categoriasArray = Array.from(categorias).sort();
      this.setCache(cacheKey, categoriasArray);
      
      return categoriasArray;
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      return [];
    }
  }

  // Obtener asociaciones disponibles para un comercio
  static async obtenerAsociacionesDisponibles(comercioId: string): Promise<Array<{id: string; nombre: string}>> {
    try {
      const asociacionesIds = await this.obtenerAsociacionesVinculadas(comercioId);
      
      if (asociacionesIds.length === 0) {
        return [];
      }

      const asociaciones = await Promise.all(
        asociacionesIds.map(async (id) => {
          const info = await this.obtenerInfoAsociacion(id);
          return {
            id,
            nombre: info?.nombre || 'Asociación'
          };
        })
      );

      return asociaciones;
    } catch (error) {
      console.error('❌ Error obteniendo asociaciones disponibles:', error);
      return [];
    }
  }
}
