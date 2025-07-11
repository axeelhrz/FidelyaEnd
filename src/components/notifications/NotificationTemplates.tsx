'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Preview,
  Save,
  Palette,
  Email,
  Sms,
  PhoneAndroid,
  ExpandMore,
  ContentCopy,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { NotificationTemplate, NotificationType, NotificationPriority, NotificationCategory } from '@/types/notification';

interface NotificationTemplatesProps {
  onTemplateSelect?: (template: NotificationTemplate) => void;
}

const defaultTemplates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'Bienvenida',
    title: 'Bienvenido a {{app_name}}',
    message: 'Hola {{user_name}}, gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte con nosotros.',
    type: 'success',
    priority: 'medium',
    category: 'membership',
    variables: ['app_name', 'user_name'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'payment_reminder',
    name: 'Recordatorio de Pago',
    title: 'Recordatorio: Pago pendiente',
    message: 'Hola {{user_name}}, tienes un pago pendiente de {{amount}} que vence el {{due_date}}. Por favor, realiza el pago para evitar interrupciones.',
    type: 'warning',
    priority: 'high',
    category: 'payment',
    variables: ['user_name', 'amount', 'due_date'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'event_announcement',
    name: 'Anuncio de Evento',
    title: 'Nuevo evento: {{event_name}}',
    message: 'Te invitamos a participar en {{event_name}} que se realizará el {{event_date}} en {{event_location}}. ¡No te lo pierdas!',
    type: 'announcement',
    priority: 'medium',
    category: 'event',
    variables: ['event_name', 'event_date', 'event_location'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'system_maintenance',
    name: 'Mantenimiento del Sistema',
    title: 'Mantenimiento programado',
    message: 'El sistema estará en mantenimiento el {{maintenance_date}} de {{start_time}} a {{end_time}}. Durante este tiempo, algunos servicios podrían no estar disponibles.',
    type: 'info',
    priority: 'high',
    category: 'system',
    variables: ['maintenance_date', 'start_time', 'end_time'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const NotificationTemplates: React.FC<NotificationTemplatesProps> = ({
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTemplateId, setMenuTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info' as NotificationType,
    priority: 'medium' as NotificationPriority,
    category: 'general' as NotificationCategory,
    variables: [] as string[],
    isActive: true,
  });

  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEditForm({
      name: '',
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      category: 'general',
      variables: [],
      isActive: true,
    });
    setEditDialogOpen(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority,
      category: template.category,
      variables: template.variables || [],
      isActive: template.isActive,
    });
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar template');
    } finally {
      setLoading(false);
      setMenuAnchor(null);
    }
  };

  const handleDuplicateTemplate = (template: NotificationTemplate) => {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `${template.id}_copy_${Date.now()}`,
      name: `${template.name} (Copia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template duplicado exitosamente');
    setMenuAnchor(null);
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      
      // Extract variables from title and message
      const extractedVariables = extractVariables(editForm.title + ' ' + editForm.message);
      
      const templateData: NotificationTemplate = {
        id: selectedTemplate?.id || `template_${Date.now()}`,
        name: editForm.name,
        title: editForm.title,
        message: editForm.message,
        type: editForm.type,
        priority: editForm.priority,
        category: editForm.category,
        variables: extractedVariables,
        isActive: editForm.isActive,
        createdAt: selectedTemplate?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (selectedTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? templateData : t));
        toast.success('Template actualizado exitosamente');
      } else {
        // Create new template
        setTemplates(prev => [...prev, templateData]);
        toast.success('Template creado exitosamente');
      }

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar template');
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize preview data with sample values
    const sampleData: Record<string, string> = {};
    template.variables?.forEach(variable => {
      switch (variable) {
        case 'user_name':
          sampleData[variable] = 'Juan Pérez';
          break;
        case 'app_name':
          sampleData[variable] = 'Fidelita';
          break;
        case 'amount':
          sampleData[variable] = '$150.00';
          break;
        case 'due_date':
          sampleData[variable] = '15 de Enero, 2024';
          break;
        case 'event_name':
          sampleData[variable] = 'Reunión Anual de Socios';
          break;
        case 'event_date':
          sampleData[variable] = '20 de Febrero, 2024';
          break;
        case 'event_location':
          sampleData[variable] = 'Centro de Convenciones';
          break;
        case 'maintenance_date':
          sampleData[variable] = '25 de Enero, 2024';
          break;
        case 'start_time':
          sampleData[variable] = '02:00 AM';
          break;
        case 'end_time':
          sampleData[variable] = '06:00 AM';
          break;
        default:
          sampleData[variable] = `[${variable}]`;
      }
    });
    
    setPreviewData(sampleData);
    setPreviewDialogOpen(true);
    setMenuAnchor(null);
  };

  const renderPreviewText = (text: string, data: Record<string, string>): string => {
    let result = text;
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const getTypeColor = (type: NotificationType) => {
    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      announcement: '#8b5cf6',
    };
    return colors[type];
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: '#6b7280',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444',
    };
    return colors[priority];
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Templates de Notificación
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Crea y gestiona templates reutilizables para tus notificaciones
          </Typography>
        </Box>
        
        <Button
          onClick={handleCreateTemplate}
          variant="contained"
          startIcon={<Add />}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          Nuevo Template
        </Button>
      </Box>

      {/* Templates Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 3,
        '& > *': {
          flex: '1 1 100%',
          '@media (min-width: 768px)': {
            flex: '1 1 calc(50% - 12px)',
          },
          '@media (min-width: 1200px)': {
            flex: '1 1 calc(33.333% - 16px)',
          }
        }
      }}>
        {templates.map((template) => (
          <Card
            key={template.id}
            elevation={0}
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: 4,
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: alpha(getTypeColor(template.type), 0.3),
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(getTypeColor(template.type), 0.15)}`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: alpha(getTypeColor(template.type), 0.1),
                      color: getTypeColor(template.type),
                    }}
                  >
                    <Palette />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {template.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={template.type}
                        size="small"
                        sx={{
                          bgcolor: alpha(getTypeColor(template.type), 0.1),
                          color: getTypeColor(template.type),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                      <Chip
                        label={template.priority}
                        size="small"
                        sx={{
                          bgcolor: alpha(getPriorityColor(template.priority), 0.1),
                          color: getPriorityColor(template.priority),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                  
                <IconButton
                  onClick={(e) => {
                    setMenuAnchor(e.currentTarget);
                    setMenuTemplateId(template.id);
                  }}
                  size="small"
                  sx={{ color: '#64748b' }}
                >
                  <MoreVert />
                </IconButton>
              </Box>

              {/* Content Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  {template.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {template.message}
                </Typography>
              </Box>

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
                    Variables:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.variables.slice(0, 3).map((variable) => (
                      <Chip
                        key={variable}
                        label={`{{${variable}}}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          borderColor: alpha('#6366f1', 0.3),
                          color: '#6366f1',
                        }}
                      />
                    ))}
                    {template.variables.length > 3 && (
                      <Chip
                        label={`+${template.variables.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          borderColor: alpha('#64748b', 0.3),
                          color: '#64748b',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => handlePreviewTemplate(template)}
                  size="small"
                  startIcon={<Preview />}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    color: '#6366f1',
                    '&:hover': { bgcolor: alpha('#6366f1', 0.1) }
                  }}
                >
                  Vista Previa
                </Button>
                <Button
                  onClick={() => onTemplateSelect?.(template)}
                  size="small"
                  variant="contained"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    },
                  }}
                >
                  Usar
                </Button>
              </Box>

              {/* Status Indicator */}
              <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: template.isActive ? '#10b981' : '#ef4444',
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === menuTemplateId);
          if (template) handlePreviewTemplate(template);
        }}>
          <Preview sx={{ mr: 2 }} />
          Vista Previa
        </MenuItem>
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === menuTemplateId);
          if (template) handleEditTemplate(template);
        }}>
          <Edit sx={{ mr: 2 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === menuTemplateId);
          if (template) handleDuplicateTemplate(template);
        }}>
          <ContentCopy sx={{ mr: 2 }} />
          Duplicar
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (menuTemplateId) handleDeleteTemplate(menuTemplateId);
          }}
          sx={{ color: '#ef4444' }}
        >
          <Delete sx={{ mr: 2 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
              {selectedTemplate ? <Edit /> : <Add />}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedTemplate ? 'Editar Template' : 'Crear Template'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Basic Info */}
            <TextField
              fullWidth
              label="Nombre del Template"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Bienvenida, Recordatorio de Pago..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            {/* Type and Priority */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2,
              '& > *': {
                flex: '1 1 calc(33.333% - 8px)',
                minWidth: '150px',
              }
            }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as NotificationType }))}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="info">Información</MenuItem>
                  <MenuItem value="success">Éxito</MenuItem>
                  <MenuItem value="warning">Advertencia</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="announcement">Anuncio</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={editForm.priority}
                  onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as NotificationPriority }))}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={editForm.category}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as NotificationCategory }))}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="system">Sistema</MenuItem>
                  <MenuItem value="membership">Socios</MenuItem>
                  <MenuItem value="payment">Pagos</MenuItem>
                  <MenuItem value="event">Eventos</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Content */}
            <TextField
              fullWidth
              label="Título"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Usa {{variable}} para contenido dinámico"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Mensaje"
              value={editForm.message}
              onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Escribe tu mensaje aquí. Usa {{variable}} para contenido dinámico."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            {/* Variables Preview */}
            {extractVariables(editForm.title + ' ' + editForm.message).length > 0 && (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Variables detectadas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {extractVariables(editForm.title + ' ' + editForm.message).map((variable) => (
                    <Chip
                      key={variable}
                      label={`{{${variable}}}`}
                      size="small"
                      sx={{
                        bgcolor: alpha('#3b82f6', 0.1),
                        color: '#3b82f6',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {/* Active Status */}
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' },
                  }}
                />
              }
              label="Template activo"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!editForm.name || !editForm.title || !editForm.message || loading}
            startIcon={loading ? <Save /> : <Save />}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              },
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
              <Preview />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Vista Previa: {selectedTemplate?.name}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Variable Editor */}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Personalizar Variables
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: 2,
                      '& > *': {
                        flex: '1 1 calc(50% - 8px)',
                        minWidth: '200px',
                      }
                    }}>
                      {selectedTemplate.variables.map((variable) => (
                        <TextField
                          key={variable}
                          fullWidth
                          size="small"
                          label={variable}
                          value={previewData[variable] || ''}
                          onChange={(e) => setPreviewData(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Preview Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* App Notification Preview */}
                <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <PhoneAndroid sx={{ color: '#6366f1' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Notificación en App
                      </Typography>
                    </Box>
                    <Alert
                      severity={selectedTemplate.type === 'error' ? 'error' : selectedTemplate.type === 'warning' ? 'warning' : selectedTemplate.type === 'success' ? 'success' : 'info'}
                      sx={{ borderRadius: 2 }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {renderPreviewText(selectedTemplate.title, previewData)}
                      </Typography>
                      <Typography variant="body2">
                        {renderPreviewText(selectedTemplate.message, previewData)}
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Email Preview */}
                <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Email sx={{ color: '#10b981' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Email
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        p: 3,
                        bgcolor: '#fafafa',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
                        {renderPreviewText(selectedTemplate.title, previewData)}
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#374151' }}>
                        {renderPreviewText(selectedTemplate.message, previewData)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* SMS Preview */}
                <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Sms sx={{ color: '#f59e0b' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        SMS
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: '#f8fafc',
                        maxWidth: 300,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {renderPreviewText(selectedTemplate.title, previewData)}
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                        {renderPreviewText(selectedTemplate.message, previewData)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setPreviewDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              if (selectedTemplate) {
                onTemplateSelect?.(selectedTemplate);
                setPreviewDialogOpen(false);
              }
            }}
            variant="contained"
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            Usar Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};