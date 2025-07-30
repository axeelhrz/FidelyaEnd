'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  Button,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Email,
  Sms,
  PhoneAndroid,
  CheckCircle,
  Refresh,
  Speed,
  Schedule,
} from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { notificationQueueService } from '@/services/notification-queue.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface DashboardStats {
  totalSent: number;
  successRate: number;
  avgProcessingTime: number;
  throughputPerHour: number;
  byChannel: {
    email: { sent: number; failed: number; rate: number };
    sms: { sent: number; failed: number; rate: number };
    push: { sent: number; failed: number; rate: number };
  };
  recentActivity: Array<{
    timestamp: Date;
    type: string;
    status: string;
    channel: string;
  }>;
}

export const NotificationDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  interface QueueHealth {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: {
      avgProcessingTime: string;
      successRate: string;
      throughput: string;
      oldestPending: string;
    };
  }
  
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [queueStats, healthCheck] = await Promise.all([
        notificationQueueService.getQueueStats(),
        notificationQueueService.getQueueHealth()
      ]);

      // Simular datos de estadísticas (en producción vendrían de la base de datos)
      const mockStats: DashboardStats = {
        totalSent: queueStats.completed + queueStats.failed,
        successRate: queueStats.totalProcessed > 0 ? (queueStats.completed / queueStats.totalProcessed) * 100 : 0,
        avgProcessingTime: queueStats.averageProcessingTime,
        throughputPerHour: queueStats.throughputPerHour,
        byChannel: {
          email: { sent: Math.floor(queueStats.completed * 0.6), failed: Math.floor(queueStats.failed * 0.4), rate: 85 },
          sms: { sent: Math.floor(queueStats.completed * 0.2), failed: Math.floor(queueStats.failed * 0.3), rate: 92 },
          push: { sent: Math.floor(queueStats.completed * 0.2), failed: Math.floor(queueStats.failed * 0.3), rate: 78 },
        },
        recentActivity: []
      };

      setStats(mockStats);
      setQueueHealth(healthCheck);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Cargando dashboard de notificaciones...
        </Typography>
      </Box>
    );
  }

  const channelData = {
    labels: ['Email', 'SMS', 'Push'],
    datasets: [
      {
        label: 'Enviados',
        data: [stats.byChannel.email.sent, stats.byChannel.sms.sent, stats.byChannel.push.sent],
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
      },
      {
        label: 'Fallidos',
        data: [stats.byChannel.email.failed, stats.byChannel.sms.failed, stats.byChannel.push.failed],
        backgroundColor: ['#ef4444', '#ef4444', '#ef4444'],
      },
    ],
  };

  const successRateData = {
    labels: ['Exitosas', 'Fallidas'],
    datasets: [
      {
        data: [stats.successRate, 100 - stats.successRate],
        backgroundColor: ['#10b981', '#ef4444'],
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Dashboard de Notificaciones
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Monitoreo en tiempo real del sistema de notificaciones
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            onClick={loadDashboardData}
            startIcon={<Refresh />}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Health Status */}
      {queueHealth && (
        <Alert
          severity={queueHealth.status === 'healthy' ? 'success' : queueHealth.status === 'warning' ? 'warning' : 'error'}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Estado del Sistema: {queueHealth.status === 'healthy' ? 'Saludable' : queueHealth.status === 'warning' ? 'Advertencia' : 'Crítico'}
          </Typography>
          {queueHealth.issues.length > 0 && (
            <Typography variant="body2">
              Problemas detectados: {queueHealth.issues.join(', ')}
            </Typography>
          )}
        </Alert>
      )}

      {/* KPI Cards */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: '1 1 250px',
          minWidth: '250px'
        }
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#3b82f6' }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {stats.totalSent.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Total Enviadas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: stats.successRate >= 90 ? '#10b981' : stats.successRate >= 70 ? '#f59e0b' : '#ef4444' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {stats.successRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Tasa de Éxito
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#8b5cf6' }}>
                <Speed />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {(stats.avgProcessingTime / 1000).toFixed(1)}s
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Tiempo Promedio
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#f59e0b' }}>
                <Schedule />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {stats.throughputPerHour}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Por Hora
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *:first-of-type': {
          flex: '2 1 500px',
          minWidth: '500px'
        },
        '& > *:last-of-type': {
          flex: '1 1 300px',
          minWidth: '300px'
        }
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Notificaciones por Canal
            </Typography>
            <Bar
              data={channelData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Tasa de Éxito Global
            </Typography>
            <Doughnut
              data={successRateData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </CardContent>
        </Card>
      </Box>

      {/* Channel Details */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mb: 4,
        '& > *': {
          flex: '1 1 300px',
          minWidth: '300px'
        }
      }}>
        {Object.entries(stats.byChannel).map(([channel, data]) => {
          const channelConfig = {
            email: { icon: <Email />, color: '#3b82f6', label: 'Email' },
            sms: { icon: <Sms />, color: '#10b981', label: 'SMS' },
            push: { icon: <PhoneAndroid />, color: '#8b5cf6', label: 'Push' },
          }[channel];

          return (
            <Card key={channel}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: channelConfig?.color }}>
                    {channelConfig?.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {channelConfig?.label}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tasa de Éxito</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {data.rate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={data.rate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: channelConfig?.color,
                      }
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                      {data.sent}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Enviadas
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>
                      {data.failed}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Fallidas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Queue Status */}
      {queueHealth && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Estado de la Cola de Procesamiento
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3,
              '& > *': {
                flex: '1 1 400px',
                minWidth: '400px'
              }
            }}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Métricas de Rendimiento
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tiempo Promedio de Procesamiento:</Typography>
                      <Chip label={queueHealth.metrics.avgProcessingTime} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tasa de Éxito:</Typography>
                      <Chip
                        label={queueHealth.metrics.successRate}
                        size="small"
                        color={parseFloat(queueHealth.metrics.successRate) >= 90 ? 'success' : 'warning'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Throughput:</Typography>
                      <Chip label={queueHealth.metrics.throughput} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Pendiente más Antigua:</Typography>
                      <Chip label={queueHealth.metrics.oldestPending} size="small" />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box>
                {queueHealth.issues.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#ef4444' }}>
                      Problemas Detectados
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {queueHealth.issues.map((issue: string, index: number) => (
                        <Alert key={index} severity="warning" sx={{ py: 0.5 }}>
                          <Typography variant="body2">{issue}</Typography>
                        </Alert>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {queueHealth.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#3b82f6' }}>
                      Recomendaciones
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {queueHealth.recommendations.map((rec: string, index: number) => (
                        <Alert key={index} severity="info" sx={{ py: 0.5 }}>
                          <Typography variant="body2">{rec}</Typography>
                        </Alert>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
