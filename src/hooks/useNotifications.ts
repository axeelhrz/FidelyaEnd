'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type {
  Notification as NotificationType,
  NotificationFormData,
  NotificationFilters,
  NotificationStats,
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

// Audio context for notification sounds
let audioContext: AudioContext | null = null;

// Type declaration for webkit audio context
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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
    throughputPerHour: 0,
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const previousNotificationIds = useRef<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContext && typeof window !== 'undefined') {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext || AudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
  }, []);

  // Enhanced notification sound with Web Audio API
  const playNotificationSound = useCallback((priority: string = 'medium') => {
    if (!soundEnabled) return;
    
    initAudioContext();
    
    try {
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different priorities
        const frequencies = {
          low: [400, 300],
          medium: [600, 500],
          high: [800, 600],
          urgent: [1000, 800, 600]
        };
        
        const freqs = frequencies[priority as keyof typeof frequencies] || frequencies.medium;
        
        freqs.forEach((freq, index) => {
          setTimeout(() => {
            if (audioContext) {
              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              
              osc.connect(gain);
              gain.connect(audioContext.destination);
              
              osc.frequency.setValueAtTime(freq, audioContext.currentTime);
              gain.gain.setValueAtTime(0.1, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
              
              osc.start(audioContext.currentTime);
              osc.stop(audioContext.currentTime + 0.2);
            }
          }, index * 150);
        });
      }
    } catch {
      // Fallback to simple audio
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    }
  }, [soundEnabled, initAudioContext]);

  // Enhanced browser notification with better formatting
  const showBrowserNotification = useCallback((notification: NotificationType) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: false,
        data: {
          notificationId: notification.id,
          actionUrl: notification.actionUrl,
          type: notification.type,
          priority: notification.priority,
        },
      };

      // Action buttons are not supported in NotificationOptions type in most browsers, so skip adding them.

      const browserNotification = new Notification(notification.title, options);

      // Auto-close non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 8000);
      }

      // Handle clicks
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        browserNotification.close();
      };

      // Handle action clicks (if supported)
      if ('addEventListener' in browserNotification) {
        browserNotification.addEventListener('notificationclick', (event: Event) => {
          // Type assertion for NotificationEvent if available
          const notificationEvent = event as unknown as { action?: string };
          if (notificationEvent.action === 'view' && notification.actionUrl) {
            window.open(notification.actionUrl, '_blank');
          }
          browserNotification.close();
        });
      }
    }
  }, []);

  // Request notification permission with better UX
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success('Notificaciones del navegador activadas');
          return true;
        } else {
          toast.error('Permisos de notificación denegados');
          return false;
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }, []);

  // Enhanced subscription with better error handling
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const setupSubscription = async () => {
      try {
        // Request permissions if needed
        await requestNotificationPermission();

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
                  // Play sound based on priority
                  playNotificationSound(notification.priority);
                  
                  // Show browser notification
                  showBrowserNotification(notification);
                  
                  // Show toast for high priority notifications
                  if (notification.priority === 'urgent' || notification.priority === 'high') {
                    const toastOptions = {
                      duration: notification.priority === 'urgent' ? 8000 : 5000,
                      position: 'top-right' as const,
                      style: {
                        background: notification.type === 'error' ? '#fef2f2' : 
                                   notification.type === 'warning' ? '#fffbeb' :
                                   notification.type === 'success' ? '#f0fdf4' : '#f0f4ff',
                        border: notification.type === 'error' ? '1px solid #fecaca' : 
                               notification.type === 'warning' ? '1px solid #fed7aa' :
                               notification.type === 'success' ? '1px solid #bbf7d0' : '1px solid #c7d2fe',
                        color: '#1f2937',
                      }
                    };

                    if (notification.priority === 'urgent') {
                      toast.error(`🚨 ${notification.title}`, toastOptions);
                    } else {
                      toast.success(`📢 ${notification.title}`, toastOptions);
                    }
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
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar las notificaciones';
          setError(errorMessage);
          setLoading(false);
          console.error('Error subscribing to notifications:', err);
          
          toast.error('Error al conectar con las notificaciones', {
            duration: 5000,
            position: 'top-right',
          });
        }
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [filters, playNotificationSound, showBrowserNotification, requestNotificationPermission]);

  // Load queue stats periodically
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
    const interval = setInterval(loadQueueStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Memoized filtered notifications for better performance
  const filteredNotifications = useMemo(() => {
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

    return filtered;
  }, [allNotifications, filters]);

  // Update notifications state when filtered notifications change
  useEffect(() => {
    setNotifications(filteredNotifications);
  }, [filteredNotifications]);

  // Calculate statistics with memoization
  const calculatedStats = useMemo(() => {
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
    return newStats;
  }, [allNotifications]);

  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  // Cleanup expired notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredNotifications().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Enhanced create notification function
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
      
      // Create the notification in Firestore
      const notificationId = await createNotificationFirestore(data);
      
      // If external sending is requested
      if (data.sendExternal && data.recipientIds && data.recipientIds.length > 0) {
        if (data.useQueue) {
          // Use queue system
          const loadingToast = toast.loading('Agregando a cola de envío...');
          
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
            
            toast.dismiss(loadingToast);
            toast.success(`Notificación agregada a cola para ${data.recipientIds.length} destinatarios`);
          } catch (queueError) {
            toast.dismiss(loadingToast);
            console.error('Error queuing notification:', queueError);
            toast.error('Notificación creada pero falló al agregar a cola');
          }
        } else {
          // Direct sending
          const loadingToast = toast.loading('Enviando notificaciones externas...');
          
          try {
            const deliveryResults = await notificationService.sendNotificationToUsers(
              notificationId,
              data.recipientIds,
              data
            );
            
            toast.dismiss(loadingToast);
            
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
              toast('Notificación creada pero no se pudieron enviar notificaciones externas', {
                icon: '⚠️',
                duration: 5000,
                position: 'top-right',
              });
            }
            
          } catch (externalError) {
            toast.dismiss(loadingToast);
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

  // Enhanced action functions with better error handling
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      await markNotificationAsRead(id);
      // Optimistic update
      setAllNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'read' as const, readAt: new Date() } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Error al marcar como leída');
      throw error;
    }
  }, []);

  const markAsUnread = useCallback(async (id: string): Promise<void> => {
    try {
      await markNotificationAsUnread(id);
      // Optimistic update
      setAllNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'unread' as const, readAt: undefined } : n)
      );
    } catch (error) {
      console.error('Error marking as unread:', error);
      toast.error('Error al marcar como no leída');
      throw error;
    }
  }, []);

  const archiveNotification = useCallback(async (id: string): Promise<void> => {
    try {
      await archiveNotificationFirestore(id);
      // Optimistic update
      setAllNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'archived' as const } : n)
      );
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
      // Optimistic update
      setAllNotifications(prev => prev.filter(n => n.id !== id));
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
      // Optimistic update
      setAllNotifications(prev => 
        prev.map(n => n.status === 'unread' ? { ...n, status: 'read' as const, readAt: new Date() } : n)
      );
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
      
      // Optimistic update
      setAllNotifications(prev => {
        switch (action) {
          case 'read':
            return prev.map(n => ids.includes(n.id) ? { ...n, status: 'read' as const, readAt: new Date() } : n);
          case 'unread':
            return prev.map(n => ids.includes(n.id) ? { ...n, status: 'unread' as const, readAt: undefined } : n);
          case 'archive':
            return prev.map(n => ids.includes(n.id) ? { ...n, status: 'archived' as const } : n);
          case 'delete':
            return prev.filter(n => !ids.includes(n.id));
          default:
            return prev;
        }
      });
      
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
      setLastRefresh(Date.now());
      const newStats = await getNotificationStats();
      setStats(prev => ({
        ...newStats,
        recentActivity: prev.recentActivity, // Keep calculated recent activity
      }));
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('Error al actualizar estadísticas');
    }
  }, []);

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notificationSoundEnabled', String(newValue));
      toast.success(newValue ? 'Sonidos activados' : 'Sonidos desactivados');
      return newValue;
    });
  }, []);

  // Load sound setting from localStorage
  useEffect(() => {
    const savedSetting = localStorage.getItem('notificationSoundEnabled');
    if (savedSetting !== null) {
      setSoundEnabled(savedSetting === 'true');
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
    soundEnabled,
    lastRefresh,

    // Basic Actions
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
    toggleSound,

    // Advanced Features
    getDeliveryStats: notificationService.getDeliveryStats.bind(notificationService),
    getQueueStats: notificationQueueService.getQueueStats.bind(notificationQueueService),
    getQueueHealth: notificationQueueService.getQueueHealth.bind(notificationQueueService),
    retryFailedNotifications: notificationQueueService.retryAllFailedNotifications.bind(notificationQueueService),
    cleanupOldNotifications: notificationQueueService.cleanupOldNotifications.bind(notificationQueueService),
    scheduleNotification: notificationQueueService.scheduleNotification.bind(notificationQueueService),

    // Utilities
    playNotificationSound,
    showBrowserNotification,
    requestNotificationPermission,
  };
};