'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Paper,
  alpha,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import {
  Store,
  CloudUpload,
  Image as ImageIcon,
  Edit,
  Visibility,
  DragIndicator,
  ErrorOutline,
  CheckCircle,
  Refresh,
  Delete,
} from '@mui/icons-material';
import { useComercio } from '@/hooks/useComercio';
import { uploadImage, generateImagePath, validateImageFile } from '@/utils/storage/uploadImage';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface ImageUploadState {
  preview: string | null;
  error: string | null;
  dragOver: boolean;
}

interface UploadProgress {
  uploading: boolean;
  progress: number;
  type: 'logo' | 'imagen' | null;
}

export const ImageUploader: React.FC = () => {
  const { comercio, loading, error: comercioError, clearError } = useComercio();
  
  const [logoState, setLogoState] = useState<ImageUploadState>({
    preview: null,
    error: null,
    dragOver: false
  });
  
  const [portadaState, setPortadaState] = useState<ImageUploadState>({
    preview: null,
    error: null,
    dragOver: false
  });

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    uploading: false,
    progress: 0,
    type: null
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);

  const validateAndPreviewFile = useCallback(async (file: File): Promise<{ valid: boolean; preview?: string; error?: string }> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    // Create preview
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return { valid: true, preview };
    } catch {
      return { valid: false, error: 'Error al procesar la imagen' };
    }
  }, []);

  const handleImageUpload = useCallback(async (file: File, type: 'logo' | 'imagen') => {
    if (!comercio?.id) {
      toast.error('No se pudo identificar el comercio');
      return;
    }

    const setState = type === 'logo' ? setLogoState : setPortadaState;
    
    // Clear any previous errors
    clearError();
    setState(prev => ({ ...prev, error: null }));

    // Validate and preview file
    const validation = await validateAndPreviewFile(file);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Error de validación' }));
      toast.error(validation.error || 'Error de validación');
      return;
    }

    // Set preview
    setState(prev => ({ ...prev, preview: validation.preview || null, error: null }));

    // Set upload progress
    setUploadProgress({
      uploading: true,
      progress: 0,
      type
    });

    try {
      // Generate path for the image
      const imagePath = generateImagePath(comercio.id, type === 'imagen' ? 'portada' : type);
      
      // Upload image with progress tracking
      const downloadURL = await uploadImage(file, imagePath, {
        onProgress: (progress) => {
          setUploadProgress(prev => ({ ...prev, progress }));
        }
      });

      // Update comercio document with new image URL
      const fieldName = type === 'logo' ? 'logo' : 'banner';
      await updateDoc(doc(db, 'comercios', comercio.id), {
        [fieldName]: downloadURL,
        actualizadoEn: serverTimestamp(),
      });

      // Complete upload
      setUploadProgress(prev => ({ ...prev, progress: 100 }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Imagen de portada'} subida exitosamente`);
      
      // Clear preview after successful upload
      setTimeout(() => {
        setState(prev => ({ ...prev, preview: null }));
        setUploadProgress({
          uploading: false,
          progress: 0,
          type: null
        });
      }, 2000);

    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      setState(prev => ({ ...prev, preview: null, error: errorMessage }));
      toast.error(errorMessage);
      
      setUploadProgress({
        uploading: false,
        progress: 0,
        type: null
      });
    }
  }, [comercio?.id, validateAndPreviewFile, clearError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'imagen') => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, type);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [handleImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent, type: 'logo' | 'imagen') => {
    event.preventDefault();
    const setState = type === 'logo' ? setLogoState : setPortadaState;
    setState(prev => ({ ...prev, dragOver: false }));
    
    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile, type);
    } else {
      toast.error('Por favor arrastra un archivo de imagen válido');
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent, type: 'logo' | 'imagen') => {
    event.preventDefault();
    const setState = type === 'logo' ? setLogoState : setPortadaState;
    setState(prev => ({ ...prev, dragOver: true }));
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent, type: 'logo' | 'imagen') => {
    event.preventDefault();
    const setState = type === 'logo' ? setLogoState : setPortadaState;
    setState(prev => ({ ...prev, dragOver: false }));
  }, []);

  const triggerFileInput = useCallback((type: 'logo' | 'imagen') => {
    if (uploadProgress.uploading) return;
    
    if (type === 'logo') {
      logoInputRef.current?.click();
    } else {
      portadaInputRef.current?.click();
    }
  }, [uploadProgress.uploading]);

  const clearPreview = useCallback((type: 'logo' | 'imagen') => {
    const setState = type === 'logo' ? setLogoState : setPortadaState;
    setState(prev => ({ ...prev, preview: null, error: null }));
  }, []);

  const ImageUploadCard: React.FC<{
    type: 'logo' | 'imagen';
    state: ImageUploadState;
    currentImage?: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    size: { width: number; height: number };
  }> = ({ type, state, currentImage, title, subtitle, icon, color, size }) => {
    const isUploading = uploadProgress.uploading && uploadProgress.type === type;
    const hasImage = currentImage || state.preview;

    return (
      <Box sx={{ flex: 1, minWidth: 300 }}>
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
          {icon}
          {title}
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `2px dashed ${state.dragOver ? color : state.error ? '#ef4444' : '#d1d5db'}`,
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            transition: 'all 0.3s ease',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            bgcolor: state.dragOver ? alpha(color, 0.05) : state.error ? alpha('#ef4444', 0.05) : 'transparent',
            '&:hover': {
              borderColor: isUploading ? (state.error ? '#ef4444' : '#d1d5db') : color,
              bgcolor: isUploading ? 'transparent' : alpha(color, 0.05),
            },
          }}
          onClick={() => !isUploading && triggerFileInput(type)}
          onDrop={(e) => handleDrop(e, type)}
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={(e) => handleDragLeave(e, type)}
        >
          <Stack spacing={3} alignItems="center">
            {/* Image Preview */}
            <motion.div
              whileHover={{ scale: isUploading ? 1 : 1.02 }}
              whileTap={{ scale: isUploading ? 1 : 0.98 }}
            >
              {type === 'logo' ? (
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={state.preview || currentImage}
                    sx={{
                      width: size.width,
                      height: size.height,
                      bgcolor: alpha(color, 0.1),
                      border: '4px solid #f1f5f9',
                      position: 'relative',
                    }}
                  >
                    {!hasImage && <Store sx={{ fontSize: 40, color }} />}
                  </Avatar>
                  
                  {hasImage && !isUploading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: alpha('#000', 0.4),
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Edit sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                  )}

                  {state.preview && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPreview(type);
                      }}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: '#ef4444',
                        color: 'white',
                        '&:hover': { bgcolor: '#dc2626' },
                        width: 24,
                        height: 24,
                      }}
                    >
                      <Delete sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    width: size.width,
                    height: size.height,
                    bgcolor: alpha(color, 0.1),
                    border: '4px solid #f1f5f9',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: hasImage ? `url(${state.preview || currentImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {!hasImage && <ImageIcon sx={{ fontSize: 50, color }} />}
                  
                  {hasImage && !isUploading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: alpha('#000', 0.4),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Edit sx={{ fontSize: 30, color: 'white' }} />
                    </Box>
                  )}

                  {state.preview && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPreview(type);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: alpha('#ef4444', 0.9),
                        color: 'white',
                        '&:hover': { bgcolor: '#dc2626' },
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Paper>
              )}
            </motion.div>

            {/* Upload Info */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                {hasImage ? `Cambiar ${title}` : `Subir ${title}`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                {subtitle}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip
                  label="PNG, JPG, WebP"
                  size="small"
                  sx={{ bgcolor: alpha(color, 0.1), color }}
                />
                <Chip
                  label="Máx. 5MB"
                  size="small"
                  sx={{ bgcolor: alpha(color, 0.1), color }}
                />
              </Stack>
            </Box>

            {/* Upload State */}
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ width: '100%' }}
                >
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(color, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: color,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
                    {uploadProgress.progress === 100 ? 'Completado!' : `Subiendo... ${uploadProgress.progress}%`}
                  </Typography>
                </motion.div>
              ) : state.error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#ef4444', mb: 2 }}>
                    <ErrorOutline fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {state.error}
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={() => {
                      const setState = type === 'logo' ? setLogoState : setPortadaState;
                      setState(prev => ({ ...prev, error: null }));
                    }}
                    sx={{ color: '#ef4444' }}
                  >
                    Reintentar
                  </Button>
                </motion.div>
              ) : uploadProgress.progress === 100 && uploadProgress.type === type ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#10b981' }}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ¡Subida exitosa!
                    </Typography>
                  </Stack>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {state.dragOver ? (
                      <Chip
                        icon={<DragIndicator />}
                        label="Suelta aquí"
                        sx={{
                          bgcolor: alpha(color, 0.2),
                          color,
                          fontWeight: 600,
                        }}
                      />
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        disabled={isUploading}
                        sx={{
                          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                          boxShadow: `0 4px 20px ${alpha(color, 0.3)}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${color}dd 0%, ${color}bb 100%)`,
                            boxShadow: `0 6px 25px ${alpha(color, 0.4)}`,
                          },
                          '&:disabled': {
                            background: '#e2e8f0',
                            color: '#94a3b8',
                            boxShadow: 'none',
                          }
                        }}
                      >
                        {hasImage ? 'Cambiar' : 'Subir'}
                      </Button>
                    )}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Drag & Drop Hint */}
            {!isUploading && !state.error && (
              <Typography variant="caption" sx={{ color: '#9ca3af', fontStyle: 'italic' }}>
                O arrastra y suelta una imagen aquí
              </Typography>
            )}
          </Stack>

          {/* Hidden file inputs */}
          <input
            ref={type === 'logo' ? logoInputRef : portadaInputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e, type)}
            disabled={isUploading}
          />
        </Paper>

        {/* Image Actions */}
        {hasImage && !isUploading && !state.preview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              <Tooltip title="Ver imagen completa">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(currentImage || '', '_blank');
                  }}
                  sx={{
                    bgcolor: alpha('#06b6d4', 0.1),
                    color: '#06b6d4',
                    '&:hover': { bgcolor: alpha('#06b6d4', 0.2) }
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </motion.div>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Card elevation={0} sx={{ p: 4 }}>
        <Typography>Cargando información del comercio...</Typography>
      </Card>
    );
  }

  if (!comercio) {
    return (
      <Card elevation={0} sx={{ p: 4 }}>
        <Typography color="error">No se pudo cargar la información del comercio</Typography>
      </Card>
    );
  }

  return (
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
          left: 0,
          width: 150,
          height: 150,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          opacity: 0.05,
          transform: 'translate(-50%, -50%)',
        }}
      />

      <CardContent sx={{ p: 6, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
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
            <ImageIcon sx={{ fontSize: 32, color: '#10b981' }} />
            Imágenes del Comercio
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
            Sube tu logo y una imagen de portada para que los socios reconozcan fácilmente tu comercio.
          </Typography>
        </Box>

        {/* Global Error Alert */}
        <AnimatePresence>
          {comercioError && (
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
                {comercioError}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Box sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Logo Upload */}
          <ImageUploadCard
            type="logo"
            state={logoState}
            currentImage={comercio.logo}
            title="Logo del Comercio"
            subtitle="Tamaño recomendado: 300x300px"
            icon={<Store sx={{ fontSize: 20, color: '#10b981' }} />}
            color="#10b981"
            size={{ width: 120, height: 120 }}
          />

          {/* Portada Upload */}
          <ImageUploadCard
            type="imagen"
            state={portadaState}
            currentImage={comercio.banner}
            title="Imagen de Portada"
            subtitle="Tamaño recomendado: 1200x600px"
            icon={<ImageIcon sx={{ fontSize: 20, color: '#6366f1' }} />}
            color="#6366f1"
            size={{ width: 240, height: 140 }}
          />
        </Box>

        {/* Tips */}
        <Box sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              bgcolor: alpha('#06b6d4', 0.05),
              border: '1px solid',
              borderColor: alpha('#06b6d4', 0.2),
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0891b2', mb: 2 }}>
              💡 Consejos para mejores imágenes
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: '#0f766e' }}>
                • <strong>Logo:</strong> Usa un fondo transparente o blanco, con buena resolución
              </Typography>
              <Typography variant="body2" sx={{ color: '#0f766e' }}>
                • <strong>Portada:</strong> Muestra tu local, productos o ambiente para atraer socios
              </Typography>
              <Typography variant="body2" sx={{ color: '#0f766e' }}>
                • <strong>Calidad:</strong> Imágenes nítidas y bien iluminadas generan más confianza
              </Typography>
              <Typography variant="body2" sx={{ color: '#0f766e' }}>
                • <strong>Formatos:</strong> PNG para logos con transparencia, JPG para fotos
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
};