'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  alpha,
  Divider,
} from '@mui/material';
import {
  Email,
  Sms,
  PhoneAndroid,
  CheckCircle,
  Error,
  Schedule,
  Refresh,
  TrendingUp,
  Send,
} from '@mui/icons-material';
import { useNotifications } from '@/hooks/useNotifications';

interface DeliveryStatsProps {
  notificationId: string;
  onRefresh?: () => void;
}

interface DeliveryStatsData {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  byChannel: Record<string, number>;
}

export const DeliveryStats: React.FC<DeliveryStatsProps> = ({
  notificationId,
  onRefresh
}) => {
  const { getDeliveryStats } = useNotifications();
  const [stats, setStats] = useState<DeliveryStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const deliveryStats = await getDeliveryStats(notificationId);
      if (deliveryStats) {
        setStats(deliveryStats);
      }
    } catch (error) {
      console.error('Error loading delivery stats:', error);
    } finally {
      setLoading(false);
    }
  }, [getDeliveryStats, notificationId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    onRefresh?.();
  };

  useEffect(() => {
    if (notificationId) {
      loadStats();
    }
  }, [notificationId, loadStats]);

  if (loading) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
              <Send />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Estadísticas de Entrega
            </Typography>
          </Box>
          <LinearProgress sx={{ borderRadius: 2 }} />
          <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
            Cargando estadísticas...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No hay estadísticas de entrega disponibles
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0;
  const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
  const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;

  const channelIcons = {
    email: <Email />,
    sms: <Sms />,
    push: <PhoneAndroid />,
    app: <PhoneAndroid />
  };

  const channelColors = {
    email: '#6366f1',
    sms: '#f59e0b',
    push: '#8b5cf6',
    app: '#10b981'
  };

  const channelLabels = {
    email: 'Email',
    sms: 'SMS',
    push: 'Push',
    app: 'App'
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
              <Send />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Estadísticas de Entrega
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Estado actual del envío de notificaciones
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Actualizar estadísticas">
            <IconButton
              onClick={handleRefresh}
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
        </Box>

        {/* Overview Stats */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 3,
          mb: 4,
          '& > *': {
            flex: '1 1 calc(50% - 12px)',
            minWidth: '120px',
            '@media (min-width: 600px)': {
              flex: '1 1 calc(25% - 18px)',
            }
          }
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Total Enviados
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981', mb: 1 }}>
              {stats.sent}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Exitosos
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#6366f1', mb: 1 }}>
              {stats.delivered}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Entregados
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#ef4444', mb: 1 }}>
              {stats.failed}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Fallidos
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Success Rate */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Tasa de Éxito
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp sx={{ color: successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#ef4444', fontSize: 20 }} />
              <Typography variant="h6" sx={{ 
                fontWeight: 900, 
                color: successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#ef4444'
              }}>
                {successRate.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={successRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha('#e5e7eb', 0.3),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: successRate >= 80 ? '#10b981' : successRate >= 60 ? '#f59e0b' : '#ef4444',
              }
            }}
          />
        </Box>

        {/* Channel Breakdown */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
            Distribución por Canal
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 2,
            '& > *': {
              flex: '1 1 calc(50% - 8px)',
              minWidth: '140px',
              '@media (min-width: 600px)': {
                flex: '1 1 calc(25% - 12px)',
              }
            }
          }}>
            {Object.entries(stats.byChannel).map(([channel, count]) => (
              <Card
                key={channel}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid #f1f5f9',
                  borderRadius: 3,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: alpha(channelColors[channel as keyof typeof channelColors] || '#6366f1', 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 32px ${alpha(channelColors[channel as keyof typeof channelColors] || '#6366f1', 0.15)}`,
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: alpha(channelColors[channel as keyof typeof channelColors] || '#6366f1', 0.1),
                    color: channelColors[channel as keyof typeof channelColors] || '#6366f1',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {channelIcons[channel as keyof typeof channelIcons] || <Send />}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
                  {count}
                </Typography>
                
                <Typography variant="caption" sx={{ 
                  color: '#64748b', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {channelLabels[channel as keyof typeof channelLabels] || channel}
                </Typography>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Status Indicators */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<CheckCircle />}
            label={`${successRate.toFixed(1)}% Éxito`}
            size="small"
            sx={{
              bgcolor: alpha('#10b981', 0.1),
              color: '#10b981',
              fontWeight: 600,
            }}
          />
          
          {failureRate > 0 && (
            <Chip
              icon={<Error />}
              label={`${failureRate.toFixed(1)}% Fallos`}
              size="small"
              sx={{
                bgcolor: alpha('#ef4444', 0.1),
                color: '#ef4444',
                fontWeight: 600,
              }}
            />
          )}
          
          {stats.delivered > 0 && (
            <Chip
              icon={<Schedule />}
              label={`${deliveryRate.toFixed(1)}% Entregados`}
              size="small"
              sx={{
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                fontWeight: 600,
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};