'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  Divider,
  TextField,
  MenuItem,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Notifications,
  Email,
  Sms,
  PhoneAndroid,
  VolumeOff,
  Settings,
  CheckCircle,
  ExpandMore,
  Refresh,
  Science,
} from '@mui/icons-material';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { enhancedNotificationService } from '@/services/enhanced-notifications.service';
import toast from 'react-hot-toast';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  categories: {
    system: boolean;
    membership: boolean;
    payment: boolean;
    event: boolean;
    general: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export const EnhancedNotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    isSupported: pushSupported,
    isRegistering,
    requestPermission,
    isEnabled: pushEnabled
  } = usePushNotifications();

  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    categories: {
      system: true,
      membership: true,
      payment: true,
      event: true,
      general: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true,
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    frequency: 'immediate',
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Cargar configuración del usuario
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;

      try {
        const userSettings = await enhancedNotificationService.getUserSettings(user.uid);
        if (userSettings) {
          setSettings({
            emailNotifications: userSettings.emailNotifications,
            pushNotifications: userSettings.pushNotifications,
            smsNotifications: userSettings.smsNotifications,
            categories: userSettings.categories,
            priorities: userSettings.priorities,
            quietHours: userSettings.quietHours,
            frequency: userSettings.frequency,
          });
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        toast.error('Error al cargar la configuración');
      }
    };

    loadSettings();
  }, [user?.uid]);

  // Guardar configuración
  const saveSettings = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const settingsRef = doc(db, 'notificationSettings', user.uid);
      await updateDoc(settingsRef, {
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      });

      setLastSaved(new Date());
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  // Enviar notificación de prueba
  const sendTestNotification = async () => {
    if (!user?.uid) return;

    setTesting(true);
    try {
      const testNotification = {
        title: '🧪 Notificación de Prueba',
        message: 'Esta es una notificación de prueba para verificar que tu configuración funciona correctamente.',
        type: 'info' as const,
        priority: 'medium' as const,
        category: 'system' as const,
      };

      await enhancedNotificationService.sendNotificationToUser(
        `test_${Date.now()}`,
        user.uid,
        testNotification
      );

      toast.success('Notificación de prueba enviada');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error al enviar la notificación de prueba');
    } finally {
      setTesting(false);
    }
  };

  const handleChannelChange = (channel: keyof Pick<NotificationSettings, 'emailNotifications' | 'pushNotifications' | 'smsNotifications'>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [channel]: event.target.checked
    }));
  };

  const handleCategoryChange = (category: keyof NotificationSettings['categories']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: event.target.checked
      }
    }));
  };

  const handlePriorityChange = (priority: keyof NotificationSettings['priorities']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      priorities: {
        ...prev.priorities,
        [priority]: event.target.checked
      }
    }));
  };

  const channelConfigs = [
    {
      key: 'emailNotifications' as const,
      label: 'Notificaciones por Email',
      description: 'Recibe notificaciones en tu correo electrónico',
      icon: <Email />,
      color: '#3b82f6',
      enabled: settings.emailNotifications,
      status: 'Configurado',
    },
    {
      key: 'pushNotifications' as const,
      label: 'Notificaciones Push',
      description: 'Recibe notificaciones en tiempo real en tu navegador',
      icon: <PhoneAndroid />,
      color: '#8b5cf6',
      enabled: settings.pushNotifications && pushEnabled,
      status: pushEnabled ? 'Activo' : pushSupported ? 'Disponible' : 'No soportado',
    },
    {
      key: 'smsNotifications' as const,
      label: 'Notificaciones por SMS',
      description: 'Recibe notificaciones importantes por mensaje de texto',
      icon: <Sms />,
      color: '#10b981',
      enabled: settings.smsNotifications,
      status: 'Configurado',
    },
  ];

  const categoryConfigs = [
    { key: 'system' as const, label: 'Sistema', description: 'Actualizaciones y mantenimiento' },
    { key: 'membership' as const, label: 'Socios', description: 'Actividad de socios y registros' },
    { key: 'payment' as const, label: 'Pagos', description: 'Pagos y facturación' },
    { key: 'event' as const, label: 'Eventos', description: 'Eventos y actividades' },
    { key: 'general' as const, label: 'General', description: 'Comunicaciones generales' },
  ];

  const priorityConfigs = [
    { key: 'low' as const, label: 'Baja', description: 'Información no crítica', color: '#6b7280' },
    { key: 'medium' as const, label: 'Media', description: 'Información importante', color: '#3b82f6' },
    { key: 'high' as const, label: 'Alta', description: 'Requiere atención', color: '#f59e0b' },
    { key: 'urgent' as const, label: 'Urgente', description: 'Atención inmediata', color: '#ef4444' },
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: '#6366f1', width: 48, height: 48 }}>
            <Notifications />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Configuración de Notificaciones
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Personaliza cómo y cuándo recibir notificaciones
            </Typography>
          </Box>
        </Box>
        {lastSaved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuración guardada el {lastSaved.toLocaleString()}
          </Alert>
        )}
      </Box>

      {/* Canales de Notificación */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            Canales de Notificación
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            '& > *': {
              flex: '1 1 280px',
              minWidth: '280px'
            }
          }}>
            {channelConfigs.map((channel) => (
              <Card
                key={channel.key}
                variant="outlined"
                sx={{
                  border: channel.enabled ? `2px solid ${channel.color}` : '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: channel.color, width: 40, height: 40 }}>
                      {channel.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {channel.label}
                      </Typography>
                      <Chip
                        label={channel.status}
                        size="small"
                        color={channel.enabled ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    {channel.description}
                  </Typography>
                  {channel.key === 'pushNotifications' && !pushSupported ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No soportado en este navegador
                    </Alert>
                  ) : channel.key === 'pushNotifications' && pushSupported && !pushEnabled ? (
                    <Button
                      variant="outlined"
                      onClick={requestPermission}
                      disabled={isRegistering}
                      startIcon={isRegistering ? <LinearProgress /> : <PhoneAndroid />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {isRegistering ? 'Configurando...' : 'Activar Push'}
                    </Button>
                  ) : (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={channel.enabled}
                          onChange={handleChannelChange(channel.key)}
                          color="primary"
                        />
                      }
                      label={channel.enabled ? 'Activado' : 'Desactivado'}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Configuración Avanzada */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Configuración Avanzada
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ p: 2 }}>
            {/* Categorías */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Categorías de Notificaciones
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              mb: 3,
              '& > *': {
                flex: '1 1 200px',
                minWidth: '200px'
              }
            }}>
              {categoryConfigs.map((category) => (
                <FormControlLabel
                  key={category.key}
                  control={
                    <Switch
                      checked={settings.categories[category.key]}
                      onChange={handleCategoryChange(category.key)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {category.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {category.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Prioridades */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Niveles de Prioridad
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              mb: 3,
              '& > *': {
                flex: '1 1 200px',
                minWidth: '200px'
              }
            }}>
              {priorityConfigs.map((priority) => (
                <FormControlLabel
                  key={priority.key}
                  control={
                    <Switch
                      checked={settings.priorities[priority.key]}
                      onChange={handlePriorityChange(priority.key)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: priority.color
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {priority.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {priority.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Horarios de Silencio */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeOff />
              Horarios de Silencio
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.quietHours.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: e.target.checked }
                  }))}
                />
              }
              label="Activar horarios de silencio"
              sx={{ mb: 2 }}
            />
            {settings.quietHours.enabled && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  type="time"
                  label="Inicio"
                  value={settings.quietHours.start}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 150px', minWidth: '150px' }}
                />
                <TextField
                  type="time"
                  label="Fin"
                  value={settings.quietHours.end}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value }
                  }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 150px', minWidth: '150px' }}
                />
              </Box>
            )}

            {/* Frecuencia */}
            <TextField
              select
              label="Frecuencia de Notificaciones"
              value={settings.frequency}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                frequency: e.target.value as NotificationSettings['frequency']
              }))}
              fullWidth
              sx={{ mb: 3 }}
            >
              <MenuItem value="immediate">Inmediata</MenuItem>
              <MenuItem value="hourly">Cada hora</MenuItem>
              <MenuItem value="daily">Diaria</MenuItem>
              <MenuItem value="weekly">Semanal</MenuItem>
            </TextField>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Acciones */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mt: 4, 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <Button
          variant="outlined"
          onClick={sendTestNotification}
          disabled={testing || !user?.uid}
          startIcon={testing ? <LinearProgress /> : <Science />}
        >
          {testing ? 'Enviando...' : 'Enviar Prueba'}
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            startIcon={<Refresh />}
          >
            Recargar
          </Button>
          <Button
            variant="contained"
            onClick={saveSettings}
            disabled={loading}
            startIcon={loading ? <LinearProgress /> : <CheckCircle />}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};