'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  alpha,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Store,
  Email,
  Phone,
  LocationOn,
  Schedule,
  Language,
  Description,
  Save,
  Refresh,
  Visibility,
  VisibilityOff,
  Business,
  Category,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useComercio } from '@/hooks/useComercio';
// TODO: Replace 'ComercioProfileFormData' with the correct type from '@/lib/validations/comercio' if it exists.
// If it does not exist, define it locally as shown below or import the correct one.
type ComercioProfileFormData = {
  nombre: string;
  nombreComercio: string;
  email: string;
  categoria: string;
  direccion: string;
  telefono: string;
  horario: string;
  descripcion: string;
  sitioWeb: string;
  razonSocial: string;
  cuit: string;
  ubicacion: string;
  emailContacto: string;
  visible: boolean;
  redesSociales: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
};
import { CATEGORIAS_COMERCIO } from '@/types/comercio';

export const ProfileForm: React.FC = () => {
  const { comercio, loading, updateProfile, error, clearError } = useComercio();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<ComercioProfileFormData>({
    defaultValues: {
      nombre: '',
      nombreComercio: '',
      email: '',
      categoria: '',
      direccion: '',
      telefono: '',
      horario: '',
      descripcion: '',
      sitioWeb: '',
      razonSocial: '',
      cuit: '',
      ubicacion: '',
      emailContacto: '',
      visible: true,
      redesSociales: {
        facebook: '',
        instagram: '',
        twitter: '',
      }
    }
  });

  // Watch for changes
  const watchedFields = watch();
  
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // Load comercio data
  useEffect(() => {
    if (comercio) {
      const formData = {
        nombre: comercio.nombreComercio || '', // Use nombreComercio as the responsible person name
        nombreComercio: comercio.nombreComercio || '',
        email: comercio.email || '',
        categoria: comercio.categoria || '',
        direccion: comercio.direccion || '',
        telefono: comercio.telefono || '',
        horario: comercio.horario || '',
        descripcion: comercio.descripcion || '',
        sitioWeb: comercio.sitioWeb || '',
        razonSocial: comercio.nombreComercio || '', // Use nombreComercio as default for razonSocial
        cuit: comercio.cuit || '',
        ubicacion: comercio.direccion || '', // Use direccion as default for ubicacion
        emailContacto: comercio.email || '', // Use email as default for emailContacto
        visible: comercio.visible ?? true,
        redesSociales: {
          facebook: '',
          instagram: '',
          twitter: '',
        }
      };
      
      reset(formData);
      setHasChanges(false);
    }
  }, [comercio, reset]);

  const onSubmit = async (data: ComercioProfileFormData) => {
    try {
      clearError();
      
      const success = await updateProfile({
        nombreComercio: data.nombreComercio.trim(),
        email: data.email.trim().toLowerCase(),
        categoria: data.categoria,
        direccion: data.direccion?.trim() || '',
        telefono: data.telefono?.trim() || '',
        horario: data.horario?.trim() || '',
        descripcion: data.descripcion?.trim() || '',
        sitioWeb: data.sitioWeb?.trim() || '',
        cuit: data.cuit?.trim() || '',
        configuracion: {
          notificacionesEmail: true,
          notificacionesWhatsApp: false,
          autoValidacion: false,
          requiereAprobacion: true,
        },
      });
      
      if (success) {
        setIsEditing(false);
        setHasChanges(false);
        setSaveSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleReset = () => {
    if (comercio) {
      const formData = {
        nombre: comercio.nombreComercio || '',
        nombreComercio: comercio.nombreComercio || '',
        email: comercio.email || '',
        categoria: comercio.categoria || '',
        direccion: comercio.direccion || '',
        telefono: comercio.telefono || '',
        horario: comercio.horario || '',
        descripcion: comercio.descripcion || '',
        sitioWeb: comercio.sitioWeb || '',
        razonSocial: comercio.nombreComercio || '',
        cuit: comercio.cuit || '',
        ubicacion: comercio.direccion || '',
        emailContacto: comercio.email || '',
        visible: comercio.visible ?? true,
        redesSociales: {
          facebook: '',
          instagram: '',
          twitter: '',
        }
      };
      
      reset(formData);
    }
    setIsEditing(false);
    setHasChanges(false);
    clearError();
  };

  const handleEditToggle = () => {
    if (isEditing && hasChanges) {
      // Show confirmation dialog or handle unsaved changes
      const confirmDiscard = window.confirm('Tienes cambios sin guardar. ¿Deseas descartarlos?');
      if (!confirmDiscard) return;
    }
    
    setIsEditing(!isEditing);
    if (!isEditing) {
      clearError();
    } else {
      handleReset();
    }
  };

  if (loading && !comercio) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={40} sx={{ color: '#06b6d4' }} />
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Cargando información del comercio...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '50%',
            opacity: 0.05,
            transform: 'translate(50%, -50%)',
          }}
        />

        <CardContent sx={{ p: 6, position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 900, 
                  color: '#0f172a',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Store sx={{ fontSize: 32, color: '#6366f1' }} />
                Información General
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                Mantén actualizada la información de tu comercio para que los socios puedan encontrarte fácilmente.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Chip
                      icon={<Warning />}
                      label="Cambios sin guardar"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </motion.div>
                )}
                
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Chip
                      icon={<CheckCircle />}
                      label="Guardado exitosamente"
                      sx={{ 
                        bgcolor: '#10b981', 
                        color: 'white',
                        fontWeight: 600 
                      }}
                      size="small"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isEditing ? (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                    startIcon={<Refresh />}
                    disabled={isSubmitting}
                    sx={{
                      borderColor: '#d1d5db',
                      color: '#6b7280',
                      '&:hover': {
                        borderColor: '#9ca3af',
                        bgcolor: alpha('#6b7280', 0.1),
                      }
                    }}
                  >
                    Restablecer
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting || !hasChanges}
                    startIcon={isSubmitting ? <CircularProgress size={16} /> : <Save />}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                        boxShadow: '0 6px 25px rgba(99, 102, 241, 0.4)',
                      },
                      '&:disabled': {
                        background: '#e2e8f0',
                        color: '#94a3b8',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleEditToggle}
                  startIcon={<Store />}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                      boxShadow: '0 6px 25px rgba(99, 102, 241, 0.4)',
                    }
                  }}
                >
                  Editar Perfil
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ marginBottom: 24 }}
              >
                <Alert 
                  severity="error" 
                  onClose={clearError}
                  sx={{ borderRadius: 3 }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={6}>
              {/* Basic Information */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#374151', 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Business sx={{ fontSize: 20, color: '#6366f1' }} />
                  Datos Generales
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <TextField
                        {...register('nombreComercio', { 
                          required: 'El nombre comercial es requerido',
                          minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                        })}
                        label="Nombre Comercial"
                        fullWidth
                        disabled={!isEditing}
                        error={!!errors.nombreComercio}
                        helperText={errors.nombreComercio?.message}
                        InputProps={{
                          startAdornment: <Store sx={{ color: '#94a3b8', mr: 1 }} />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366f1',
                              borderWidth: 2,
                            }
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <Controller
                        name="categoria"
                        control={control}
                        rules={{ required: 'La categoría es requerida' }}
                        render={({ field }) => (
                          <FormControl fullWidth disabled={!isEditing} error={!!errors.categoria}>
                            <InputLabel>Rubro o Categoría</InputLabel>
                            <Select
                              {...field}
                              label="Rubro o Categoría"
                              startAdornment={<Category sx={{ color: '#94a3b8', mr: 1 }} />}
                              sx={{
                                borderRadius: 3,
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#6366f1',
                                  borderWidth: 2,
                                }
                              }}
                            >
                              {CATEGORIAS_COMERCIO.map((categoria) => (
                                <MenuItem key={categoria} value={categoria}>
                                  {categoria}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.categoria && (
                              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                                {errors.categoria.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <TextField
                        {...register('cuit')}
                        label="RUT / CUIT"
                        fullWidth
                        disabled={!isEditing}
                        placeholder="12-34567890-1"
                        error={!!errors.cuit}
                        helperText={errors.cuit?.message}
                        InputProps={{
                          startAdornment: <Description sx={{ color: '#94a3b8', mr: 1 }} />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366f1',
                              borderWidth: 2,
                            }
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <Controller
                        name="visible"
                        control={control}
                        render={({ field }) => (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              border: '1px solid #e2e8f0',
                              borderRadius: 3,
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  {...field}
                                  checked={field.value ?? true}
                                  disabled={!isEditing}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#6366f1',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#6366f1',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  {field.value ? <Visibility sx={{ color: '#10b981' }} /> : <VisibilityOff sx={{ color: '#ef4444' }} />}
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {field.value ? 'Visible para socios' : 'Oculto para socios'}
                                  </Typography>
                                </Stack>
                              }
                            />
                          </Paper>
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.3 }} />

              {/* Contact Information */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#374151', 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Phone sx={{ fontSize: 20, color: '#06b6d4' }} />
                  Información de Contacto
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <TextField
                    {...register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Formato de email inválido'
                      }
                    })}
                    label="Email Principal"
                    type="email"
                    fullWidth
                    disabled={!isEditing}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: <Email sx={{ color: '#94a3b8', mr: 1 }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#06b6d4',
                          borderWidth: 2,
                        }
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <TextField
                        {...register('telefono', {
                          pattern: {
                            value: /^[\+]?[0-9\s\-\(\)]+$/,
                            message: 'Formato de teléfono inválido'
                          }
                        })}
                        label="Teléfono"
                        fullWidth
                        disabled={!isEditing}
                        error={!!errors.telefono}
                        helperText={errors.telefono?.message}
                        placeholder="+598 99 123 456"
                        InputProps={{
                          startAdornment: <Phone sx={{ color: '#94a3b8', mr: 1 }} />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#06b6d4',
                              borderWidth: 2,
                            }
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 300 }}>
                      <TextField
                        {...register('horario')}
                        label="Horarios de Atención"
                        fullWidth
                        disabled={!isEditing}
                        placeholder="Lunes a Viernes - 9 a 18 hs"
                        error={!!errors.horario}
                        helperText={errors.horario?.message}
                        InputProps={{
                          startAdornment: <Schedule sx={{ color: '#94a3b8', mr: 1 }} />,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '&.Mui-focused fieldset': {
                              borderColor: '#06b6d4',
                              borderWidth: 2,
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  <TextField
                    {...register('direccion', {
                      required: 'La dirección es requerida'
                    })}
                    label="Dirección Física"
                    fullWidth
                    disabled={!isEditing}
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ color: '#94a3b8', mr: 1 }} />,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#06b6d4',
                          borderWidth: 2,
                        }
                      }
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.3 }} />

              {/* Description */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#374151', 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Description sx={{ fontSize: 20, color: '#10b981' }} />
                  Descripción y Presentación
                </Typography>
                
                <TextField
                  {...register('descripcion', {
                    maxLength: {
                      value: 500,
                      message: 'Máximo 500 caracteres'
                    }
                  })}
                  label="Descripción del Comercio"
                  fullWidth
                  multiline
                  rows={4}
                  disabled={!isEditing}
                  placeholder="Describe tu comercio, productos o servicios que ofreces a los socios de Fidelitá..."
                  helperText={`${watchedFields.descripcion?.length || 0}/500 caracteres. Esta descripción será visible para los socios.`}
                  error={!!errors.descripcion}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&.Mui-focused fieldset': {
                        borderColor: '#10b981',
                        borderWidth: 2,
                      }
                    }
                  }}
                />
              </Box>

              <Divider sx={{ opacity: 0.3 }} />

              {/* Online Presence */}
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#374151', 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Language sx={{ fontSize: 20, color: '#f59e0b' }} />
                  Presencia Online
                </Typography>
                
                <TextField
                  {...register('sitioWeb', {
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                      message: 'URL inválida. Ejemplo: https://www.micomercio.com'
                    }
                  })}
                  label="Sitio Web"
                  fullWidth
                  disabled={!isEditing}
                  placeholder="https://www.micomercio.com"
                  error={!!errors.sitioWeb}
                  helperText={errors.sitioWeb?.message}
                  InputProps={{
                    startAdornment: <Language sx={{ color: '#94a3b8', mr: 1 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&.Mui-focused fieldset': {
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                      }
                    }
                  }}
                />
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Floating Save Changes Alert */}
      <AnimatePresence>
        {hasChanges && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24, 
              zIndex: 1000,
              maxWidth: 400
            }}
          >
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleReset}
                    disabled={isSubmitting}
                  >
                    Descartar
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={12} /> : undefined}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Stack>
              }
              sx={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                borderRadius: 3,
                bgcolor: '#fff3cd',
                border: '1px solid #ffeaa7',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Tienes cambios sin guardar
              </Typography>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CircularProgress size={40} sx={{ color: '#6366f1' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                Guardando cambios...
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                Por favor espera mientras actualizamos tu perfil
              </Typography>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};