import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ComercioFormData } from '@/services/comercio.service';

interface CreateComercioDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ComercioFormData) => Promise<boolean>;
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

export const CreateComercioDialog: React.FC<CreateComercioDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<ComercioFormData>({
    nombreComercio: '',
    categoria: '',
    email: '',
    telefono: '',
    direccion: '',
    descripcion: '',
    sitioWeb: '',
    horario: '',
    cuit: '',
    configuracion: {
      notificacionesEmail: true,
      notificacionesWhatsApp: false,
      autoValidacion: false,
      requiereAprobacion: true,
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleClose = useCallback(() => {
    setFormData({
      nombreComercio: '',
      categoria: '',
      email: '',
      telefono: '',
      direccion: '',
      descripcion: '',
      sitioWeb: '',
      horario: '',
      cuit: '',
      configuracion: {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: true,
      }
    });
    setErrors({});
    setCurrentStep(1);
    onClose();
  }, [onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [open, handleClose]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.nombreComercio.trim()) {
        newErrors.nombreComercio = 'El nombre del comercio es obligatorio';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
      if (!formData.categoria) {
        newErrors.categoria = 'La categoría es obligatoria';
      }
    }

    if (step === 2) {
      if (formData.telefono && !/^\+?[\d\s\-\(\)]+$/.test(formData.telefono)) {
        newErrors.telefono = 'El teléfono no es válido';
      }
      if (formData.sitioWeb && !/^https?:\/\/.+/.test(formData.sitioWeb)) {
        newErrors.sitioWeb = 'El sitio web debe comenzar con http:// o https://';
      }
      if (formData.cuit && !/^\d{2}-\d{8}-\d{1}$/.test(formData.cuit)) {
        newErrors.cuit = 'El CUIT debe tener el formato XX-XXXXXXXX-X';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      handleClose();
    }
  };

  const handleInputChange = (field: keyof ComercioFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Modal positioning helper */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Agregar Nuevo Comercio
                    </h3>
                    <p className="text-green-100 text-sm">
                      Paso {currentStep} de 3
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-green-100 transition-colors p-2 rounded-lg hover:bg-white/10"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex-1">
                      <motion.div 
                        className={`h-2 rounded-full transition-colors ${
                          step <= currentStep ? 'bg-white' : 'bg-white/30'
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: step <= currentStep ? 1 : 0.3 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 1: Información Básica */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
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
                          value={formData.nombreComercio}
                          onChange={(e) => handleInputChange('nombreComercio', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.nombreComercio ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Ej: Supermercado Central"
                          autoFocus
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
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
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
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                          placeholder="Describe brevemente el comercio y sus servicios..."
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Información de Contacto */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Información de Contacto
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={formData.telefono || ''}
                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
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
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          placeholder="Av. Corrientes 1234, CABA"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4 inline mr-2" />
                            Sitio Web
                          </label>
                          <input
                            type="url"
                            value={formData.sitioWeb || ''}
                            onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            placeholder="Lun-Vie 9:00-18:00"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Configuración */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Configuración Inicial
                        </h4>
                        <p className="text-gray-600 text-sm mb-6">
                          Estas configuraciones se pueden cambiar más tarde desde el panel del comercio.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">Notificaciones por Email</h5>
                            <p className="text-sm text-gray-600">Recibir notificaciones de validaciones por email</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.configuracion?.notificacionesEmail || false}
                              onChange={(e) => handleConfigChange('notificacionesEmail', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">Notificaciones por WhatsApp</h5>
                            <p className="text-sm text-gray-600">Recibir notificaciones de validaciones por WhatsApp</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.configuracion?.notificacionesWhatsApp || false}
                              onChange={(e) => handleConfigChange('notificacionesWhatsApp', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">Auto-validación</h5>
                            <p className="text-sm text-gray-600">Validar automáticamente los beneficios sin confirmación manual</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.configuracion?.autoValidacion || false}
                              onChange={(e) => handleConfigChange('autoValidacion', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">Requiere Aprobación</h5>
                            <p className="text-sm text-gray-600">Los beneficios requieren aprobación antes de ser publicados</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.configuracion?.requiereAprobacion || false}
                              onChange={(e) => handleConfigChange('requiereAprobacion', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Resumen del Comercio
                        </h5>
                        <div className="text-sm text-green-800 space-y-1">
                          <p><strong>Nombre:</strong> {formData.nombreComercio}</p>
                          <p><strong>Email:</strong> {formData.email}</p>
                          <p><strong>Categoría:</strong> {formData.categoria}</p>
                          {formData.telefono && <p><strong>Teléfono:</strong> {formData.telefono}</p>}
                          {formData.direccion && <p><strong>Dirección:</strong> {formData.direccion}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Anterior
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Crear Comercio
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};