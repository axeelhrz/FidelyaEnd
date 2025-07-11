import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  FileText,
  Building,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Comercio, ComercioFormData } from '@/services/comercio.service';

interface EditComercioDialogProps {
  open: boolean;
  comercio: Comercio | null;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<ComercioFormData>) => Promise<boolean>;
  loading?: boolean;
}

const CATEGORIAS_COMERCIO = [
  'Alimentación',
  'Librería y Papelería',
  'Farmacia y Salud',
  'Restaurantes y Gastronomía',
  'Retail y Moda',
  'Salud y Belleza',
  'Deportes y Fitness',
  'Tecnología',
  'Hogar y Decoración',
  'Automotriz',
  'Educación',
  'Entretenimiento',
  'Servicios Profesionales',
  'Turismo y Viajes',
  'Otros'
];

// Define the configuration type explicitly
type ConfiguracionKeys = 'notificacionesEmail' | 'notificacionesWhatsApp' | 'autoValidacion' | 'requiereAprobacion';

export const EditComercioDialog: React.FC<EditComercioDialogProps> = ({
  open,
  comercio,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<Partial<ComercioFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (comercio) {
      setFormData({
        nombreComercio: comercio.nombreComercio,
        categoria: comercio.categoria,
        email: comercio.email,
        telefono: comercio.telefono || '',
        direccion: comercio.direccion || '',
        descripcion: comercio.descripcion || '',
        sitioWeb: comercio.sitioWeb || '',
        horario: comercio.horario || '',
        cuit: comercio.cuit || '',
        configuracion: comercio.configuracion
      });
      setHasChanges(false);
    }
  }, [comercio]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreComercio?.trim()) {
      newErrors.nombreComercio = 'El nombre del comercio es obligatorio';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es obligatoria';
    }
    if (formData.telefono && !/^\+?[\d\s\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }
    if (formData.sitioWeb && !/^https?:\/\/.+/.test(formData.sitioWeb)) {
      newErrors.sitioWeb = 'El sitio web debe comenzar con http:// o https://';
    }
    if (formData.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit)) {
      newErrors.cuit = 'El CUIT debe tener el formato XX-XXXXXXXX-X';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comercio || !validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    const success = await onSubmit(comercio.id, formData);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    setHasChanges(false);
    onClose();
  };

  const handleInputChange = (field: keyof ComercioFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleConfigChange = (field: ConfiguracionKeys, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      configuracion: {
        notificacionesEmail: false,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: false,
        ...prev.configuracion,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  if (!open || !comercio) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Editar Comercio
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {comercio.nombreComercio}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Información Básica */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Información Básica
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Store className="w-4 h-4 inline mr-2" />
                      Nombre del Comercio *
                    </label>
                    <input
                      type="text"
                      value={formData.nombreComercio || ''}
                      onChange={(e) => handleInputChange('nombreComercio', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.nombreComercio ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Supermercado Central"
                    />
                    {errors.nombreComercio && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.nombreComercio}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="comercio@ejemplo.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={formData.categoria || ''}
                      onChange={(e) => handleInputChange('categoria', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.categoria ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecciona una categoría</option>
                      {CATEGORIAS_COMERCIO.map(categoria => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                    {errors.categoria && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.categoria}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion || ''}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Describe brevemente el comercio y sus servicios..."
                    />
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Información de Contacto
                    </h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono || ''}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.telefono ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+54 11 1234-5678"
                    />
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.telefono}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      CUIT
                    </label>
                    <input
                      type="text"
                      value={formData.cuit || ''}
                      onChange={(e) => handleInputChange('cuit', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.cuit ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="XX-XXXXXXXX-X"
                    />
                    {errors.cuit && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.cuit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion || ''}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Av. Corrientes 1234, CABA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.sitioWeb || ''}
                      onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.sitioWeb ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://www.ejemplo.com"
                    />
                    {errors.sitioWeb && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.sitioWeb}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Horario de Atención
                    </label>
                    <input
                      type="text"
                      value={formData.horario || ''}
                      onChange={(e) => handleInputChange('horario', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Lun-Vie 9:00-18:00"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Notificaciones por Email</h5>
                      <p className="text-sm text-gray-600">Recibir notificaciones por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.configuracion?.notificacionesEmail || false}
                        onChange={(e) => handleConfigChange('notificacionesEmail', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Notificaciones por WhatsApp</h5>
                      <p className="text-sm text-gray-600">Recibir notificaciones por WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.configuracion?.notificacionesWhatsApp || false}
                        onChange={(e) => handleConfigChange('notificacionesWhatsApp', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Auto-validación</h5>
                      <p className="text-sm text-gray-600">Validar automáticamente los beneficios</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.configuracion?.autoValidacion || false}
                        onChange={(e) => handleConfigChange('autoValidacion', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Requiere Aprobación</h5>
                      <p className="text-sm text-gray-600">Los beneficios requieren aprobación</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.configuracion?.requiereAprobacion || false}
                        onChange={(e) => handleConfigChange('requiereAprobacion', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {hasChanges && (
                  <span className="text-orange-600">
                    • Tienes cambios sin guardar
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading || !hasChanges}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};