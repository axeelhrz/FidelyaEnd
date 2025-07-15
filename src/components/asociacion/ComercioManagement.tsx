import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Unlink,
  Mail,
  Phone,
  MapPin,
  Star,
  Check,
  X,
  AlertTriangle,
  Users,
  BarChart3,
  ArrowRight,
  Edit,
  Trash2,
  QrCode,
  FileText,
  Power,
  PowerOff,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  Percent,
  DollarSign,
  Package,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useComercios } from '@/hooks/useComercios';
import { ComercioDisponible, SolicitudAdhesion } from '@/services/adhesion.service';
import type { Comercio } from '@/services/comercio.service';
import { Beneficio } from '@/types/beneficio';
import { BeneficiosService } from '@/services/beneficios.service';
import { VincularComercioDialog } from './VincularComercioDialog';
import { CreateComercioDialog } from './CreateComercioDialog';
import { EditComercioDialog } from './EditComercioDialog';
import { QRGeneratorModal } from './QRGeneratorModal';
import { ComercioValidationsModal } from './ComercioValidationsModal';
import { ComerciosBeneficiosModal } from './ComerciosBeneficiosModal';
import { formatCurrency } from '@/lib/utils';

interface ComercioManagementProps {
  onNavigate?: (section: string) => void;
  initialFilter?: string | null;
}

interface ComercioConBeneficios extends ComercioDisponible {
  beneficios?: Beneficio[];
  loadingBeneficios?: boolean;
  showBeneficios?: boolean;
}

// Rejection Modal Component
const RejectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  solicitudNombre: string;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, solicitudNombre, loading }) => {
  const [motivo, setMotivo] = useState('');

  const handleSubmit = () => {
    if (motivo.trim()) {
      onConfirm(motivo.trim());
      setMotivo('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Rechazar Solicitud
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    ¿Estás seguro de que deseas rechazar la solicitud de{' '}
                    <strong>{solicitudNombre}</strong>?
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo del rechazo (requerido):
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Explica el motivo del rechazo..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSubmit}
              disabled={loading || !motivo.trim()}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? 'Rechazando...' : 'Rechazar'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar un beneficio individual
const BeneficioCard: React.FC<{ beneficio: Beneficio }> = ({ beneficio }) => {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje':
        return <Percent className="w-3 h-3" />;
      case 'monto_fijo':
        return <DollarSign className="w-3 h-3" />;
      case 'producto_gratis':
        return <Package className="w-3 h-3" />;
      default:
        return <Gift className="w-3 h-3" />;
    }
  };

  const formatDescuento = (beneficio: Beneficio) => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}%`;
      case 'monto_fijo':
        return formatCurrency(beneficio.descuento);
      case 'producto_gratis':
        return 'Gratis';
      default:
        return beneficio.descuento.toString();
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'agotado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
            {getTipoIcon(beneficio.tipo)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {beneficio.titulo}
            </h4>
            {beneficio.destacado && (
              <Star className="w-3 h-3 text-yellow-500 fill-current inline ml-1" />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-green-600">
            {formatDescuento(beneficio)}
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(beneficio.estado)}`}>
            {beneficio.estado}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {beneficio.descripcion}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
            {beneficio.categoria}
          </span>
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>
              {beneficio.fechaFin.toDate().toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <Users className="w-3 h-3 mr-1" />
          <span>{beneficio.usosActuales || 0} usos</span>
        </div>
      </div>
    </div>
  );
};

export const ComercioManagement: React.FC<ComercioManagementProps> = ({ 
  onNavigate, 
  initialFilter 
}) => {
  const {
    comerciosVinculados,
    solicitudesPendientes,
    stats,
    loading,
    error,
    createComercio,
    updateComercio,
    deleteComercio,
    changeComercioStatus,
    aprobarSolicitud,
    rechazarSolicitud,
    buscarComercios,
    vincularComercio,
    desvincularComercio,
    generateQRCode,
    generateBatchQRCodes,
    getComercioValidations,
    clearError
  } = useComercios();

  const [vincularDialogOpen, setVincularDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [validationsModalOpen, setValidationsModalOpen] = useState(false);
  const [beneficiosModalOpen, setBeneficiosModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedComercio, setSelectedComercio] = useState<Comercio | null>(null);
  const [selectedComercioForQR, setSelectedComercioForQR] = useState<{
    id: string;
    nombreComercio: string;
    qrCode?: string;
    qrCodeUrl?: string;
  } | null>(null);
  const [selectedComercioForBeneficios, setSelectedComercioForBeneficios] = useState<{
    id: string;
    nombreComercio: string;
  } | null>(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudAdhesion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [comercioToUnlink, setComercioToUnlink] = useState<ComercioDisponible | null>(null);
  const [comercioToDelete, setComercioToDelete] = useState<ComercioDisponible | null>(null);
  const [selectedComercios, setSelectedComercios] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'vinculados' | 'solicitudes'>('vinculados');
  
  // Nuevo estado para manejar los beneficios de cada comercio
  const [comerciosConBeneficios, setComerciossConBeneficios] = useState<ComercioConBeneficios[]>([]);

  // Apply initial filter from URL parameters
  useEffect(() => {
    if (initialFilter === 'solicitudes') {
      setCurrentView('solicitudes');
    } else {
      setCurrentView('vinculados');
    }
  }, [initialFilter]);

  // Cargar beneficios para cada comercio vinculado
  useEffect(() => {
    const cargarBeneficiosParaComercios = async () => {
      if (comerciosVinculados.length === 0) {
        setComerciossConBeneficios([]);
        return;
      }

      // Inicializar comercios con estado de carga
      const comerciosConEstado: ComercioConBeneficios[] = comerciosVinculados.map(comercio => ({
        ...comercio,
        beneficios: [],
        loadingBeneficios: true,
        showBeneficios: false
      }));
      
      setComerciossConBeneficios(comerciosConEstado);

      // Cargar beneficios para cada comercio
      for (const comercio of comerciosVinculados) {
        try {
          // CAMBIO IMPORTANTE: Usar obtenerBeneficiosPorComercio para obtener SOLO los beneficios creados por el comercio
          const beneficios = await BeneficiosService.obtenerBeneficiosPorComercio(comercio.id);
          
          setComerciossConBeneficios(prev => 
            prev.map(c => 
              c.id === comercio.id 
                ? { 
                    ...c, 
                    // Filtrar solo beneficios activos y limitar a 3 para la vista previa
                    beneficios: beneficios
                      .filter(b => b.estado === 'activo')
                      .slice(0, 3),
                    loadingBeneficios: false 
                  }
                : c
            )
          );
        } catch (error) {
          console.error(`Error cargando beneficios para comercio ${comercio.id}:`, error);
          setComerciossConBeneficios(prev => 
            prev.map(c => 
              c.id === comercio.id 
                ? { ...c, beneficios: [], loadingBeneficios: false }
                : c
            )
          );
        }
      }
    };

    cargarBeneficiosParaComercios();
  }, [comerciosVinculados]);

  // Función para alternar la visualización de beneficios
  const toggleBeneficios = (comercioId: string) => {
    setComerciossConBeneficios(prev => 
      prev.map(c => 
        c.id === comercioId 
          ? { ...c, showBeneficios: !c.showBeneficios }
          : c
      )
    );
  };

  // Filtrar comercios vinculados (ahora usando comerciosConBeneficios)
  const comerciosFiltrados = comerciosConBeneficios.filter(comercio => {
    const matchesSearch = !searchTerm || 
      comercio.nombreComercio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comercio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comercio.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = !selectedCategoria || comercio.categoria === selectedCategoria;
    const matchesEstado = !selectedEstado || comercio.estado === selectedEstado;
    
    return matchesSearch && matchesCategoria && matchesEstado;
  });

  // Filtrar solicitudes pendientes
  const solicitudesFiltradas = solicitudesPendientes.filter(solicitud => {
    const matchesSearch = !searchTerm || 
      solicitud.nombreComercio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitud.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = !selectedCategoria || solicitud.categoria === selectedCategoria;
    
    return matchesSearch && matchesCategoria;
  });

  // Obtener categorías únicas
  const categorias = Array.from(new Set([
    ...comerciosVinculados.map(c => c.categoria),
    ...solicitudesPendientes.map(r => r.categoria)
  ]));

  // Get filtered title based on current view and filters
  const getFilteredTitle = () => {
    if (currentView === 'solicitudes') {
      return 'Solicitudes Pendientes';
    } else if (selectedEstado || selectedCategoria || searchTerm) {
      return 'Comercios Filtrados';
    }
    return 'Comercios Vinculados';
  };

  // Handle request approval
  const handleApproveRequest = async (solicitudId: string) => {
    const success = await aprobarSolicitud(solicitudId);
    if (success) {
      // The hook will automatically update the data through real-time listeners
    }
  };

  // Handle request rejection
  const handleRejectRequest = (solicitud: SolicitudAdhesion) => {
    setSelectedSolicitud(solicitud);
    setRejectionModalOpen(true);
  };

  // Confirm rejection with reason
  const handleConfirmRejection = async (motivo: string) => {
    if (!selectedSolicitud) return;

    const success = await rechazarSolicitud(selectedSolicitud.id, motivo);
    if (success) {
      setRejectionModalOpen(false);
      setSelectedSolicitud(null);
    }
  };

  // Nueva función para manejar ver beneficios
  const handleViewBeneficios = (comercio: ComercioDisponible) => {
    setSelectedComercioForBeneficios({
      id: comercio.id,
      nombreComercio: comercio.nombreComercio
    });
    setBeneficiosModalOpen(true);
  };

  // Manejar desvinculación
  const handleDesvincular = async (comercio: ComercioDisponible) => {
    const success = await desvincularComercio(comercio.id);
    if (success) {
      setComercioToUnlink(null);
    }
  };

  // Manejar eliminación
  const handleDelete = async (comercio: ComercioDisponible) => {
    const success = await deleteComercio(comercio.id);
    if (success) {
      setComercioToDelete(null);
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = async (comercio: ComercioDisponible, newStatus: 'activo' | 'inactivo' | 'suspendido') => {
    await changeComercioStatus(comercio.id, newStatus);
  };

  // Manejar edición
  const handleEdit = (comercio: ComercioDisponible) => {
    // Convert ComercioDisponible to Comercio for the edit dialog
    const comercioForEdit: Comercio = {
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      categoria: comercio.categoria,
      descripcion: comercio.descripcion || '',
      direccion: comercio.direccion || '',
      telefono: comercio.telefono || '',
      email: comercio.email,
      sitioWeb: comercio.sitioWeb || '',
      horario: comercio.horario || '',
      cuit: comercio.cuit || '',
      logo: comercio.logoUrl,
      banner: comercio.imagenPrincipalUrl || '',
      estado: comercio.estado,
      visible: comercio.visible,
      asociacionesVinculadas: comercio.asociacionesVinculadas,
      qrCode: comercio.qrCode || '',
      qrCodeUrl: comercio.qrCodeUrl || '',
      beneficiosActivos: comercio.beneficiosActivos,
      validacionesRealizadas: comercio.validacionesRealizadas,
      clientesAtendidos: comercio.clientesAtendidos,
      ingresosMensuales: comercio.ingresosMensuales,
      rating: comercio.rating,
      configuracion: comercio.configuracion || {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: true,
      },
      creadoEn: comercio.creadoEn.toDate(),
      actualizadoEn: comercio.actualizadoEn?.toDate() || new Date(),
      metadata: {}
    };
    setSelectedComercio(comercioForEdit);
    setEditDialogOpen(true);
  };

  // Manejar ver validaciones
  const handleViewValidations = (comercio: ComercioDisponible) => {
    // Convert ComercioDisponible to Comercio for the validations dialog
    const comercioForValidations: Comercio = {
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      categoria: comercio.categoria,
      descripcion: comercio.descripcion || '',
      direccion: comercio.direccion || '',
      telefono: comercio.telefono || '',
      email: comercio.email,
      sitioWeb: comercio.sitioWeb || '',
      horario: comercio.horario || '',
      cuit: comercio.cuit || '',
      logo: comercio.logoUrl,
      banner: comercio.imagenPrincipalUrl || '',
      estado: comercio.estado,
      visible: comercio.visible,
      asociacionesVinculadas: comercio.asociacionesVinculadas,
      qrCode: comercio.qrCode || '',
      qrCodeUrl: comercio.qrCodeUrl || '',
      beneficiosActivos: comercio.beneficiosActivos,
      validacionesRealizadas: comercio.validacionesRealizadas,
      clientesAtendidos: comercio.clientesAtendidos,
      ingresosMensuales: comercio.ingresosMensuales,
      rating: comercio.rating,
      configuracion: comercio.configuracion || {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: true,
      },
      creadoEn: comercio.creadoEn.toDate(),
      actualizadoEn: comercio.actualizadoEn?.toDate() || new Date(),
      metadata: {}
    };
    setSelectedComercio(comercioForValidations);
    setValidationsModalOpen(true);
  };

  // Manejar generación de QR individual
  const handleGenerateQR = async (comercio: ComercioDisponible) => {
    setSelectedComercioForQR({
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      qrCode: comercio.qrCode,
      qrCodeUrl: comercio.qrCodeUrl
    });
    setQrModalOpen(true);
  };

  // Función para generar QR desde el modal
  const handleGenerateQRFromModal = async (comercioId: string) => {
    const result = await generateQRCode(comercioId);
    if (typeof result === 'string') {
      // If generateQRCode returns a string, wrap it in the expected object
      return { qrCode: result, qrCodeUrl: result };
    }
    // If generateQRCode already returns the correct object, just return it
    return result;
  };

  // Manejar generación de QR masiva
  const handleBatchQRGeneration = async () => {
    if (selectedComercios.length === 0) {
      alert('Selecciona al menos un comercio');
      return;
    }

    const results = await generateBatchQRCodes(selectedComercios);
    
    if (results.length > 0) {
      // Create a ZIP file with all QR codes
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      results.forEach(result => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob(blob => {
            if (blob) {
              zip.file(`QR_${result.nombreComercio}.png`, blob);
            }
          });
        };
        
        img.src = result.qrCodeDataURL;
      });

      // Generate and download ZIP
      setTimeout(async () => {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
      }, 1000);
    }
  };

  // Manejar selección múltiple
  const handleSelectComercio = (comercioId: string, selected: boolean) => {
    if (selected) {
      setSelectedComercios(prev => [...prev, comercioId]);
    } else {
      setSelectedComercios(prev => prev.filter(id => id !== comercioId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (currentView === 'vinculados') {
      if (selected) {
        setSelectedComercios(comerciosFiltrados.map(c => c.id));
      } else {
        setSelectedComercios([]);
      }
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Power className="w-4 h-4 text-green-600" />;
      case 'inactivo':
        return <PowerOff className="w-4 h-4 text-red-600" />;
      case 'suspendido':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      default:
        return <Power className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      case 'suspendido':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render pending requests view
  const renderPendingRequests = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando solicitudes...</span>
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay solicitudes pendientes
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Todas las solicitudes han sido procesadas.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {solicitudesFiltradas.map((solicitud) => (
            <motion.div
              key={solicitud.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {solicitud.nombreComercio}
                      </h3>
                      <p className="text-sm text-gray-600">{solicitud.nombre}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendiente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {solicitud.email}
                      </div>
                      {solicitud.telefono && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {solicitud.telefono}
                        </div>
                      )}
                      {solicitud.direccion && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {solicitud.direccion}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Categoría:</span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {solicitud.categoria}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Fecha de solicitud:</span>
                        <span className="ml-2 text-gray-600">
                          {solicitud.fechaSolicitud.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Documentos:</span>
                        <span className="ml-2 text-gray-600">
                          {solicitud.documentos.length} archivo(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mensaje:</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {solicitud.mensaje}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApproveRequest(solicitud.id)}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRejectRequest(solicitud)}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </button>
                    <button className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Documentos
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con navegación rápida */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getFilteredTitle()}</h1>
          <p className="text-gray-600 mt-2">
            {currentView === 'solicitudes' 
              ? 'Revisa y gestiona las solicitudes de vinculación pendientes'
              : 'Administra los comercios vinculados a tu asociación'
            }
          </p>
          {currentView === 'vinculados' && comerciosFiltrados.length !== comerciosVinculados.length && (
            <p className="text-sm text-blue-600 mt-1">
              Mostrando {comerciosFiltrados.length} de {comerciosVinculados.length} comercios
            </p>
          )}
          {currentView === 'solicitudes' && (
            <p className="text-sm text-orange-600 mt-1">
              {solicitudesFiltradas.length} solicitudes pendientes de revisión
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Botón de navegación rápida a socios */}
          {onNavigate && (
            <button
              onClick={() => onNavigate('socios')}
              className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Ir a Socios
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
          
          {currentView === 'vinculados' && (
            <>
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Comercio
              </button>

              <button
                onClick={() => setVincularDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
              >
                <Store className="w-4 h-4 mr-2" />
                Vincular Existente
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Comercios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComercios}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comercios Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.comerciosActivos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.solicitudesPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.categorias).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={currentView === 'solicitudes' ? "Buscar solicitudes..." : "Buscar comercios..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions and View Mode */}
          <div className="flex items-center space-x-3">
            {currentView === 'vinculados' && selectedComercios.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedComercios.length} seleccionados
                </span>
                <button
                  onClick={handleBatchQRGeneration}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generar QRs
                </button>
              </div>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>

            {currentView === 'vinculados' && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Store size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                {currentView === 'vinculados' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={selectedEstado}
                      onChange={(e) => setSelectedEstado(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Todos los estados</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                )}

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoria('');
                      setSelectedEstado('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Content based on current view */}
      {currentView === 'solicitudes' ? (
        renderPendingRequests()
      ) : (
        /* Comercios Vinculados List */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando comercios...</span>
            </div>
          ) : comerciosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {comerciosVinculados.length === 0 ? 'No hay comercios vinculados' : 'No se encontraron comercios'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {comerciosVinculados.length === 0 
                  ? 'Comienza agregando tu primer comercio.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
              {comerciosVinculados.length === 0 && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Comercio
                  </button>
                  <div>
                    <button
                      onClick={() => setVincularDialogOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Vincular Comercio Existente
                    </button>
                  </div>
                  {onNavigate && (
                    <div>
                      <button
                        onClick={() => onNavigate('socios')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Ver Gestión de Socios
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6">
              {/* Select All Checkbox */}
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedComercios.length === comerciosFiltrados.length && comerciosFiltrados.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Seleccionar todos ({comerciosFiltrados.length})
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comerciosFiltrados.map((comercio) => (
                  <motion.div
                    key={comercio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedComercios.includes(comercio.id)}
                          onChange={(e) => handleSelectComercio(comercio.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {comercio.logoUrl ? (
                            <Image
                              src={comercio.logoUrl}
                              alt={comercio.nombreComercio}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <Store className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {comercio.nombreComercio}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{comercio.nombre}</p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(comercio.estado)}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comercio.estado)}`}>
                          {comercio.estado}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {comercio.categoria}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{comercio.email}</span>
                      </div>
                      {comercio.telefono && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {comercio.telefono}
                        </div>
                      )}
                      
                      {comercio.direccion && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="truncate">{comercio.direccion}</span>
                        </div>
                      )}
                      
                      {comercio.puntuacion > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                          {comercio.puntuacion.toFixed(1)} ({comercio.totalReviews} reseñas)
                        </div>
                      )}

                      {/* Sección de beneficios */}
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-sm text-gray-700">
                            <Gift className="w-4 h-4 mr-2 text-purple-500" />
                            <span className="font-medium">Beneficios</span>
                            <span className="ml-1 text-gray-500">
                              ({comercio.beneficiosActivos || 0})
                            </span>
                          </div>
                          {comercio.beneficios && comercio.beneficios.length > 0 && (
                            <button
                              onClick={() => toggleBeneficios(comercio.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              {comercio.showBeneficios ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Ver
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {comercio.loadingBeneficios ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="ml-2 text-xs text-gray-500">Cargando beneficios...</span>
                          </div>
                        ) : comercio.beneficios && comercio.beneficios.length > 0 ? (
                          <AnimatePresence>
                            {comercio.showBeneficios && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                {comercio.beneficios.map((beneficio) => (
                                  <BeneficioCard key={beneficio.id} beneficio={beneficio} />
                                ))}
                                {comercio.beneficiosActivos > 3 && (
                                  <button
                                    onClick={() => handleViewBeneficios(comercio)}
                                    className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                  >
                                    Ver todos los beneficios ({comercio.beneficiosActivos})
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        ) : (
                          <div className="text-center py-3">
                            <Gift className="mx-auto h-6 w-6 text-gray-300" />
                            <p className="text-xs text-gray-500 mt-1">Sin beneficios activos</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center">
                          {comercio.verificado && (
                            <div className="flex items-center text-green-600">
                              <Check className="w-4 h-4 mr-1" />
                              <span className="text-xs">Verificado</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewBeneficios(comercio)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver todos los beneficios"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleViewValidations(comercio)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver validaciones"
                          >
                            <FileText size={16} />
                          </button>

                          <button
                            onClick={() => handleGenerateQR(comercio)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Generar QR"
                          >
                            <QrCode size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(comercio)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>

                          {comercio.estado === 'activo' ? (
                            <button
                              onClick={() => handleStatusChange(comercio, 'inactivo')}
                              className="text-red-600 hover:text-red-900"
                              title="Desactivar"
                            >
                              <PowerOff size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(comercio, 'activo')}
                              className="text-green-600 hover:text-green-900"
                              title="Activar"
                            >
                              <Power size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setComercioToUnlink(comercio)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Desvincular"
                          >
                            <Unlink size={16} />
                          </button>

                          <button
                            onClick={() => setComercioToDelete(comercio)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedComercios.length === comerciosFiltrados.length && comerciosFiltrados.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comercio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beneficios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntuación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comerciosFiltrados.map((comercio) => (
                    <motion.tr
                      key={comercio.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedComercios.includes(comercio.id)}
                          onChange={(e) => handleSelectComercio(comercio.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {comercio.logoUrl ? (
                            <Image
                              src={comercio.logoUrl}
                              alt={comercio.nombreComercio}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded object-cover"
                            />
                          ) : (
                            <Store className="w-5 h-5 text-gray-400" />
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {comercio.nombreComercio}
                            </div>
                            <div className="text-sm text-gray-500">{comercio.nombre}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {comercio.categoria}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{comercio.email}</div>
                        <div className="text-sm text-gray-500">{comercio.telefono || 'Sin teléfono'}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comercio.estado)}`}>
                            {comercio.estado}
                          </span>
                          {comercio.verificado && (
                            <Check className="w-4 h-4 text-green-600 ml-2" />
                          )}
                        </div>
                      </td>

                      {/* Nueva columna para beneficios en vista de lista */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Gift className="w-4 h-4 text-purple-500 mr-1" />
                              <span className="text-sm text-gray-900">
                                {comercio.beneficiosActivos || 0}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">activos</span>
                            </div>
                            {comercio.beneficios && comercio.beneficios.length > 0 && (
                              <button
                                onClick={() => toggleBeneficios(comercio.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                {comercio.showBeneficios ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          
                          {comercio.loadingBeneficios ? (
                            <div className="flex items-center py-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                              <span className="ml-2 text-xs text-gray-500">Cargando...</span>
                            </div>
                          ) : comercio.beneficios && comercio.beneficios.length > 0 ? (
                            <AnimatePresence>
                              {comercio.showBeneficios && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-1"
                                >
                                  {comercio.beneficios.slice(0, 2).map((beneficio) => (
                                    <div key={beneficio.id} className="text-xs bg-gray-50 p-2 rounded">
                                      <div className="font-medium text-gray-900 truncate">
                                        {beneficio.titulo}
                                      </div>
                                      <div className="text-green-600 font-bold">
                                        {beneficio.tipo === 'porcentaje' ? `${beneficio.descuento}%` :
                                         beneficio.tipo === 'monto_fijo' ? formatCurrency(beneficio.descuento) :
                                         'Gratis'}
                                      </div>
                                    </div>
                                  ))}
                                  {comercio.beneficiosActivos > 2 && (
                                    <button
                                      onClick={() => handleViewBeneficios(comercio)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      +{comercio.beneficiosActivos - 2} más
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          ) : (
                            <span className="text-xs text-gray-400">Sin beneficios</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comercio.puntuacion > 0 ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm text-gray-900">
                              {comercio.puntuacion.toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              ({comercio.totalReviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin calificar</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewBeneficios(comercio)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver todos los beneficios"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleViewValidations(comercio)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver validaciones"
                          >
                            <FileText size={16} />
                          </button>

                          <button
                            onClick={() => handleGenerateQR(comercio)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Generar QR"
                          >
                            <QrCode size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(comercio)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>

                          {comercio.estado === 'activo' ? (
                            <button
                              onClick={() => handleStatusChange(comercio, 'inactivo')}
                              className="text-red-600 hover:text-red-900"
                              title="Desactivar"
                            >
                              <PowerOff size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(comercio, 'activo')}
                              className="text-green-600 hover:text-green-900"
                              title="Activar"
                            >
                              <Power size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => setComercioToUnlink(comercio)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Desvincular"
                          >
                            <Unlink size={16} />
                          </button>

                          <button
                            onClick={() => setComercioToDelete(comercio)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateComercioDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={createComercio}
        loading={loading}
      />

      <VincularComercioDialog
        open={vincularDialogOpen}
        onClose={() => setVincularDialogOpen(false)}
        onVincular={vincularComercio}
        onBuscar={buscarComercios}
        loading={loading}
      />

      <EditComercioDialog
        open={editDialogOpen}
        comercio={selectedComercio}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedComercio(null);
        }}
        onSubmit={updateComercio}
        loading={loading}
      />

      <QRGeneratorModal
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedComercioForQR(null);
        }}
        comercio={selectedComercioForQR}
        onGenerateQR={handleGenerateQRFromModal}
        loading={loading}
      />

      <ComercioValidationsModal
        open={validationsModalOpen}
        onClose={() => {
          setValidationsModalOpen(false);
          setSelectedComercio(null);
        }}
        comercio={selectedComercio ? {
          id: selectedComercio.id,
          nombreComercio: selectedComercio.nombreComercio
        } : null}
        onLoadValidations={async (comercioId, filters?, limit?) => {
          try {
            const adaptedFilters: Record<string, unknown> = {};
            if (filters?.fechaInicio) adaptedFilters.fechaDesde = filters.fechaInicio;
            if (filters?.fechaFin) adaptedFilters.fechaHasta = filters.fechaFin;
            if (filters?.estado) adaptedFilters.estado = filters.estado;
            if (filters?.socio) adaptedFilters.beneficioId = filters.socio;
            
            const result = await getComercioValidations(comercioId, adaptedFilters, limit);

            const validaciones = result.validaciones.map((validationData) => ({
              id: validationData.id,
              socioNombre: validationData.socioNombre,
              socioEmail: '',
              beneficioTitulo: validationData.beneficioTitulo,
              beneficioDescripcion: '',
              tipoDescuento: 'monto_fijo' as const,
              descuento: validationData.montoDescuento,
              montoOriginal: validationData.montoDescuento,
              montoFinal: 0,
              estado: validationData.estado,
              fechaValidacion: validationData.fechaValidacion,
              metodoPago: validationData.metodoPago,
              notas: validationData.notas,
            }));

            return {
              validaciones,
              total: validaciones.length,
              stats: {
                totalValidaciones: validaciones.length,
                exitosas: validaciones.filter(v => v.estado === 'exitosa').length,
                fallidas: validaciones.filter(v => v.estado === 'fallida').length,
                montoTotal: validaciones.reduce((sum, v) => sum + (v.descuento || 0), 0),
                ahorroTotal: validaciones.reduce((sum, v) => sum + (v.descuento || 0), 0),
              }
            };
          } catch (error) {
            console.error('Error loading validations:', error);
            return {
              validaciones: [],
              total: 0,
              stats: {
                totalValidaciones: 0,
                exitosas: 0,
                fallidas: 0,
                montoTotal: 0,
                ahorroTotal: 0,
              }
            };
          }
        }}
        loading={loading}
      />

      <ComerciosBeneficiosModal
        isOpen={beneficiosModalOpen}
        onClose={() => {
          setBeneficiosModalOpen(false);
          setSelectedComercioForBeneficios(null);
        }}
        comercio={selectedComercioForBeneficios}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => {
          setRejectionModalOpen(false);
          setSelectedSolicitud(null);
        }}
        onConfirm={handleConfirmRejection}
        solicitudNombre={selectedSolicitud?.nombreComercio || ''}
        loading={loading}
      />

      {/* Unlink Confirmation Dialog */}
      {comercioToUnlink && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Unlink className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Desvincular Comercio
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas desvincular a{' '}
                        <strong>{comercioToUnlink.nombreComercio}</strong> de tu asociación?
                        El comercio seguirá existiendo pero ya no estará vinculado a tu asociación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDesvincular(comercioToUnlink)}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Desvinculando...' : 'Desvincular'}
                </button>
                <button
                  onClick={() => setComercioToUnlink(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {comercioToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar Comercio
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar a{' '}
                        <strong>{comercioToDelete.nombreComercio}</strong>?
                        Esta acción desactivará el comercio permanentemente. Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleDelete(comercioToDelete)}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setComercioToDelete(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};