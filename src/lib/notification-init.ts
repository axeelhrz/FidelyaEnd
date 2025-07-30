import { notificationQueueService } from '@/services/notification-queue.service';

interface NotificationConfig {
  enableBrowserNotifications: boolean;
  enableSounds: boolean;
  queueProcessingInterval: number;
  maxRetries: number;
  cleanupInterval: number;
}

class NotificationInitService {
  private initialized = false;
  private config: NotificationConfig = {
    enableBrowserNotifications: true,
    enableSounds: true,
    queueProcessingInterval: 15000, // 15 seconds
    maxRetries: 3,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  };

  async initialize(customConfig?: Partial<NotificationConfig>): Promise<void> {
    if (this.initialized) {
      console.log('📱 Notification system already initialized');
      return;
    }

    try {
      console.log('🔔 Inicializando sistema de notificaciones...');

      // Merge custom config
      this.config = { ...this.config, ...customConfig };

      // Request browser notification permissions
      if (this.config.enableBrowserNotifications) {
        await this.requestNotificationPermissions();
      }

      // Initialize queue processing
      this.initializeQueueProcessing();

      // Setup periodic cleanup
      this.setupPeriodicCleanup();

      // Validate configuration
      await this.validateConfiguration();

      this.initialized = true;
      console.log('✅ Sistema de notificaciones inicializado correctamente');

    } catch (error) {
      console.error('❌ Error initializing notification system:', error);
      throw error;
    }
  }

  private async requestNotificationPermissions(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Browser notifications not supported');
      return;
    }

    try {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Browser notification permissions granted');
          
          // Show welcome notification
          new Notification('Fidelya - Notificaciones Activadas', {
            body: 'Recibirás notificaciones importantes en tiempo real',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'welcome',
            requireInteraction: false,
          });
        } else {
          console.warn('⚠️ Browser notification permissions denied');
        }
      } else if (Notification.permission === 'granted') {
        console.log('✅ Browser notification permissions already granted');
      } else {
        console.warn('⚠️ Browser notification permissions denied');
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
    }
  }

  private initializeQueueProcessing(): void {
    try {
      // Start queue processing with configured interval
      notificationQueueService.startProcessing(this.config.queueProcessingInterval);
      console.log('🔄 Queue processing initialized');
    } catch (error) {
      console.error('❌ Error initializing queue processing:', error);
      throw error;
    }
  }

  private setupPeriodicCleanup(): void {
    // Setup daily cleanup of old notifications
    setInterval(async () => {
      try {
        const deletedCount = await notificationQueueService.cleanupOldNotifications(7);
        if (deletedCount > 0) {
          console.log(`🧹 Daily cleanup: removed ${deletedCount} old notifications`);
        }
      } catch (error) {
        console.error('❌ Error in periodic cleanup:', error);
      }
    }, this.config.cleanupInterval);

    console.log('🧹 Periodic cleanup scheduled');
  }

  private async validateConfiguration(): Promise<void> {
    try {
      // Test queue health
      const health = await notificationQueueService.getQueueHealth();
      
      if (health.status === 'critical') {
        console.warn('⚠️ Queue health is critical:', health.issues);
      } else {
        console.log('✅ Configuration validated successfully');
      }

      // Log current metrics
      console.log('📊 Queue metrics:', health.metrics);
      
    } catch (error) {
      console.error('❌ Error validating configuration:', error);
      // Don't throw here, just log the error
    }
  }

  // Get initialization status
  isInitialized(): boolean {
    return this.initialized;
  }

  // Get current configuration
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Notification configuration updated');
  }

  // Test notification system
  async testNotificationSystem(): Promise<{
    browserNotifications: boolean;
    queueProcessing: boolean;
    permissions: string;
  }> {
    const results = {
      browserNotifications: false,
      queueProcessing: false,
      permissions: 'unknown'
    };

    try {
      // Test browser notifications
      if ('Notification' in window) {
        results.permissions = Notification.permission;
        results.browserNotifications = Notification.permission === 'granted';
      }

      // Test queue processing
      const health = await notificationQueueService.getQueueHealth();
      results.queueProcessing = health.status !== 'critical';

      console.log('🧪 Notification system test results:', results);
      return results;

    } catch (error) {
      console.error('❌ Error testing notification system:', error);
      return results;
    }
  }

  // Graceful shutdown
  shutdown(): void {
    if (!this.initialized) {
      return;
    }

    try {
      notificationQueueService.cleanup();
      this.initialized = false;
      console.log('🛑 Notification system shutdown complete');
    } catch (error) {
      console.error('❌ Error during notification system shutdown:', error);
    }
  }
}

// Export singleton instance
export const notificationInitService = new NotificationInitService();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      notificationInitService.initialize().catch(console.error);
    });
  } else {
    notificationInitService.initialize().catch(console.error);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    notificationInitService.shutdown();
  });
}