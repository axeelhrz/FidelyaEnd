'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import type {
  Notification as NotificationType,
  NotificationFormData,
  NotificationFilters,
  NotificationStats,
  NotificationTemplate,
} from '@/types/notification';
import {
  subscribeToNotifications,
  createNotification as createNotificationFirestore,
  markNotificationAsRead,
  markNotificationAsUnread,
  archiveNotification as archiveNotificationFirestore,
  deleteNotification as deleteNotificationFirestore,
  markAllNotificationsAsRead,
  bulkNotificationAction,
  getNotificationStats,
  cleanupExpiredNotifications,
} from '@/utils/firestore/notifications';
import { notificationService } from '@/services/notifications.service';
import { notificationQueueService } from '@/services/notification-queue.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [allNotifications, setAllNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0,
    byType: { info: 0, success: 0, warning: 0, error: 0, announcement: 0 },
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    byCategory: { system: 0, membership: 0, payment: 0, event: 0, general: 0 },
    recentActivity: { today: 0, thisWeek: 0, thisMonth: 0 },
  });
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [error, setError] = useState<string | null>(null);
  const [sendingExternal, setSendingExternal] = useState(false);
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
    successRate: 0,
  });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const previousNotificationIds = useRef<Set<string>>(new Set());

  // Función para reproducir sonido de notificación usando Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
    } catch {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
  }, []);

  // Función para mostrar notificación del navegador
  const showBrowserNotification = useCallback((notification: NotificationType) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: false,
      });

      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    }
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    requestNotificationPermission();

    try {
      const unsubscribe = subscribeToNotifications(
        (newNotifications) => {
          if (!mounted) return;

          const currentIds = new Set(newNotifications.map(n => n.id));
          const newIds = [...currentIds].filter(id => !previousNotificationIds.current.has(id));
          
          if (newIds.length > 0 && previousNotificationIds.current.size > 0) {
            setNewNotificationCount(prev => prev + newIds.length);
            
            newIds.forEach(id => {
              const notification = newNotifications.find(n => n.id === id);
              if (notification && notification.status === 'unread') {
                playNotificationSound();
                showBrowserNotification(notification);
                
                if (notification.priority === 'urgent' || notification.priority === 'high') {
                  toast.success(`Nueva notificación: ${notification.title}`, {
                    duration: 5000,
                    position: 'top-right',
                  });
                }
              }
            });
          }

          previousNotificationIds.current = currentIds;
          setAllNotifications(newNotifications);
          setLoading(false);
        },
        filters
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      if (mounted) {
        setError('Error al cargar las notificaciones');
        setLoading(false);
        console.error('Error subscribing to notifications:', err);
      }
    }

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [filters, playNotificationSound, showBrowserNotification, requestNotificationPermission]);

  // Cargar estadísticas de cola
  useEffect(() => {
    const loadQueueStats = async () => {
      try {
        const stats = await notificationQueueService.getQueueStats();
        setQueueStats(stats);
      } catch (error) {
        console.error('Error loading queue stats:', error);
      }
    };

    loadQueueStats();
    const interval = setInterval(loadQueueStats, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Aplicar filtros localmente
  useEffect(() => {
    let filtered = [...allNotifications];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(n => filters.type!.includes(n.type));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(n => filters.priority!.includes(n.priority));
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(n => filters.category!.includes(n.category));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(n => filters.status!.includes(n.status));
    }

    if (filters.dateRange) {
      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate >= filters.dateRange!.start && notificationDate <= filters.dateRange!.end;
      });
    }

    setNotifications(filtered);
  }, [allNotifications, filters]);

  // Calcular estadísticas
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newStats: NotificationStats = {
      total: allNotifications.length,
      unread: allNotifications.filter(n => n.status === 'unread').length,
      read: allNotifications.filter(n => n.status === 'read').length,
      archived: allNotifications.filter(n => n.status === 'archived').length,
      byType: {
        info: allNotifications.filter(n => n.type === 'info').length,
        success: allNotifications.filter(n => n.type === 'success').length,
        warning: allNotifications.filter(n => n.type === 'warning').length,
        error: allNotifications.filter(n => n.type === 'error').length,
        announcement: allNotifications.filter(n => n.type === 'announcement').length,
      },
      byPriority: {
        low: allNotifications.filter(n => n.priority === 'low').length,
        medium: allNotifications.filter(n => n.priority === 'medium').length,
        high: allNotifications.filter(n => n.priority === 'high').length,
        urgent: allNotifications.filter(n => n.priority === 'urgent').length,
      },
      byCategory: {
        system: allNotifications.filter(n => n.category === 'system').length,
        membership: allNotifications.filter(n => n.category === 'membership').length,
        payment: allNotifications.filter(n => n.category === 'payment').length,
        event: allNotifications.filter(n => n.category === 'event').length,
        general: allNotifications.filter(n => n.category === 'general').length,
      },
      recentActivity: {
        today: allNotifications.filter(n => new Date(n.createdAt) >= today).length,
        thisWeek: allNotifications.filter(n => new Date(n.createdAt) >= thisWeek).length,
        thisMonth: allNotifications.filter(n => new Date(n.createdAt) >= thisMonth).length,
      }
    };
    setStats(newStats);
  }, [allNotifications]);

  // Limpiar notificaciones expiradas periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredNotifications().catch(console.error);
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, []);

  // Función mejorada para crear notificación con envío externo y cola
  const createNotification = useCallback(async (
    data: NotificationFormData & {
      sendExternal?: boolean;
      recipientIds?: string[];
      useQueue?: boolean;
      scheduledFor?: Date;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }
  ): Promise<void> => {
    try {
      setSendingExternal(true);
      
      // Crear la notificación en Firestore
      const notificationId = await createNotificationFirestore(data);
      
      // Si se especifica envío externo
      if (data.sendExternal && data.recipientIds && data.recipientIds.length > 0) {
        if (data.useQueue) {
          // Usar sistema de colas
          toast.loading('Agregando a cola de envío...', { id: 'queuing' });
          
          try {
            await notificationQueueService.enqueueNotification(
              notificationId,
              data.recipientIds,
              data,
              {
                priority: data.priority || 'medium',
                scheduledFor: data.scheduledFor,
                maxAttempts: data.priority === 'urgent' ? 5 : 3,
              }
            );
            
            toast.dismiss('queuing');
            toast.success(`Notificación agregada a cola para ${data.recipientIds.length} destinatarios`);
          } catch (queueError) {
            toast.dismiss('queuing');
            console.error('Error queuing notification:', queueError);
            toast.error('Notificación creada pero falló al agregar a cola');
          }
        } else {
          // Envío directo
          toast.loading('Enviando notificaciones externas...', { id: 'sending-external' });
          
          try {
            const deliveryResults = await notificationService.sendNotificationToUsers(
              notificationId,
              data.recipientIds,
              data
            );
            
            toast.dismiss('sending-external');
            
            const successMessage = [];
            if (deliveryResults.emailSent > 0) {
              successMessage.push(`${deliveryResults.emailSent} emails`);
            }
            if (deliveryResults.smsSent > 0) {
              successMessage.push(`${deliveryResults.smsSent} SMS`);
            }
            if (deliveryResults.pushSent > 0) {
              successMessage.push(`${deliveryResults.pushSent} push`);
            }
            
            if (successMessage.length > 0) {
              toast.success(`Notificación enviada: ${successMessage.join(', ')}`);
            } else {
              toast.error('Notificación creada pero no se pudieron enviar notificaciones externas');
            }
            
          } catch (externalError) {
            toast.dismiss('sending-external');
            console.error('Error sending external notifications:', externalError);
            toast.error('Notificación creada pero falló el envío externo');
          }
        }
      } else {
        toast.success('Notificación creada exitosamente');
      }
      
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Error al crear la notificación');
      throw error;
    } finally {
      setSendingExternal(false);
    }
  }, []);

  // Función para crear notificación desde template
  const createNotificationFromTemplate = useCallback(async (
    template: NotificationTemplate,
    variables: Record<string, string>,
    options: {
      sendExternal?: boolean;
      recipientIds?: string[];
      useQueue?: boolean;
      scheduledFor?: Date;
    } = {}
  ): Promise<void> => {
    try {
      // Reemplazar variables en el template
      let title = template.title;
      let message = template.message;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        title = title.replace(regex, value);
        message = message.replace(regex, value);
      });

      // Crear notificación con datos del template
      await createNotification({
        title,
        message,
        type: template.type,
        priority: template.priority,
        category: template.category,
        tags: template.variables,
        ...options,
      });
    } catch (error) {
      console.error('Error creating notification from template:', error);
      throw error;
    }
  }, [createNotification]);

  // Función para obtener estadísticas de entrega
  const getDeliveryStats = useCallback(async (notificationId: string) => {
    try {
      return await notificationService.getDeliveryStats(notificationId);
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return null;
    }
  }, []);

  // Función para obtener estadísticas de cola
  const getQueueStats = useCallback(async () => {
    try {
      return await notificationQueueService.getQueueStats();
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }, []);

  // Función para obtener salud de la cola
  const getQueueHealth = useCallback(async () => {
    try {
      return await notificationQueueService.getQueueHealth();
    } catch (error) {
      console.error('Error getting queue health:', error);
      return null;
    }
  }, []);

  // Función para reintentar notificaciones fallidas
  const retryFailedNotifications = useCallback(async () => {
    try {
      const retriedCount = await notificationQueueService.retryAllFailedNotifications();
      toast.success(`${retriedCount} notificaciones reintentadas`);
      return retriedCount;
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
      toast.error('Error al reintentar notificaciones');
      throw error;
    }
  }, []);

  // Función para limpiar notificaciones antiguas
  const cleanupOldNotifications = useCallback(async (days: number = 30) => {
    try {
      const deletedCount = await notificationQueueService.cleanupOldNotifications(days);
      toast.success(`${deletedCount} notificaciones antiguas eliminadas`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      toast.error('Error al limpiar notificaciones antiguas');
      throw error;
    }
  }, []);

  // Función para programar notificación
  const scheduleNotification = useCallback(async (
    data: NotificationFormData & {
      recipientIds?: string[];
    },
    scheduledFor: Date
  ): Promise<void> => {
    try {
      // Crear la notificación en Firestore
      const notificationId = await createNotificationFirestore(data);
      
      // Agregar a cola programada
      if (data.recipientIds && data.recipientIds.length > 0) {
        await notificationQueueService.scheduleNotification(
          notificationId,
          data.recipientIds,
          data,
          scheduledFor,
          {
            priority: data.priority || 'medium',
            maxAttempts: 3,
          }
        );
        
        toast.success(`Notificación programada para ${scheduledFor.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast.error('Error al programar la notificación');
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Error al marcar como leída');
      throw error;
    }
  }, []);

  const markAsUnread = useCallback(async (id: string): Promise<void> => {
    try {
      await markNotificationAsUnread(id);
    } catch (error) {
      console.error('Error marking as unread:', error);
      toast.error('Error al marcar como no leída');
      throw error;
    }
  }, []);

  const archiveNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveNotificationFirestore(id);
      toast.success('Notificación archivada');
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast.error('Error al archivar la notificación');
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteNotificationFirestore(id);
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar la notificación');
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await markAllNotificationsAsRead();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
      throw error;
    }
  }, []);

  const bulkAction = useCallback(async (
    ids: string[],
    action: 'read' | 'unread' | 'archive' | 'delete'
  ): Promise<void> => {
    try {
      await bulkNotificationAction(ids, action);
      
      const actionMessages = {
        read: `${ids.length} notificaciones marcadas como leídas`,
        unread: `${ids.length} notificaciones marcadas como no leídas`,
        archive: `${ids.length} notificaciones archivadas`,
        delete: `${ids.length} notificaciones eliminadas`
      };
      
      toast.success(actionMessages[action]);
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Error al ejecutar la acción');
      throw error;
    }
  }, []);

  const clearNewNotificationCount = useCallback(() => {
    setNewNotificationCount(0);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const newStats = await getNotificationStats();
      setStats({
        ...newStats,
        recentActivity: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
        },
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, []);

  return {
    // Data
    notifications,
    allNotifications,
    loading,
    error,
    stats,
    filters,
    newNotificationCount,
    sendingExternal,
    queueStats,

    // Basic Actions
    setFilters,
    createNotification,
    createNotificationFromTemplate,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    bulkAction,
    clearNewNotificationCount,
    refreshStats,

    // Advanced Features
    getDeliveryStats,
    getQueueStats,
    getQueueHealth,
    retryFailedNotifications,
    cleanupOldNotifications,
    scheduleNotification,

    // Utilities
    playNotificationSound,
    showBrowserNotification,
    requestNotificationPermission,
  };
};