'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Avatar,
  IconButton,
  alpha,
  Divider,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  LinearProgress,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications,
  Add,
  MoreVert,
  CheckCircle,
  Archive,
  Delete,
  SelectAll,
  MarkEmailRead,
  Refresh,
  Settings,
  TrendingUp,
  NotificationsActive,
  VolumeUp,
  VolumeOff,
  FilterList,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { NotificationFilters } from './NotificationFilters';
import { CreateNotificationDialog } from './CreateNotificationDialog';
import { RealTimeNotifications } from './RealTimeNotifications';
import { NotificationFormData } from '@/types/notification';

interface NotificationsCenterProps {
  loading?: boolean;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  loading: externalLoading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    notifications,
    allNotifications,
    loading,
    error,
    stats,
    filters,
    newNotificationCount,
    setFilters,
    createNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    bulkAction,
    clearNewNotificationCount,
    refreshStats,
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  // Clear new notification count when user interacts
  useEffect(() => {
    if (selectedNotifications.length > 0 || createDialogOpen) {
      clearNewNotificationCount();
    }
  }, [selectedNotifications, createDialogOpen, clearNewNotificationCount]);

  const handleSelectNotification = (id: string, selected: boolean) => {
    setSelectedNotifications(prev => 
      selected 
        ? [...prev, id]
        : prev.filter(notificationId => notificationId !== id)
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'archive' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    setActionLoading(true);
    try {
      await bulkAction(selectedNotifications, action);
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notificaciones procesadas`);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Error al procesar las notificaciones');
    } finally {
      setActionLoading(false);
      setBulkMenuAnchor(null);
    }
  };

  const handleCreateNotification = async (data: NotificationFormData) => {
    setActionLoading(true);
    try {
      await createNotification(data);
      setCreateDialogOpen(false);
      toast.success('Notificación creada exitosamente');
    } catch (error) {
      console.error('Create notification error:', error);
      toast.error('Error al crear la notificación');
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await markAllAsRead();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error('Error al marcar como leídas');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = (url: string) => {
    window.open(url, '_blank');
  };

  const clearFilters = () => {
    setFilters({});
    toast.success('Filtros limpiados');
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      await refreshStats();
      toast.success('Notificaciones actualizadas');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setActionLoading(false);
    }
  };

  // Enhanced stats with trends
  const enhancedStats = useMemo(() => {
    const total = stats.total;
    const unread = stats.unread;
    const read = stats.read;
    const archived = stats.archived;
    
    // Calculate percentages
    const unreadPercentage = total > 0 ? Math.round((unread / total) * 100) : 0;
    const readPercentage = total > 0 ? Math.round((read / total) * 100) : 0;
    
    return {
      total: { value: total, trend: '+12%', color: '#64748b' },
      unread: { value: unread, trend: unread > 0 ? `${unreadPercentage}%` : 'Al día', color: '#ef4444' },
      read: { value: read, trend: `${readPercentage}%`, color: '#10b981' },
      archived: { value: archived, trend: 'Estable', color: '#f59e0b' },
    };
  }, [stats]);

  const isLoading = loading || externalLoading || actionLoading;

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            border: '1px solid #fee2e2',
            borderRadius: 4,
            bgcolor: '#fef2f2',
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: alpha('#ef4444', 0.1),
              color: '#ef4444',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Notifications sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#dc2626', mb: 2 }}>
            Error al cargar notificaciones
          </Typography>
          <Typography variant="body1" sx={{ color: '#7f1d1d', mb: 4 }}>
            {error}
          </Typography>
          <Button
            onClick={handleRefresh}
            variant="contained"
            startIcon={<Refresh />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            Reintentar
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ mb: { xs: 4, md: 6 } }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: { xs: 2, md: 3 }, 
            mb: { xs: 3, md: 4 } 
          }}>
            <Badge
              badgeContent={newNotificationCount}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  animation: newNotificationCount > 0 ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                  },
                },
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  boxShadow: '0 12px 40px rgba(236, 72, 153, 0.3)',
                }}
              >
                <NotificationsActive sx={{ fontSize: { xs: 28, md: 32 } }} />
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 900, 
                  color: '#0f172a', 
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                  lineHeight: 1.2,
                }}
              >
                Centro de Notificaciones
                {isLoading && (
                  <LinearProgress
                    sx={{
                      mt: 1,
                      borderRadius: 2,
                      height: 4,
                      bgcolor: alpha('#ec4899', 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#ec4899',
                      }
                    }}
                  />
                )}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#64748b', 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Gestiona todas las comunicaciones y alertas del sistema
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}>
              {!isMobile && (
                <>
                  <Tooltip title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}>
                    <IconButton
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      sx={{
                        color: soundEnabled ? '#10b981' : '#94a3b8',
                        bgcolor: alpha(soundEnabled ? '#10b981' : '#94a3b8', 0.1),
                      }}
                    >
                      {soundEnabled ? <VolumeUp /> : <VolumeOff />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Actualizar">
                    <IconButton
                      onClick={handleRefresh}
                      disabled={isLoading}
                      sx={{
                        color: '#6366f1',
                        bgcolor: alpha('#6366f1', 0.1),
                        '&:hover': {
                          bgcolor: alpha('#6366f1', 0.2),
                        }
                      }}
                    >
                      <Refresh sx={{ 
                        animation: isLoading ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        }
                      }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Filtros">
                    <IconButton
                      onClick={() => setShowFilters(!showFilters)}
                      sx={{
                        color: showFilters ? '#ec4899' : '#94a3b8',
                        bgcolor: alpha(showFilters ? '#ec4899' : '#94a3b8', 0.1),
                      }}
                    >
                      <FilterList />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="contained"
                startIcon={<Add />}
                size={isMobile ? "medium" : "large"}
                sx={{
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 3, md: 4 },
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(236, 72, 153, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isMobile ? 'Nueva' : 'Nueva Notificación'}
              </Button>
            </Box>
          </Box>

          {/* Enhanced Stats Cards - Using CSS Grid instead of Material-UI Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
              },
              gap: { xs: 2, md: 3 },
              mb: { xs: 3, md: 4 },
            }}
          >
            {[
              { 
                key: 'total',
                label: 'Total', 
                value: enhancedStats.total.value, 
                color: enhancedStats.total.color,
                icon: <Notifications />,
                trend: enhancedStats.total.trend,
                gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              },
              { 
                key: 'unread',
                label: 'No leídas', 
                value: enhancedStats.unread.value, 
                color: enhancedStats.unread.color,
                icon: <NotificationsActive />,
                trend: enhancedStats.unread.trend,
                gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              },
              { 
                key: 'read',
                label: 'Leídas', 
                value: enhancedStats.read.value, 
                color: enhancedStats.read.color,
                icon: <CheckCircle />,
                trend: enhancedStats.read.trend,
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              },
              { 
                key: 'archived',
                label: 'Archivadas', 
                value: enhancedStats.archived.value, 
                color: enhancedStats.archived.color,
                icon: <Archive />,
                trend: enhancedStats.archived.trend,
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              },
            ].map((stat, index) => (
              <Box
                key={stat.key}
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 4 },
                    border: '1px solid #f1f5f9',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    '&:hover': {
                      borderColor: alpha(stat.color, 0.3),
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(stat.color, 0.15)}`,
                    }
                  }}
                >
                  {/* Background gradient */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                      background: `radial-gradient(circle, ${alpha(stat.color, 0.1)} 0%, transparent 70%)`,
                    }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: { xs: 1.5, md: 2 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 },
                  }}>
                    <Avatar
                      sx={{
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        background: stat.gradient,
                        color: 'white',
                        order: { xs: 2, sm: 1 },
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    
                    <Box sx={{ textAlign: { xs: 'center', sm: 'right' }, order: { xs: 1, sm: 2 } }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 900,
                          color: stat.color,
                          lineHeight: 1,
                          fontSize: { xs: '1.75rem', md: '2.5rem' },
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#10b981',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          justifyContent: { xs: 'center', sm: 'flex-end' },
                          fontSize: { xs: '0.7rem', md: '0.75rem' },
                        }}
                      >
                        <TrendingUp sx={{ fontSize: { xs: 10, md: 12 } }} />
                        {stat.trend}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#64748b',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      textAlign: { xs: 'center', sm: 'left' },
                      fontSize: { xs: '0.7rem', md: '0.75rem' },
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Mobile Controls */}
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterList />}
              variant={showFilters ? "contained" : "outlined"}
              size="small"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Filtros
            </Button>
            <Button
              onClick={handleRefresh}
              startIcon={<Refresh />}
              variant="outlined"
              size="small"
              disabled={isLoading}
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Actualizar
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              startIcon={soundEnabled ? <VolumeUp /> : <VolumeOff />}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                color: soundEnabled ? '#10b981' : '#94a3b8',
              }}
            >
              {soundEnabled ? 'Sonido' : 'Silencio'}
            </Button>
          </Box>
        )}

        {/* Filters */}
        {(showFilters || !isMobile) && (
          <NotificationFilters
            filters={{
              ...filters,
              dateRange: filters.dateRange
                ? { from: filters.dateRange.start, to: filters.dateRange.end }
                : undefined
            }}
            onFiltersChange={(newFilters) => {
              setFilters({
                ...newFilters,
                dateRange: newFilters.dateRange
                  ? { start: newFilters.dateRange.from, end: newFilters.dateRange.to }
                  : undefined
              });
            }}
            onClearFilters={clearFilters}
            loading={isLoading}
          />
        )}

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedNotifications.length > 0 && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  mb: 3,
                  border: '2px solid #6366f1',
                  borderRadius: 4,
                  bgcolor: alpha('#6366f1', 0.02),
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' }, 
                  justifyContent: 'space-between',
                  gap: 2,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={selectedNotifications.length === notifications.length}
                      indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < notifications.length}
                      onChange={handleSelectAll}
                      sx={{ color: '#6366f1' }}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {selectedNotifications.length} notificación{selectedNotifications.length > 1 ? 'es' : ''} seleccionada{selectedNotifications.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    flexWrap: 'wrap',
                    width: { xs: '100%', sm: 'auto' },
                  }}>
                    <Button
                      onClick={() => handleBulkAction('read')}
                      startIcon={<CheckCircle />}
                      size="small"
                      disabled={actionLoading}
                      sx={{ 
                        color: '#10b981',
                        '&:hover': { bgcolor: alpha('#10b981', 0.1) },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Marcar leídas
                    </Button>
                    <Button
                      onClick={() => handleBulkAction('archive')}
                      startIcon={<Archive />}
                      size="small"
                      disabled={actionLoading}
                      sx={{ 
                        color: '#f59e0b',
                        '&:hover': { bgcolor: alpha('#f59e0b', 0.1) },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Archivar
                    </Button>
                    <Button
                      onClick={() => handleBulkAction('delete')}
                      startIcon={<Delete />}
                      size="small"
                      disabled={actionLoading}
                      sx={{ 
                        color: '#ef4444',
                        '&:hover': { bgcolor: alpha('#ef4444', 0.1) },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Eliminar
                    </Button>
                    <IconButton
                      onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                      size="small"
                      sx={{ color: '#64748b' }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between', 
          mb: 3,
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < notifications.length}
                  onChange={handleSelectAll}
                />
              }
              label="Seleccionar todo"
              sx={{ color: '#64748b' }}
            />
            
            {stats.unread > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                startIcon={<MarkEmailRead />}
                size="small"
                disabled={actionLoading}
                sx={{
                  color: '#6366f1',
                  '&:hover': {
                    bgcolor: alpha('#6366f1', 0.1),
                  },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Marcar todas como leídas ({stats.unread})
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {notifications.length} de {stats.total} notificaciones
            </Typography>
            
            {!isMobile && (
              <Tooltip title="Configuración">
                <IconButton
                  size="small"
                  sx={{
                    color: '#64748b',
                    '&:hover': {
                      bgcolor: alpha('#6366f1', 0.1),
                      color: '#6366f1',
                    }
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Notifications List */}
        <Box>
          {isLoading && notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  border: '4px solid #f1f5f9',
                  borderRadius: '50%',
                  borderTopColor: '#6366f1',
                  animation: 'spin 1s linear infinite',
                  mx: 'auto',
                  mb: 3,
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                Cargando notificaciones...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 6, md: 8 },
                textAlign: 'center',
                border: '1px solid #f1f5f9',
                borderRadius: 4,
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  bgcolor: alpha('#ec4899', 0.1),
                  color: '#ec4899',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Notifications sx={{ fontSize: { xs: 30, md: 40 } }} />
              </Avatar>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b', 
                  mb: 2,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                No hay notificaciones
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#64748b', 
                  mb: 4,
                  fontSize: { xs: '0.875rem', md: '1rem' },
                }}
              >
                No se encontraron notificaciones que coincidan con los filtros aplicados.
              </Typography>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="contained"
                startIcon={<Add />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                }}
              >
                Crear primera notificación
              </Button>
            </Paper>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onMarkAsUnread={markAsUnread}
                  onArchive={archiveNotification}
                  onDelete={deleteNotification}
                  onAction={handleAction}
                  selected={selectedNotifications.includes(notification.id)}
                  onSelect={handleSelectNotification}
                />
              ))}
            </AnimatePresence>
          )}
        </Box>

        {/* Bulk Actions Menu */}
        <Menu
          anchorEl={bulkMenuAnchor}
          open={Boolean(bulkMenuAnchor)}
          onClose={() => setBulkMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              minWidth: 200,
            }
          }}
        >
          <MenuItem onClick={() => handleBulkAction('unread')}>
            <Badge sx={{ mr: 2 }} />
            Marcar como no leídas
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setSelectedNotifications([])}>
            <SelectAll sx={{ mr: 2, transform: 'scaleX(-1)' }} />
            Deseleccionar todo
          </MenuItem>
        </Menu>

        {/* Create Notification Dialog */}
        <CreateNotificationDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSave={handleCreateNotification}
          loading={actionLoading}
        />
      </Container>

      {/* Floating Action Button */}
      <Zoom in={!createDialogOpen}>
        <Fab
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
            zIndex: 1000,
          }}
        >
          <Add />
        </Fab>
      </Zoom>

      {/* Real-time Notifications */}
      <RealTimeNotifications
        notifications={allNotifications.filter(n => n.status === 'unread')}
        onNotificationClick={(notification) => {
          markAsRead(notification.id);
          if (notification.actionUrl) {
            handleAction(notification.actionUrl);
          }
        }}
        onNotificationDismiss={(id) => {
          markAsRead(id);
        }}
        maxVisible={3}
        position="top-right"
      />
    </>
  );
};