'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Calendar, 
  DollarSign, 
  Percent, 
  Gift,
  AlertCircle,
  Info,
  Star,
  Building2
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Beneficio, BeneficioFormData, CATEGORIAS_BENEFICIOS } from '@/types/beneficio';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { BeneficiosService } from '@/services/beneficios.service';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

// Schema de validación
const beneficioSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo: z.enum(['porcentaje', 'monto_fijo', 'producto_gratis']),
  descuento: z
    .number()
    .min(0, 'El descuento debe ser mayor a 0'),
  fechaInicio: z
    .date()
    .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'La fecha de inicio debe ser hoy o posterior'
    }),
  fechaFin: z
    .date(),
  limitePorSocio: z
    .number()
    .min(1, 'El límite por socio debe ser mayor a 0')
    .optional()
    .or(z.literal(undefined)),
  limiteTotal: z
    .number()
    .min(1, 'El límite total debe ser mayor a 0')
    .optional()
    .or(z.literal(undefined)),
  condiciones: z
    .string()
    .max(300, 'Las condiciones no pueden exceder 300 caracteres')
    .optional(),
  categoria: z
    .string()
    .min(1, 'La categoría es requerida'),
  tags: z
    .array(z.string())
    .optional(),
  destacado: z
    .boolean()
    .optional(),
  asociacionesDisponibles: z
    .array(z.string())
    .optional()
}).refine((data) => data.fechaFin > data.fechaInicio, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin']
}).refine((data) => {
  if (data.tipo === 'porcentaje' && data.descuento > 100) {
    return false;
  }
  return true;
}, {
  message: 'El porcentaje no puede ser mayor a 100%',
  path: ['descuento']
});

interface BeneficioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BeneficioFormData) => Promise<boolean>;
  beneficio?: Beneficio | null;
  loading?: boolean;
}

export const BeneficioForm: React.FC<BeneficioFormProps> = ({
  open,
  onClose,
  onSubmit,
  beneficio,
}) => {
  const { user } = useAuth();
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState<Array<{id: string; nombre: string}>>([]);
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);

  const isEditing = !!beneficio;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<BeneficioFormData>({
    resolver: zodResolver(beneficioSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipo: 'porcentaje',
      descuento: 0,
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      categoria: '',
      tags: [],
      destacado: false,
      asociacionesDisponibles: []
    }
  });

  const selectedTipo = watch('tipo');
  const destacado = watch('destacado');
  const selectedAsociaciones = watch('asociacionesDisponibles') || [];

  // Cargar asociaciones disponibles para comercios
  useEffect(() => {
    const cargarAsociaciones = async () => {
      if (user?.role === 'comercio' && open) {
        setLoadingAsociaciones(true);
        try {
          const asociaciones = await BeneficiosService.obtenerAsociacionesDisponibles(user.uid);
          setAsociacionesDisponibles(asociaciones);
        } catch (error) {
          console.error('Error cargando asociaciones:', error);
        } finally {
          setLoadingAsociaciones(false);
        }
      }
    };

    cargarAsociaciones();
  }, [user, open]);

  // Cargar datos del beneficio al editar
  useEffect(() => {
    if (beneficio && open) {
      reset({
        titulo: beneficio.titulo,
        descripcion: beneficio.descripcion,
        tipo: beneficio.tipo,
        descuento: beneficio.descuento,
        fechaInicio: beneficio.fechaInicio.toDate(),
        fechaFin: beneficio.fechaFin.toDate(),
        limitePorSocio: beneficio.limitePorSocio,
        limiteTotal: beneficio.limiteTotal,
        condiciones: beneficio.condiciones,
        categoria: beneficio.categoria,
        tags: beneficio.tags || [],
        destacado: beneficio.destacado || false,
        asociacionesDisponibles: beneficio.asociacionesDisponibles || []
      });
      setTagsInput(beneficio.tags?.join(', ') || '');
    } else if (open && !beneficio) {
      reset({
        titulo: '',
        descripcion: '',
        tipo: 'porcentaje',
        descuento: 0,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        categoria: '',
        tags: [],
        destacado: false,
        asociacionesDisponibles: []
      });
      setTagsInput('');
    }
  }, [beneficio, open, reset]);

  // Manejar tags
  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setValue('tags', tags);
  };

  // Manejar selección de asociaciones
  const handleAsociacionToggle = (asociacionId: string) => {
    const currentSelected = selectedAsociaciones || [];
    const newSelected = currentSelected.includes(asociacionId)
      ? currentSelected.filter(id => id !== asociacionId)
      : [...currentSelected, asociacionId];
    
    setValue('asociacionesDisponibles', newSelected);
  };

  const handleFormSubmit = async (data: BeneficioFormData) => {
    setSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getTipoConfig = (tipo: string) => {
    const configs = {
      porcentaje: {
        label: 'Descuento por Porcentaje',
        icon: <Percent size={20} />,
        color: '#10b981',
        placeholder: 'Ej: 15',
        suffix: '%',
        maxValue: 100,
        description: 'Descuento basado en porcentaje del total'
      },
      monto_fijo: {
        label: 'Descuento Fijo',
        icon: <DollarSign size={20} />,
        color: '#6366f1',
        placeholder: 'Ej: 50',
        suffix: '$',
        maxValue: undefined,
        description: 'Descuento de monto fijo en pesos'
      },
      producto_gratis: {
        label: 'Producto Gratis',
        icon: <Gift size={20} />,
        color: '#f59e0b',
        placeholder: '0',
        suffix: '',
        maxValue: undefined,
        description: 'Producto completamente gratis'
      }
    };
    return configs[tipo as keyof typeof configs] || configs.porcentaje;
  };

  const tipoConfig = getTipoConfig(selectedTipo);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: tipoConfig.color }}
            >
              {tipoConfig.icon}
            </div>
            {isEditing ? 'Editar Beneficio' : 'Crear Nuevo Beneficio'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Información básica */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={20} />
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Beneficio *
                </label>
                <Input
                  {...register('titulo')}
                  placeholder="Ej: 20% de descuento en toda la tienda"
                  error={errors.titulo?.message}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  placeholder="Describe los detalles del beneficio..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  {...register('categoria')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_BENEFICIOS.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas (separadas por comas)
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Ej: descuento, promoción, especial"
                />
              </div>
            </div>
          </div>

          {/* Configuración del descuento */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {tipoConfig.icon}
              Configuración del Descuento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Beneficio *
                </label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="porcentaje">Descuento por Porcentaje</option>
                      <option value="monto_fijo">Descuento Fijo</option>
                      <option value="producto_gratis">Producto Gratis</option>
                    </select>
                  )}
                />
              </div>

              {selectedTipo !== 'producto_gratis' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor del Descuento *
                  </label>
                  <div className="relative">
                    <Input
                      {...register('descuento', { valueAsNumber: true })}
                      type="number"
                      placeholder={tipoConfig.placeholder}
                      min="0"
                      max={tipoConfig.maxValue}
                      step={selectedTipo === 'porcentaje' ? '0.1' : '1'}
                      error={errors.descuento?.message}
                    />
                    {tipoConfig.suffix && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 font-medium">{tipoConfig.suffix}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="bg-white rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: tipoConfig.color }}
                    >
                      <Info size={16} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{tipoConfig.label}</h4>
                      <p className="text-sm text-gray-600">{tipoConfig.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asociaciones disponibles - Solo para comercios */}
          {user?.role === 'comercio' && (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} />
                Asociaciones Disponibles
              </h3>

              {loadingAsociaciones ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">Cargando asociaciones...</span>
                </div>
              ) : asociacionesDisponibles.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    Selecciona las asociaciones donde estará disponible este beneficio:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {asociacionesDisponibles.map((asociacion) => (
                      <label
                        key={asociacion.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAsociaciones.includes(asociacion.id)}
                          onChange={() => handleAsociacionToggle(asociacion.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {asociacion.nombre}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedAsociaciones.length === 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      Si no seleccionas ninguna asociación, el beneficio estará disponible para todas las asociaciones vinculadas.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    No tienes asociaciones vinculadas. El beneficio estará disponible universalmente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Período de validez */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Período de Validez
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <Controller
                  name="fechaInicio"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      error={errors.fechaInicio?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <Controller
                  name="fechaFin"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      error={errors.fechaFin?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Configuración avanzada */}
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Configuración Avanzada
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite por Socio
                </label>
                <Input
                  {...register('limitePorSocio', { valueAsNumber: true })}
                  type="number"
                  placeholder="Ej: 1 (opcional)"
                  min="1"
                  error={errors.limitePorSocio?.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Máximo de veces que un socio puede usar este beneficio
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite Total
                </label>
                <Input
                  {...register('limiteTotal', { valueAsNumber: true })}
                  type="number"
                  placeholder="Ej: 100 (opcional)"
                  min="1"
                  error={errors.limiteTotal?.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Máximo de usos totales del beneficio
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos y Condiciones
                </label>
                <textarea
                  {...register('condiciones')}
                  rows={3}
                  placeholder="Especifica las condiciones de uso del beneficio..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                {errors.condiciones && (
                  <p className="mt-1 text-sm text-red-600">{errors.condiciones.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3">
                  <Controller
                    name="destacado"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      />
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Star size={18} className={destacado ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
                    <span className="text-sm font-medium text-gray-700">
                      Marcar como beneficio destacado
                    </span>
                  </div>
                </label>
                <p className="mt-1 ml-8 text-xs text-gray-500">
                  Los beneficios destacados aparecen primero en las búsquedas
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              leftIcon={<X size={16} />}
              className="flex-1 sm:flex-none"
              disabled={submitting}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              leftIcon={<Save size={16} />}
              loading={submitting}
              disabled={!isValid || submitting}
              className="flex-1 sm:flex-none"
            >
              {submitting 
                ? 'Guardando...' 
                : isEditing 
                  ? 'Actualizar Beneficio' 
                  : 'Crear Beneficio'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};