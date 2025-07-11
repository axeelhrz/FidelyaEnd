import { notificationQueueService } from '@/services/notification-queue.service';

// Configuración del sistema de notificaciones
export const initializeNotificationSystem = () => {
  // Solo en el servidor (Node.js)
  if (typeof window === 'undefined') {
    console.log('🔔 Inicializando sistema de notificaciones...');
    
    // Configurar procesamiento de cola
    const processingInterval = parseInt(process.env.NOTIFICATION_PROCESSING_INTERVAL || '30000');
    notificationQueueService.startProcessing(processingInterval);
    
    // Configurar limpieza automática
    const cleanupInterval = parseInt(process.env.NOTIFICATION_CLEANUP_INTERVAL || '86400000'); // 24 horas
    setInterval(async () => {
      try {
        const deletedCount = await notificationQueueService.cleanupOldNotifications(30);
        console.log(`🧹 Limpieza automática: ${deletedCount} notificaciones eliminadas`);
      } catch (error) {
        console.error('❌ Error en limpieza automática:', error);
      }
    }, cleanupInterval);
    
    // Monitoreo de salud del sistema
    const healthCheckInterval = parseInt(process.env.NOTIFICATION_HEALTH_CHECK_INTERVAL || '300000'); // 5 minutos
    setInterval(async () => {
      try {
        const health = await notificationQueueService.getQueueHealth();
        if (health.status === 'critical') {
          console.warn('⚠️ Sistema de notificaciones en estado crítico:', health.issues);
        }
      } catch (error) {
        console.error('❌ Error en verificación de salud:', error);
      }
    }, healthCheckInterval);
    
    console.log('✅ Sistema de notificaciones inicializado correctamente');
  }
};

// Configuración para el cliente
export const initializeClientNotifications = () => {
  // Solo en el cliente (navegador)
  if (typeof window !== 'undefined') {
    console.log('🔔 Inicializando notificaciones del cliente...');
    
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permisos de notificación:', permission);
      });
    }
    
    // Registrar Service Worker para notificaciones push (solo si existe el archivo)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Check if service worker file exists before registering
      fetch('/sw.js', { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // Service worker file exists, register it
            navigator.serviceWorker.register('/sw.js')
              .then(() => {
                console.log('📱 Service Worker registrado para notificaciones push');
              })
              .catch(error => {
                console.log('❌ Error registrando Service Worker:', error);
              });
          } else {
            console.log('ℹ️ Service Worker no encontrado, saltando registro');
          }
        })
        .catch(() => {
          console.log('ℹ️ Service Worker no disponible, saltando registro');
        });
    } else {
      console.log('ℹ️ Service Worker o Push Manager no soportados en este navegador');
    }
    
    console.log('✅ Notificaciones del cliente inicializadas');
  }
};