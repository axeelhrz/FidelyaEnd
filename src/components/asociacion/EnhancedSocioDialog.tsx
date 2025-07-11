import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Hash,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { Socio, SocioFormData } from '@/types/socio';

// Create a form-specific interface that matches the Zod schema
interface SocioFormInputs {
  nombre: string;
  email: string;
  dni: string;
  telefono?: string;
  fechaNacimiento: Date;
  direccion?: string;
  numeroSocio?: string;
  montoCuota: number;
  fechaVencimiento?: Date;
}

const socioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  dni: z.string().min(7, 'DNI debe tener al menos 7 caracteres'),
  telefono: z.string().optional(),
  fechaNacimiento: z.date({
    required_error: 'Fecha de nacimiento es requerida',
  }),
  direccion: z.string().optional(),
  numeroSocio: z.string().optional(),
  montoCuota: z.number().min(0, 'La cuota debe ser mayor a 0'),
  fechaVencimiento: z.date().optional(),
});

interface EnhancedSocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SocioFormData) => Promise<void>;
  socio?: Socio | null;
  loading?: boolean;
}

export const EnhancedSocioDialog: React.FC<EnhancedSocioDialogProps> = ({
  open,
  onClose,
  onSave,
  socio,
  loading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!socio;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SocioFormInputs>({
    resolver: zodResolver(socioSchema),
    defaultValues: {
      montoCuota: 0,
    }
  });

  // Helper function to convert Timestamp to Date
  const timestampToDate = (timestamp: Date | Timestamp | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return undefined;
  };

  // Reset form when dialog opens/closes or socio changes
  useEffect(() => {
    if (open) {
      if (socio) {
        // Populate form with existing socio data
        reset({
          nombre: socio.nombre,
          email: socio.email,
          dni: socio.dni,
          telefono: socio.telefono || '',
          fechaNacimiento: timestampToDate(socio.fechaNacimiento) || new Date(),
          direccion: socio.direccion || '',
          numeroSocio: socio.numeroSocio || '',
          montoCuota: socio.montoCuota,
          fechaVencimiento: timestampToDate(socio.fechaVencimiento),
        });
      } else {
        // Reset form for new socio
        reset({
          nombre: '',
          email: '',
          dni: '',
          telefono: '',
          fechaNacimiento: new Date(),
          direccion: '',
          numeroSocio: '',
          montoCuota: 0,
          fechaVencimiento: undefined,
        });
      }
    }
  }, [open, socio, reset]);

  const handleFormSubmit = async (data: SocioFormInputs) => {
    try {
      setIsSubmitting(true);
      
      // Convert form data to SocioFormData format
      const socioFormData: SocioFormData = {
        nombre: data.nombre,
        email: data.email,
        dni: data.dni,
        telefono: data.telefono,
        fechaNacimiento: data.fechaNacimiento,
        direccion: data.direccion,
        numeroSocio: data.numeroSocio,
        montoCuota: data.montoCuota,
        fechaVencimiento: data.fechaVencimiento,
        estado: 'activo', // Default state for new socios
      };
      
      await onSave(socioFormData);
    } catch (error) {
      console.error('Error saving socio:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        >
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {isEditing ? 'Modifica los datos del socio' : 'Completa la información del nuevo socio'}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting || loading}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Información Personal
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('nombre')}
                          type="text"
                          placeholder="Nombre completo del socio"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.nombre ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.nombre && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.nombre.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="email@ejemplo.com"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* DNI */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DNI *
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('dni')}
                          type="text"
                          placeholder="12345678"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.dni ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.dni && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.dni.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('telefono')}
                          type="tel"
                          placeholder="+54 9 11 1234-5678"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.telefono ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.telefono && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.telefono.message}
                        </p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('fechaNacimiento', {
                            valueAsDate: true,
                          })}
                          type="date"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.fechaNacimiento ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.fechaNacimiento && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.fechaNacimiento.message}
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          {...register('direccion')}
                          rows={2}
                          placeholder="Dirección completa"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                            errors.direccion ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.direccion && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.direccion.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Membership Information Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                    Información de Membresía
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Member Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Socio
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('numeroSocio')}
                          type="text"
                          placeholder="Auto-generado"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.numeroSocio ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.numeroSocio && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.numeroSocio.message}
                        </p>
                      )}
                    </div>

                    {/* Monthly Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cuota Mensual *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                        <input
                          {...register('montoCuota', {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.montoCuota ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.montoCuota && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.montoCuota.message}
                        </p>
                      )}
                    </div>

                    {/* Expiration Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Vencimiento
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('fechaVencimiento', {
                            valueAsDate: true,
                          })}
                          type="date"
                          disabled={isSubmitting || loading}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            errors.fechaVencimiento ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.fechaVencimiento && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.fechaVencimiento.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditing ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Actualizar Socio' : 'Crear Socio'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};