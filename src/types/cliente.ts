import { Timestamp } from 'firebase/firestore';

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: Timestamp;
  avatar?: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  comercioId: string;
  asociacionId?: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  ultimoAcceso?: Timestamp;
  
  // Estadísticas del cliente
  totalCompras: number;
  montoTotalGastado: number;
  beneficiosUsados: number;
  ahorroTotal: number;
  frecuenciaVisitas: number;
  
  // Preferencias
  categoriasFavoritas: string[];
  metodoPagoPreferido?: string;
  horarioPreferido?: string;
  
  // Información adicional
  notas?: string;
  tags?: string[];
  fechaUltimaCompra?: Timestamp;
  promedioCompra: number;
  
  // Configuración de comunicación
  configuracion: {
    recibirNotificaciones: boolean;
    recibirPromociones: boolean;
    recibirEmail: boolean;
    recibirSMS: boolean;
  };
}

export interface ClienteFormData {
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: string;
  notas?: string;
  tags?: string[];
  configuracion: {
    recibirNotificaciones: boolean;
    recibirPromociones: boolean;
    recibirEmail: boolean;
    recibirSMS: boolean;
  };
}

export interface ClienteStats {
  totalClientes: number;
  clientesActivos: number;
  clientesNuevos: number;
  clientesInactivos: number;
  promedioComprasPorCliente: number;
  montoPromedioCompra: number;
  clientesMasActivos: Cliente[];
  crecimientoMensual: number;
  retencionClientes: number;
  valorVidaPromedio: number;
}

export interface ClienteActivity {
  id: string;
  clienteId: string;
  tipo: 'compra' | 'beneficio' | 'visita' | 'registro' | 'actualizacion';
  descripcion: string;
  monto?: number;
  beneficioId?: string;
  fecha: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface ClienteFilter {
  estado?: 'activo' | 'inactivo' | 'suspendido';
  fechaDesde?: Date;
  fechaHasta?: Date;
  montoMinimo?: number;
  montoMaximo?: number;
  categorias?: string[];
  tags?: string[];
  busqueda?: string;
  ordenarPor?: 'nombre' | 'fechaCreacion' | 'ultimaCompra' | 'totalGastado';
  orden?: 'asc' | 'desc';
  limite?: number;
  offset?: number;
}

export interface ClienteSegment {
  id: string;
  nombre: string;
  descripcion: string;
  criterios: ClienteFilter;
  clientesCount: number;
  valorTotal: number;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface ClienteExport {
  clientes: Cliente[];
  estadisticas: ClienteStats;
  actividades: ClienteActivity[];
  fechaExportacion: Timestamp;
  comercioId: string;
  totalRegistros: number;
}
