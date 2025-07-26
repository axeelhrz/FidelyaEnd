'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Hash,
  Shield,
  Save,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
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

const STEPS = [
  {
    id: 1,
    title: 'Información Personal',
    description: 'Datos básicos del socio',
    icon: User,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    title: 'Acceso al Sistema',
    description: 'Credenciales de acceso',
    icon: Key,
    color: 'bg-purple-500'
  },
  {
    id: 3,
    title: 'Configuración',
    description: 'Estado y configuración final',
    icon: Shield,
    color: 'bg-emerald-500'
  }
];

export const SocioDialog: React.FC<SocioDialogProps> = ({
  open,
  onClose,
  onSave,
  socio,
}) => {
  const isEditing = !!socio;
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm<SocioFormData>({
    resolver: zodResolver(socioSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      estado: 'activo',
      telefono: '',
      dni: '',
      numeroSocio: '',
    }
  });

  const watchedFields = watch();

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
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
          password: '', // No pre-fill password for security
          confirmPassword: '',
          estado: socio.estado === 'activo' || socio.estado === 'vencido' || socio.estado === 'inactivo' || socio.estado === 'suspendido' || socio.estado === 'pendiente' 
            ? socio.estado 
            : 'activo',
          telefono: socio.telefono || '',
          dni: socio.dni || '',
          fechaNacimiento,
          numeroSocio: socio.numeroSocio || '',
          fechaVencimiento,
        });
      } else {
        reset({
          nombre: '',
          email: '',
          password: '',
          confirmPassword: '',
          estado: 'activo',
          telefono: '',
          dni: '',
          fechaNacimiento: new Date(),
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

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof SocioFormData)[] => {
    switch (step) {
      case 1:
        return ['nombre', 'email', 'dni', 'telefono', 'fechaNacimiento'];
      case 2:
        return ['password', 'confirmPassword'];
      case 3:
        return ['estado', 'numeroSocio', 'fechaVencimiento'];
      default:
        return [];
    }
  };

  const getFieldValidationState = (fieldName: keyof SocioFormData) => {
    const hasError = !!errors[fieldName];
    const isTouched = !!touchedFields[fieldName];
    const hasValue = !!watchedFields[fieldName];
    
    if (hasError) return 'error';
    if (isTouched && hasValue) return 'success';
    return 'default';
  };

  const getFieldIcon = (state: string) => {
    switch (state) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getFieldClasses = (state: string) => {
    const baseClasses = "w-full pl-12 pr-12 py-3.5 border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none focus:ring-0";
    
    switch (state) {
      case 'success':
        return `${baseClasses} border-emerald-200 bg-emerald-50/50 focus:border-emerald-400 focus:bg-emerald-50`;
      case 'error':
        return `${baseClasses} border-red-200 bg-red-50/50 focus:border-red-400 focus:bg-red-50`;
      default:
        return `${baseClasses} border-gray-200 bg-white focus:border-indigo-400 focus:bg-indigo-50/30 hover:border-gray-300`;
    }
  };

  const statusOptions = [
    { value: 'activo', label: 'Activo', color: 'bg-emerald-500', description: 'Socio con acceso completo' },
    { value: 'pendiente', label: 'Pendiente', color: 'bg-amber-500', description: 'Esperando activación' },
    { value: 'inactivo', label: 'Inactivo', color: 'bg-gray-500', description: 'Sin acceso temporal' },
    { value: 'suspendido', label: 'Suspendido', color: 'bg-red-500', description: 'Acceso bloqueado' },
    { value: 'vencido', label: 'Vencido', color: 'bg-orange-500', description: 'Membresía expirada' },
  ];

  const isStepValid = (step: number) => {
    const fieldsToCheck = getFieldsForStep(step);
    return fieldsToCheck.every(field => !errors[field] && watchedFields[field]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Nombre */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('nombre')}
                  type="text"
                  placeholder="Ingresa el nombre completo"
                  className={getFieldClasses(getFieldValidationState('nombre'))}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('nombre'))}
                </div>
              </div>
              {errors.nombre && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.nombre.message}</span>
                </motion.p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="socio@ejemplo.com"
                  className={getFieldClasses(getFieldValidationState('email'))}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('email'))}
                </div>
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email.message}</span>
                </motion.p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DNI */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  DNI / Documento
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('dni')}
                    type="text"
                    placeholder="Número de documento"
                    className={getFieldClasses(getFieldValidationState('dni'))}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon(getFieldValidationState('dni'))}
                  </div>
                </div>
                {errors.dni && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center space-x-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.dni.message}</span>
                  </motion.p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('telefono')}
                    type="text"
                    placeholder="+54 11 1234-5678"
                    className={getFieldClasses(getFieldValidationState('telefono'))}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {getFieldIcon(getFieldValidationState('telefono'))}
                  </div>
                </div>
                {errors.telefono && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center space-x-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.telefono.message}</span>
                  </motion.p>
                )}
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha de nacimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('fechaNacimiento', {
                    valueAsDate: true,
                  })}
                  type="date"
                  className={getFieldClasses(getFieldValidationState('fechaNacimiento'))}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('fechaNacimiento'))}
                </div>
              </div>
              {errors.fechaNacimiento && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.fechaNacimiento.message}</span>
                </motion.p>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Credenciales de Acceso</h3>
              <p className="text-gray-600 text-sm">
                Estas credenciales permitirán al socio acceder a su cuenta personal
              </p>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className={getFieldClasses(getFieldValidationState('password'))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password.message}</span>
                </motion.p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  className={getFieldClasses(getFieldValidationState('confirmPassword'))}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.confirmPassword.message}</span>
                </motion.p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {watchedFields.password && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <h4 className="text-sm font-medium text-gray-900 mb-2">Seguridad de la contraseña</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${watchedFields.password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className={`text-xs ${watchedFields.password.length >= 6 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(watchedFields.password) ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className={`text-xs ${/[A-Z]/.test(watchedFields.password) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      Al menos una mayúscula
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(watchedFields.password) ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                    <span className={`text-xs ${/[0-9]/.test(watchedFields.password) ? 'text-emerald-600' : 'text-gray-500'}`}>
                      Al menos un número
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Estado */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Estado del socio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  {...register('estado')}
                  className={getFieldClasses(getFieldValidationState('estado'))}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('estado'))}
                </div>
              </div>
              {errors.estado && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.estado.message}</span>
                </motion.p>
              )}
            </div>

            {/* Número de Socio */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Número de socio
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('numeroSocio')}
                  type="text"
                  placeholder="Se genera automáticamente si se deja vacío"
                  className={getFieldClasses(getFieldValidationState('numeroSocio'))}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('numeroSocio'))}
                </div>
              </div>
              {errors.numeroSocio && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.numeroSocio.message}</span>
                </motion.p>
              )}
            </div>

            {/* Fecha de Vencimiento */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Fecha de vencimiento
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('fechaVencimiento', {
                    valueAsDate: true,
                  })}
                  type="date"
                  className={getFieldClasses(getFieldValidationState('fechaVencimiento'))}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {getFieldIcon(getFieldValidationState('fechaVencimiento'))}
                </div>
              </div>
              {errors.fechaVencimiento && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.fechaVencimiento.message}</span>
                </motion.p>
              )}
            </div>

            {/* Status Preview */}
            {watchedFields.estado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${statusOptions.find(s => s.value === watchedFields.estado)?.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {statusOptions.find(s => s.value === watchedFields.estado)?.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {statusOptions.find(s => s.value === watchedFields.estado)?.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog Container */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-8 py-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
                    >
                      {isEditing ? (
                        <User className="w-8 h-8 text-white" />
                      ) : (
                        <UserPlus className="w-8 h-8 text-white" />
                      )}
                    </motion.div>
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold text-white"
                      >
                        {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/80 text-sm mt-1"
                      >
                        Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1]?.description}
                      </motion.p>
                    </div>
                  </div>
                  
                  <motion.button
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-4 left-20 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              </div>

              {/* Step Indicator */}
              <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          currentStep === step.id
                            ? `${step.color} text-white shadow-lg`
                            : currentStep > step.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {currentStep > step.id ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={`w-12 h-0.5 mx-4 transition-all duration-200 ${
                          currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200"
                >
                  <div className="flex gap-4 flex-1">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={isSubmitting}
                        className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Anterior
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  {currentStep < STEPS.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid(currentStep)}
                      className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      Siguiente
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          {isEditing ? 'Actualizar' : 'Crear'} Socio
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};