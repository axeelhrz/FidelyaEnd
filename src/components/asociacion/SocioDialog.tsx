'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Person,
  Email,
  Phone,
  Close,
  Save,
  PersonAdd,
  Badge,
  Security,
  CalendarToday,
  AttachMoney,
  Numbers,
} from '@mui/icons-material';
import { socioSchema } from '@/lib/validations/socio';
import { z } from 'zod';
import { Socio } from '@/types/socio';

type SocioFormData = z.infer<typeof socioSchema>;

interface SocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SocioFormData) => Promise<void>;
  socio?: Socio | null;
}

export const SocioDialog: React.FC<SocioDialogProps> = ({
  open,
  onClose,
  onSave,
  socio,
}) => {
  const isEditing = !!socio;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SocioFormData>({
    resolver: zodResolver(socioSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      email: '',
      estado: 'activo',
      telefono: '',
      dni: '',
      montoCuota: 0,
      numeroSocio: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (socio) {
        // Convert Timestamp to Date if needed
        function toDateOrUndefined(value: unknown): Date | undefined {
          if (!value) return undefined;
          if (value instanceof Date) return value;
          if (typeof value === 'object' && value !== null && typeof (value as { toDate?: () => Date }).toDate === 'function') {
            return (value as { toDate: () => Date }).toDate();
          }
          if (typeof value === 'string' || typeof value === 'number') {
            const d = new Date(value);
            return isNaN(d.getTime()) ? undefined : d;
          }
          return undefined;
        }
        
        const fechaNacimiento = toDateOrUndefined(socio.fechaNacimiento) ?? new Date();
        const fechaVencimiento = toDateOrUndefined(socio.fechaVencimiento);
        
        reset({
          nombre: socio.nombre,
          email: socio.email,
          estado: socio.estado === 'activo' || socio.estado === 'vencido' || socio.estado === 'inactivo' || socio.estado === 'suspendido' || socio.estado === 'pendiente' 
            ? socio.estado 
            : 'activo',
          telefono: socio.telefono || '',
          dni: socio.dni || '',
          fechaNacimiento,
          montoCuota: socio.montoCuota || 0,
          numeroSocio: socio.numeroSocio || '',
          fechaVencimiento,
        });
      } else {
        reset({
          nombre: '',
          email: '',
          estado: 'activo',
          telefono: '',
          dni: '',
          fechaNacimiento: new Date(),
          montoCuota: 0,
          numeroSocio: '',
          fechaVencimiento: undefined,
        });
      }
    }
  }, [open, socio, reset]);

  const onSubmit = async (data: SocioFormData) => {
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving socio:', error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Dialog */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  {isEditing ? <Person className="w-6 h-6 text-white" /> : <PersonAdd className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {isEditing ? 'Actualiza la información del socio' : 'Completa los datos del nuevo socio'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <Close className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Person className="w-5 h-5 mr-2 text-blue-600" />
                Información Personal
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <Person className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('nombre')}
                      type="text"
                      placeholder="Ingresa el nombre completo del socio"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI / Documento
                  </label>
                  <div className="relative">
                    <Badge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('dni')}
                      type="text"
                      placeholder="Número de documento"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.dni ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.dni && (
                    <p className="mt-1 text-sm text-red-600">{errors.dni.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del socio *
                  </label>
                  <div className="relative">
                    <Security className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      {...register('estado')}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.estado ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </div>
                  {errors.estado && (
                    <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de nacimiento
                  </label>
                  <div className="relative">
                    <CalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('fechaNacimiento', {
                        valueAsDate: true,
                      })}
                      type="date"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.fechaNacimiento ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.fechaNacimiento && (
                    <p className="mt-1 text-sm text-red-600">{errors.fechaNacimiento.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de socio
                  </label>
                  <div className="relative">
                    <Numbers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('numeroSocio')}
                      type="text"
                      placeholder="Auto-generado si se deja vacío"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.numeroSocio ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.numeroSocio && (
                    <p className="mt-1 text-sm text-red-600">{errors.numeroSocio.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Email className="w-5 h-5 mr-2 text-green-600" />
                Información de Contacto
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Email className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="socio@email.com"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('telefono')}
                      type="text"
                      placeholder="Número de teléfono con código de área"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.telefono ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <AttachMoney className="w-5 h-5 mr-2 text-purple-600" />
                Información de Membresía
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuota mensual
                  </label>
                  <div className="relative">
                    <AttachMoney className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('montoCuota', {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.montoCuota ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.montoCuota && (
                    <p className="mt-1 text-sm text-red-600">{errors.montoCuota.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de vencimiento
                  </label>
                  <div className="relative">
                    <CalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('fechaVencimiento', {
                        valueAsDate: true,
                      })}
                      type="date"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.fechaVencimiento ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.fechaVencimiento && (
                    <p className="mt-1 text-sm text-red-600">{errors.fechaVencimiento.message}</p>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isValid}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Actualizar' : 'Crear'} Socio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
