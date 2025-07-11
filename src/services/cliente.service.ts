import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleFirebaseError } from '@/lib/firebase-errors';
import {
  Cliente,
  ClienteFormData,
  ClienteStats,
  ClienteActivity,
  ClienteFilter,
  ClienteSegment,
  ClienteExport,
} from '@/types/cliente';

export class ClienteService {
  private static readonly COLLECTION = COLLECTIONS.SOCIOS; // Reutilizamos la colección de socios
  private static readonly ACTIVITIES_COLLECTION = 'cliente_activities';
  private static readonly SEGMENTS_COLLECTION = 'cliente_segments';

  /**
   * Obtiene todos los clientes de un comercio
   */
  static async getClientesByComercio(
    comercioId: string,
    filtros: ClienteFilter = {}
  ): Promise<{ clientes: Cliente[]; total: number; hasMore: boolean }> {
    try {
      const clientesRef = collection(db, this.COLLECTION);
      let q = query(clientesRef, where('comercioId', '==', comercioId));

      // Aplicar filtros
      if (filtros.estado) {
        q = query(q, where('estado', '==', filtros.estado));
      }

      if (filtros.fechaDesde) {
        q = query(q, where('creadoEn', '>=', Timestamp.fromDate(filtros.fechaDesde)));
      }

      if (filtros.fechaHasta) {
        q = query(q, where('creadoEn', '<=', Timestamp.fromDate(filtros.fechaHasta)));
      }

      // Ordenamiento
      const ordenarPor = filtros.ordenarPor || 'creadoEn';
      const orden = filtros.orden || 'desc';
      q = query(q, orderBy(ordenarPor, orden));

      // Paginación
      const limite = filtros.limite || 20;
      q = query(q, limit(limite));

      if (filtros.offset) {
        // Para paginación real, necesitarías el último documento
        // Aquí simplificamos usando offset
      }

      const snapshot = await getDocs(q);
      const clientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cliente[];

      // Filtros adicionales en memoria (para campos que no están indexados)
      let clientesFiltrados = clientes;

      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        clientesFiltrados = clientesFiltrados.filter(cliente =>
          cliente.nombre.toLowerCase().includes(busqueda) ||
          cliente.email.toLowerCase().includes(busqueda) ||
          cliente.telefono?.includes(busqueda) ||
          cliente.dni?.includes(busqueda)
        );
      }

      if (filtros.montoMinimo) {
        clientesFiltrados = clientesFiltrados.filter(
          cliente => cliente.montoTotalGastado >= filtros.montoMinimo!
        );
      }

      if (filtros.montoMaximo) {
        clientesFiltrados = clientesFiltrados.filter(
          cliente => cliente.montoTotalGastado <= filtros.montoMaximo!
        );
      }

      if (filtros.tags && filtros.tags.length > 0) {
        clientesFiltrados = clientesFiltrados.filter(cliente =>
          filtros.tags!.some(tag => cliente.tags?.includes(tag))
        );
      }

      return {
        clientes: clientesFiltrados,
        total: clientesFiltrados.length,
        hasMore: snapshot.docs.length === limite,
      };
    } catch (error) {
      console.error('Error fetching clientes:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getClienteById(clienteId: string): Promise<Cliente | null> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      const clienteSnap = await getDoc(clienteRef);

      if (clienteSnap.exists()) {
        return {
          id: clienteSnap.id,
          ...clienteSnap.data(),
        } as Cliente;
      }

      return null;
    } catch (error) {
      console.error('Error fetching cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Crea un nuevo cliente
   */
  static async createCliente(
    comercioId: string,
    clienteData: ClienteFormData
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      
      const nuevoCliente: Omit<Cliente, 'id'> = {
        ...clienteData,
        fechaNacimiento: clienteData.fechaNacimiento 
          ? Timestamp.fromDate(new Date(clienteData.fechaNacimiento))
          : undefined,
        estado: 'activo',
        comercioId,
        creadoEn: now,
        actualizadoEn: now,
        totalCompras: 0,
        montoTotalGastado: 0,
        beneficiosUsados: 0,
        ahorroTotal: 0,
        frecuenciaVisitas: 0,
        categoriasFavoritas: [],
        promedioCompra: 0,
        tags: clienteData.tags || [],
      };

      const clienteRef = await addDoc(collection(db, this.COLLECTION), nuevoCliente);

      // Registrar actividad
      await this.logActivity(clienteRef.id, {
        tipo: 'registro',
        descripcion: 'Cliente registrado en el sistema',
        fecha: now,
      });

      return clienteRef.id;
    } catch (error) {
      console.error('Error creating cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza un cliente
   */
  static async updateCliente(
    clienteId: string,
    clienteData: Partial<ClienteFormData>
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      
      const { fechaNacimiento, ...restClienteData } = clienteData;
      // Remove fechaNacimiento from restClienteData to avoid type conflict
      const updateData: Omit<Partial<ClienteFormData>, 'fechaNacimiento'> & { actualizadoEn: Timestamp; fechaNacimiento?: Timestamp } = {
        ...restClienteData,
        actualizadoEn: Timestamp.now(),
        ...(fechaNacimiento
          ? { fechaNacimiento: Timestamp.fromDate(new Date(fechaNacimiento)) }
          : {}),
      };

      await updateDoc(clienteRef, updateData);

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'actualizacion',
        descripcion: 'Perfil del cliente actualizado',
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Elimina un cliente
   */
  static async deleteCliente(clienteId: string): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await deleteDoc(clienteRef);
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza el estado de un cliente
   */
  static async updateEstadoCliente(
    clienteId: string,
    estado: 'activo' | 'inactivo' | 'suspendido'
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        estado,
        actualizadoEn: Timestamp.now(),
      });

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'actualizacion',
        descripcion: `Estado del cliente cambiado a: ${estado}`,
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente estado:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Sube imagen de perfil del cliente
   */
  static async uploadClienteImage(clienteId: string, file: File): Promise<string> {
    try {
      // Validar archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
      }

      // Generar path único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const imagePath = `clientes/${clienteId}/avatar_${timestamp}.${extension}`;

      // Subir imagen
      const imageRef = ref(storage, imagePath);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      // Actualizar cliente con nueva URL
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        avatar: downloadURL,
        actualizadoEn: Timestamp.now(),
      });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading cliente image:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene estadísticas de clientes para un comercio
   */
  static async getClienteStats(comercioId: string): Promise<ClienteStats> {
    try {
      const clientesRef = collection(db, this.COLLECTION);
      const q = query(clientesRef, where('comercioId', '==', comercioId));
      const snapshot = await getDocs(q);

      const clientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cliente[];

      const totalClientes = clientes.length;
      const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
      const clientesInactivos = clientes.filter(c => c.estado === 'inactivo').length;

      // Clientes nuevos (últimos 30 días)
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const clientesNuevos = clientes.filter(c => 
        c.creadoEn.toDate() >= hace30Dias
      ).length;

      // Estadísticas de compras
      const totalCompras = clientes.reduce((sum, c) => sum + c.totalCompras, 0);
      const montoTotal = clientes.reduce((sum, c) => sum + c.montoTotalGastado, 0);
      const promedioComprasPorCliente = totalClientes > 0 ? totalCompras / totalClientes : 0;
      const montoPromedioCompra = totalCompras > 0 ? montoTotal / totalCompras : 0;

      // Clientes más activos (top 5)
      const clientesMasActivos = clientes
        .sort((a, b) => b.totalCompras - a.totalCompras)
        .slice(0, 5);

      // Crecimiento mensual (simplificado)
      const crecimientoMensual = clientesNuevos > 0 ? 
        ((clientesNuevos / Math.max(totalClientes - clientesNuevos, 1)) * 100) : 0;

      // Retención de clientes (clientes activos vs total)
      const retencionClientes = totalClientes > 0 ? 
        (clientesActivos / totalClientes) * 100 : 0;

      // Valor de vida promedio
      const valorVidaPromedio = totalClientes > 0 ? montoTotal / totalClientes : 0;

      return {
        totalClientes,
        clientesActivos,
        clientesNuevos,
        clientesInactivos,
        promedioComprasPorCliente,
        montoPromedioCompra,
        clientesMasActivos,
        crecimientoMensual,
        retencionClientes,
        valorVidaPromedio,
      };
    } catch (error) {
      console.error('Error getting cliente stats:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene actividades de un cliente
   */
  static async getClienteActivities(
    clienteId: string,
    limite: number = 20
  ): Promise<ClienteActivity[]> {
    try {
      const activitiesRef = collection(db, this.ACTIVITIES_COLLECTION);
      const q = query(
        activitiesRef,
        where('clienteId', '==', clienteId),
        orderBy('fecha', 'desc'),
        limit(limite)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ClienteActivity[];
    } catch (error) {
      console.error('Error getting cliente activities:', error);
      return [];
    }
  }

  /**
   * Registra una actividad del cliente
   */
  static async logActivity(
    clienteId: string,
    activity: Omit<ClienteActivity, 'id' | 'clienteId'>
  ): Promise<void> {
    try {
      const activitiesRef = collection(db, this.ACTIVITIES_COLLECTION);
      await addDoc(activitiesRef, {
        clienteId,
        ...activity,
      });
    } catch (error) {
      console.error('Error logging cliente activity:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Actualiza estadísticas de compra de un cliente
   */
  static async updateClienteCompra(
    clienteId: string,
    montoCompra: number,
    beneficioUsado?: boolean
  ): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      const clienteSnap = await getDoc(clienteRef);

      if (!clienteSnap.exists()) {
        throw new Error('Cliente no encontrado');
      }

      const cliente = clienteSnap.data() as Cliente;
      const nuevasTotalCompras = cliente.totalCompras + 1;
      const nuevoMontoTotal = cliente.montoTotalGastado + montoCompra;
      const nuevoPromedio = nuevoMontoTotal / nuevasTotalCompras;

      const updateData: Partial<Cliente> = {
        totalCompras: nuevasTotalCompras,
        montoTotalGastado: nuevoMontoTotal,
        promedioCompra: nuevoPromedio,
        fechaUltimaCompra: Timestamp.now(),
        actualizadoEn: Timestamp.now(),
      };

      if (beneficioUsado) {
        updateData.beneficiosUsados = cliente.beneficiosUsados + 1;
      }

      await updateDoc(clienteRef, updateData);

      // Registrar actividad
      await this.logActivity(clienteId, {
        tipo: 'compra',
        descripcion: `Compra realizada por $${montoCompra.toLocaleString()}`,
        monto: montoCompra,
        fecha: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating cliente compra:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Exporta datos de clientes
   */
  static async exportClientesData(comercioId: string): Promise<ClienteExport> {
    try {
      const { clientes } = await this.getClientesByComercio(comercioId, { limite: 1000 });
      const estadisticas = await this.getClienteStats(comercioId);
      
      // Obtener actividades de todos los clientes (limitado)
      const actividades: ClienteActivity[] = [];
      for (const cliente of clientes.slice(0, 10)) { // Limitar para evitar sobrecarga
        const clienteActivities = await this.getClienteActivities(cliente.id, 5);
        actividades.push(...clienteActivities);
      }

      return {
        clientes,
        estadisticas,
        actividades,
        fechaExportacion: Timestamp.now(),
        comercioId,
        totalRegistros: clientes.length,
      };
    } catch (error) {
      console.error('Error exporting clientes data:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Busca clientes por texto
   */
  static async searchClientes(
    comercioId: string,
    searchTerm: string,
    limite: number = 10
  ): Promise<Cliente[]> {
    try {
      const { clientes } = await this.getClientesByComercio(comercioId, {
        busqueda: searchTerm,
        limite,
      });
      return clientes;
    } catch (error) {
      console.error('Error searching clientes:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Obtiene clientes por segmento
   */
  static async getClientesBySegment(segmentId: string): Promise<Cliente[]> {
    try {
      // Obtener configuración del segmento
      const segmentRef = doc(db, this.SEGMENTS_COLLECTION, segmentId);
      const segmentSnap = await getDoc(segmentRef);

      if (!segmentSnap.exists()) {
        throw new Error('Segmento no encontrado');
      }

      const segment = segmentSnap.data() as ClienteSegment;
      
      // Aplicar criterios del segmento
      const { clientes } = await this.getClientesByComercio('', segment.criterios);
      return clientes;
    } catch (error) {
      console.error('Error getting clientes by segment:', error);
      throw new Error(handleFirebaseError(error));
    }
  }

  /**
   * Actualiza último acceso del cliente
   */
  static async updateUltimoAcceso(clienteId: string): Promise<void> {
    try {
      const clienteRef = doc(db, this.COLLECTION, clienteId);
      await updateDoc(clienteRef, {
        ultimoAcceso: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating ultimo acceso:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }
}

export const clienteService = new ClienteService();
