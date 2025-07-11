'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Button,
  TextField,
  Alert,
  Chip,
  Avatar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
} from '@mui/material';
import {
  Notifications,
  Email,
  Sms,
  PhoneAndroid,
  Schedule,
  VolumeOff,
  Settings,
  Save,
  ExpandMore,
  NotificationsActive,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { NotificationSettings } from '@/types/notification';

interface NotificationSettingsProps {
  userId: string;
  onSettingsChange?: (settings: NotificationSettings) => void;
}

const defaultSettings: NotificationSettings = {
  userId: '',
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  categories: {
    system: true,
    membership: true,
    payment: true,
    event: true,
    general: true
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  frequency: 'immediate',
  updatedAt: new Date()
};

export const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
  userId,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testNotification, setTestNotification] = useState(false);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // This would typically load from your API
        // For now, we'll use default settings
        setSettings({ ...defaultSettings, userId });
        setLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Error al cargar configuración');
        setLoading(false);
      }
    };

    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const handleSettingChange = (
    section: keyof NotificationSettings,
    key: string,
    value: boolean | string
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section], [key]: value }
        : value,
      updatedAt: new Date()
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would save to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success('Configuración guardada exitosamente');
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestNotification(true);
    try {
      // Here you would send a test notification
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('Notificación de prueba enviada');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Error al enviar notificación de prueba');
    } finally {
      setTestNotification(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  const categoryLabels = {
    system: 'Sistema',
    membership: 'Membresía',
    payment: 'Pagos',
    event: 'Eventos',
    general: 'General'
  };

  const priorityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };

  const frequencyOptions = [
    { value: 'immediate', label: 'Inmediata' },
    { value: 'hourly', label: 'Cada hora' },
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' }
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <NotificationsActive sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Configuración de Notificaciones
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Personaliza cómo y cuándo quieres recibir notificaciones
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          onClick={handleTestNotification}
          disabled={testNotification}
          startIcon={<Notifications />}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          {testNotification ? 'Enviando...' : 'Probar Notificación'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          startIcon={<Save />}
          variant="contained"
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Channel Settings */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #f1f5f9', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
              <Settings />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Canales de Notificación
            </Typography>
          </Box>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', '', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ color: '#6366f1' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Notificaciones por Email
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Recibe notificaciones en tu correo electrónico
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', '', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b5cf6' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneAndroid sx={{ color: '#8b5cf6' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Notificaciones Push
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Recibe notificaciones en tu dispositivo
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('smsNotifications', '', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#f59e0b' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sms sx={{ color: '#f59e0b' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Notificaciones SMS
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Recibe notificaciones por mensaje de texto
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* Category Preferences */}
      <Accordion
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid #f1f5f9',
          borderRadius: 4,
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#ec4899', 0.1), color: '#ec4899' }}>
              <Notifications />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Categorías de Notificación
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Elige qué tipos de notificaciones quieres recibir
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, pt: 0 }}>
          <FormGroup>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={settings.categories[key as keyof typeof settings.categories]}
                    onChange={(e) => handleSettingChange('categories', key, e.target.checked)}
                  />
                }
                label={label}
                sx={{ mb: 1 }}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Priority Preferences */}
      <Accordion
        elevation={0}
        sx={{
          mb: 3,
          border: '1px solid #f1f5f9',
          borderRadius: 4,
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
              <NotificationsActive />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Niveles de Prioridad
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Configura qué prioridades de notificación recibir
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, pt: 0 }}>
          <FormGroup>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={settings.priorities[key as keyof typeof settings.priorities]}
                    onChange={(e) => handleSettingChange('priorities', key, e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={label}
                      size="small"
                      sx={{
                        bgcolor: key === 'urgent' ? '#ef4444' : key === 'high' ? '#f59e0b' : key === 'medium' ? '#6366f1' : '#64748b',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                }
                sx={{ mb: 1 }}
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* Quiet Hours */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #f1f5f9', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#64748b', 0.1), color: '#64748b' }}>
              <VolumeOff />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Horario de Silencio
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHours.enabled}
                onChange={(e) => handleSettingChange('quietHours', 'enabled', e.target.checked)}
              />
            }
            label="Activar horario de silencio"
            sx={{ mb: 3 }}
          />

          {settings.quietHours.enabled && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Hora de inicio"
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => handleSettingChange('quietHours', 'start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                label="Hora de fin"
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => handleSettingChange('quietHours', 'end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
          )}

          {settings.quietHours.enabled && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 3 }}>
              Durante el horario de silencio, solo recibirás notificaciones urgentes.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Frequency Settings */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid #f1f5f9', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
              <Schedule />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Frecuencia de Notificaciones
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Frecuencia</InputLabel>
            <Select
              value={settings.frequency}
              onChange={(e) => handleSettingChange('frequency', '', e.target.value)}
              sx={{ borderRadius: 3 }}
            >
              {frequencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          onClick={handleSave}
          disabled={saving}
          startIcon={<Save />}
          variant="contained"
          size="large"
          sx={{
            borderRadius: 4,
            px: 6,
            py: 2,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          {saving ? 'Guardando Configuración...' : 'Guardar Configuración'}
        </Button>
      </Box>
    </Box>
  );
};
