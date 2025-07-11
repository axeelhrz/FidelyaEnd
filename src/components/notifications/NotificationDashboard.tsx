'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Button,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  alpha,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Send,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Refresh,
  PlayArrow,
  Stop,
  RestartAlt,
  TrendingUp,
  Speed,
  BugReport,
  Healing,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { notificationQueueService } from '@/services/notification-queue.service';

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
}

interface QueueHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

export const NotificationDashboard: React.FC = () => {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
    successRate: 0,
  });

  const [health, setHealth] = useState<QueueHealth>({
    status: 'healthy',
    issues: [],
    recommendations: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [queueStats, queueHealth] = await Promise.all([
        notificationQueueService.getQueueStats(),
        notificationQueueService.getQueueHealth(),
      ]);
      setStats(queueStats);
      setHealth(queueHealth);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartProcessing = () => {
    notificationQueueService.startProcessing();
    setIsProcessing(true);
    toast.success('Procesamiento de cola iniciado');
  };

  const handleStopProcessing = () => {
    notificationQueueService.stopProcessing();
    setIsProcessing(false);
    toast.success('Procesamiento de cola detenido');
  };

  const handleRetryAllFailed = async () => {
    try {
      setRetryingAll(true);
      const retriedCount = await notificationQueueService.retryAllFailedNotifications();
      toast.success(`${retriedCount} notificaciones reintentadas`);
      await loadData();
      setRetryDialogOpen(false);
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      toast.error('Error al reintentar notificaciones');
    } finally {
      setRetryingAll(false);
    }
  };

  const handleCleanupOld = async () => {
    try {
      const deletedCount = await notificationQueueService.cleanupOldNotifications(30);
      toast.success(`${deletedCount} notificaciones antiguas eliminadas`);
      await loadData();
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      toast.error('Error al limpiar notificaciones antiguas');
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Error />;
      default: return <BugReport />;
    }
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statsData = [
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: <Schedule />,
      color: '#f59e0b',
      trend: stats.pending > 50 ? 'high' : stats.pending > 20 ? 'medium' : 'low',
    },
    {
      title: 'Procesando',
      value: stats.processing,
      icon: <Send />,
      color: '#3b82f6',
      trend: stats.processing > 10 ? 'high' : 'normal',
    },
    {
      title: 'Completadas',
      value: stats.completed,
      icon: <CheckCircle />,
      color: '#10b981',
      trend: 'positive',
    },
    {
      title: 'Fallidas',
      value: stats.failed,
      icon: <Error />,
      color: '#ef4444',
      trend: stats.failed > 20 ? 'high' : stats.failed > 5 ? 'medium' : 'low',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
            Dashboard de Notificaciones
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Monitoreo en tiempo real del sistema de envío de notificaciones
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Actualizar datos">
            <IconButton
              onClick={loadData}
              disabled={refreshing}
              sx={{
                color: '#6366f1',
                bgcolor: alpha('#6366f1', 0.1),
                '&:hover': { bgcolor: alpha('#6366f1', 0.2) }
              }}
            >
              <Refresh sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
          <Button
            onClick={isProcessing ? handleStopProcessing : handleStartProcessing}
            variant="contained"
            startIcon={isProcessing ? <Stop /> : <PlayArrow />}
            sx={{
              borderRadius: 3,
              background: isProcessing
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: isProcessing
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            {isProcessing ? 'Detener Cola' : 'Iniciar Cola'}
          </Button>
        </Box>
      </Box>

      {/* Health Status Alert */}
      {health.status !== 'healthy' && (
        <Alert
          severity={health.status === 'critical' ? 'error' : 'warning'}
          sx={{ mb: 4, borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setHealthDialogOpen(true)}
            >
              Ver Detalles
            </Button>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Estado del Sistema: {health.status === 'critical' ? 'Crítico' : 'Advertencia'}
          </Typography>
          <Typography variant="body2">
            {health.issues.length} problema(s) detectado(s). Haz clic en &quot;Ver Detalles&quot; para más información.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 3,
        mb: 4,
        '& > *': {
          flex: '1 1 calc(50% - 12px)',
          minWidth: '200px',
          '@media (min-width: 900px)': {
            flex: '1 1 calc(25% - 18px)',
          }
        }
      }}>
        {statsData.map((stat, index) => (
          <Card
            key={index}
            elevation={0}
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: alpha(stat.color, 0.3),
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(stat.color, 0.15)}`,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Avatar>
                {stat.trend === 'high' && (
                  <Chip
                    icon={<TrendingUp />}
                    label="Alto"
                    size="small"
                    sx={{
                      bgcolor: alpha('#ef4444', 0.1),
                      color: '#ef4444',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 900, color: stat.color, mb: 1 }}>
                {stat.value.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                {stat.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Performance Metrics */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 3,
        mb: 4,
        '& > *': {
          flex: '1 1 100%',
          '@media (min-width: 768px)': {
            flex: '1 1 calc(50% - 12px)',
          }
        }
      }}>
        <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tasa de Éxito
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981' }}>
                {stats.successRate.toFixed(1)}%
              </Typography>
              <Chip
                label={stats.successRate >= 95 ? 'Excelente' : stats.successRate >= 80 ? 'Bueno' : 'Necesita Atención'}
                size="small"
                sx={{
                  bgcolor: alpha(stats.successRate >= 95 ? '#10b981' : stats.successRate >= 80 ? '#f59e0b' : '#ef4444', 0.1),
                  color: stats.successRate >= 95 ? '#10b981' : stats.successRate >= 80 ? '#f59e0b' : '#ef4444',
                  fontWeight: 600,
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.successRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha('#e5e7eb', 0.3),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: stats.successRate >= 95 ? '#10b981' : stats.successRate >= 80 ? '#f59e0b' : '#ef4444',
                }
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
              De {stats.totalProcessed.toLocaleString()} notificaciones procesadas
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
                <Speed />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tiempo Promedio de Procesamiento
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#6366f1', mb: 1 }}>
              {formatProcessingTime(stats.averageProcessingTime)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Tiempo desde cola hasta entrega
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* System Health */}
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4, mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: alpha(getHealthColor(health.status), 0.1), color: getHealthColor(health.status) }}>
                {getHealthIcon(health.status)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Estado del Sistema
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Monitoreo automático de la salud del sistema
                </Typography>
              </Box>
            </Box>
            <Chip
              label={health.status === 'healthy' ? 'Saludable' : health.status === 'warning' ? 'Advertencia' : 'Crítico'}
              sx={{
                bgcolor: alpha(getHealthColor(health.status), 0.1),
                color: getHealthColor(health.status),
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 2,
              }}
            />
          </Box>
          {health.issues.length > 0 && (
            <Alert severity={health.status === 'critical' ? 'error' : 'warning'} sx={{ borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Problemas Detectados:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {health.issues.slice(0, 3).map((issue, index) => (
                  <li key={index}>
                    <Typography variant="body2">{issue}</Typography>
                  </li>
                ))}
              </ul>
              {health.issues.length > 3 && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Y {health.issues.length - 3} problema(s) más...
                </Typography>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Acciones Rápidas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={() => setRetryDialogOpen(true)}
              disabled={stats.failed === 0}
              startIcon={<RestartAlt />}
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              Reintentar Fallidas ({stats.failed})
            </Button>
            <Button
              onClick={handleCleanupOld}
              startIcon={<Healing />}
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              Limpiar Antiguas
            </Button>
            <Button
              onClick={() => setHealthDialogOpen(true)}
              startIcon={<BugReport />}
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              Diagnóstico Completo
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Health Details Dialog */}
      <Dialog
        open={healthDialogOpen}
        onClose={() => setHealthDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha(getHealthColor(health.status), 0.1), color: getHealthColor(health.status) }}>
              {getHealthIcon(health.status)}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Diagnóstico del Sistema
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Estado Actual: {health.status === 'healthy' ? 'Saludable' : health.status === 'warning' ? 'Advertencia' : 'Crítico'}
            </Typography>
            {health.issues.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Problemas Detectados:
                </Typography>
                <List dense>
                  {health.issues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Error sx={{ color: '#ef4444' }} />
                      </ListItemIcon>
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            {health.recommendations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Recomendaciones:
                </Typography>
                <List dense>
                  {health.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Healing sx={{ color: '#10b981' }} />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setHealthDialogOpen(false)} sx={{ borderRadius: 3 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Retry Failed Dialog */}
      <Dialog
        open={retryDialogOpen}
        onClose={() => setRetryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
              <RestartAlt />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reintentar Notificaciones Fallidas
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            ¿Estás seguro de que quieres reintentar todas las {stats.failed} notificaciones fallidas?
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Esta acción restablecerá el contador de intentos y volverá a poner las notificaciones en la cola de procesamiento.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setRetryDialogOpen(false)}
            sx={{ borderRadius: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRetryAllFailed}
            disabled={retryingAll}
            variant="contained"
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              },
            }}
          >
            {retryingAll ? 'Reintentando...' : 'Reintentar Todas'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};