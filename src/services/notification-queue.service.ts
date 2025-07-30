import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notificationService } from './notifications.service';
import { NotificationFormData } from '@/types/notification';

interface QueuedNotification {
  id: string;
  notificationId: string;
  recipientId: string;
  notificationData: NotificationFormData;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledFor?: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
  successRate: number;
  throughputPerHour: number;
  oldestPending?: Date;
}

class NotificationQueueService {
  private readonly COLLECTION_NAME = 'notificationQueue';
  private readonly MAX_BATCH_SIZE = 5; // Reducido para mejor control
  private readonly PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutos
  private readonly RETRY_DELAYS = [
    30 * 1000,        // 30 seconds
    2 * 60 * 1000,    // 2 minutes
    5 * 60 * 1000,    // 5 minutes
    15 * 60 * 1000,   // 15 minutes
    30 * 60 * 1000,   // 30 minutes
    60 * 60 * 1000,   // 1 hour
    2 * 60 * 60 * 1000, // 2 hours
    4 * 60 * 60 * 1000, // 4 hours
  ];

  private processingInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private processingStartTime: number | null = null;

  constructor() {
    // Auto-start processing and cleanup in browser environment
    if (typeof window !== 'undefined') {
      this.startProcessing();
      this.startCleanupInterval();
    }
  }

  // Add notification to queue with improved error handling
  async enqueueNotification(
    notificationId: string,
    recipientIds: string[],
    notificationData: NotificationFormData,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      scheduledFor?: Date;
      maxAttempts?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<string[]> {
    const {
      priority = 'medium',
      scheduledFor = new Date(),
      maxAttempts = 3,
      metadata = {}
    } = options;

    const queuedIds: string[] = [];

    try {
      // Use batch for better performance
      const batch = writeBatch(db);

      for (const recipientId of recipientIds) {
        const queueRef = doc(collection(db, this.COLLECTION_NAME));
        const queueItem: Omit<QueuedNotification, 'id'> = {
          notificationId,
          recipientId,
          notificationData,
          priority,
          status: 'pending',
          attempts: 0,
          maxAttempts,
          scheduledFor,
          metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(queueRef, {
          ...queueItem,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          scheduledFor: scheduledFor ? Timestamp.fromDate(scheduledFor) : serverTimestamp(),
        });

        queuedIds.push(queueRef.id);
      }

      await batch.commit();
      console.log(`✅ Enqueued ${queuedIds.length} notifications with priority: ${priority}`);
      return queuedIds;
    } catch (error) {
      console.error('❌ Error enqueuing notifications:', error);
      throw new Error(`Failed to enqueue notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Start processing queue with improved error handling
  startProcessing(intervalMs: number = 15000): void {
    if (this.processingInterval) {
      this.stopProcessing();
    }

    console.log('🔄 Starting notification queue processing...');
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('❌ Queue processing error:', error);
      });
    }, intervalMs);

    // Process immediately
    this.processQueue().catch(error => {
      console.error('❌ Initial queue processing error:', error);
    });
  }

  // Stop processing queue
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Stopped notification queue processing');
    }
  }

  // Start cleanup interval for stuck processing items
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStuckProcessing().catch(console.error);
    }, 60000); // Every minute
  }

  // Cleanup stuck processing items
  private async cleanupStuckProcessing(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - this.PROCESSING_TIMEOUT);
      
      const stuckQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'processing'),
        where('processingStartedAt', '<', Timestamp.fromDate(cutoffTime))
      );

      const snapshot = await getDocs(stuckQuery);
      
      if (!snapshot.empty) {
        console.log(`🧹 Cleaning up ${snapshot.docs.length} stuck processing items`);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'pending',
            processingStartedAt: null,
            updatedAt: serverTimestamp(),
            lastError: 'Processing timeout - reset to pending'
          });
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('❌ Error cleaning up stuck processing items:', error);
    }
  }

  // Process pending notifications with improved concurrency control
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Silently return instead of logging
    }

    this.isProcessing = true;
    this.processingStartTime = Date.now();

    try {
      // Get pending notifications with proper ordering
      const now = new Date();
      const pendingQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', Timestamp.fromDate(now)),
        orderBy('scheduledFor', 'asc'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(this.MAX_BATCH_SIZE)
      );

      const snapshot = await getDocs(pendingQuery);
      
      if (snapshot.empty) {
        return;
      }

      console.log(`📤 Processing ${snapshot.docs.length} notifications...`);

      // Process notifications sequentially to avoid overwhelming external services
      for (const docSnapshot of snapshot.docs) {
        const queueItem = { 
          id: docSnapshot.id, 
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date(),
          scheduledFor: docSnapshot.data().scheduledFor?.toDate(),
          processingStartedAt: docSnapshot.data().processingStartedAt?.toDate(),
          completedAt: docSnapshot.data().completedAt?.toDate(),
        } as QueuedNotification;
        
        await this.processNotification(queueItem);
        
        // Small delay between notifications to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Batch processing completed in ${Date.now() - this.processingStartTime!}ms`);

    } catch (error) {
      console.error('❌ Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      this.processingStartTime = null;
    }
  }

  // Process individual notification with transaction safety
  private async processNotification(queueItem: QueuedNotification): Promise<void> {
    try {
      // Use transaction to safely update status
      await runTransaction(db, async (transaction) => {
        const queueRef = doc(db, this.COLLECTION_NAME, queueItem.id);
        const currentDoc = await transaction.get(queueRef);
        
        if (!currentDoc.exists() || currentDoc.data()?.status !== 'pending') {
          throw new Error('Item no longer pending');
        }

        // Mark as processing
        transaction.update(queueRef, {
          status: 'processing',
          processingStartedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`🔄 Processing notification ${queueItem.notificationId} for user ${queueItem.recipientId}`);

      // Send notification
      const result = await notificationService.sendNotificationToUser(
        queueItem.notificationId,
        queueItem.recipientId,
        queueItem.notificationData
      );

      // Check if any channel was successful
      const hasSuccess = result.email || result.sms || result.push;

      if (hasSuccess) {
        // Mark as completed
        await updateDoc(doc(db, this.COLLECTION_NAME, queueItem.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          metadata: {
            ...queueItem.metadata,
            result,
            processingTime: Date.now() - (this.processingStartTime || Date.now()),
          }
        });

        console.log(`✅ Successfully processed notification ${queueItem.notificationId}`);
      } else {
        // All channels failed, schedule retry
        await this.scheduleRetry(queueItem, 'All delivery channels failed');
      }

    } catch (error) {
      console.error(`❌ Error processing notification ${queueItem.notificationId}:`, error);
      await this.scheduleRetry(queueItem, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Schedule retry with exponential backoff
  private async scheduleRetry(queueItem: QueuedNotification, errorMessage: string): Promise<void> {
    const queueRef = doc(db, this.COLLECTION_NAME, queueItem.id);
    const newAttempts = queueItem.attempts + 1;

    if (newAttempts >= queueItem.maxAttempts) {
      // Max attempts reached, mark as failed
      await updateDoc(queueRef, {
        status: 'failed',
        attempts: newAttempts,
        lastError: errorMessage,
        updatedAt: serverTimestamp(),
        metadata: {
          ...queueItem.metadata,
          failedAt: new Date(),
          finalError: errorMessage,
        }
      });

      console.log(`❌ Notification ${queueItem.notificationId} failed after ${newAttempts} attempts`);
    } else {
      // Schedule retry with exponential backoff
      const delayIndex = Math.min(newAttempts - 1, this.RETRY_DELAYS.length - 1);
      const delay = this.RETRY_DELAYS[delayIndex];
      const nextRetryAt = new Date(Date.now() + delay);

      await updateDoc(queueRef, {
        status: 'pending',
        attempts: newAttempts,
        lastError: errorMessage,
        nextRetryAt: Timestamp.fromDate(nextRetryAt),
        scheduledFor: Timestamp.fromDate(nextRetryAt),
        processingStartedAt: null,
        updatedAt: serverTimestamp(),
      });

      console.log(`⏰ Scheduled retry for notification ${queueItem.notificationId} in ${Math.round(delay / 1000)}s (attempt ${newAttempts}/${queueItem.maxAttempts})`);
    }
  }

  // Get enhanced queue statistics
  async getQueueStats(): Promise<QueueStats> {
    try {
      const snapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        processingStartedAt: doc.data().processingStartedAt?.toDate(),
      })) as QueuedNotification[];

      const stats: QueueStats = {
        pending: items.filter(item => item.status === 'pending').length,
        processing: items.filter(item => item.status === 'processing').length,
        completed: items.filter(item => item.status === 'completed').length,
        failed: items.filter(item => item.status === 'failed').length,
        totalProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
        throughputPerHour: 0,
      };

      const processedItems = items.filter(item => 
        item.status === 'completed' || item.status === 'failed'
      );

      stats.totalProcessed = processedItems.length;

      if (processedItems.length > 0) {
        stats.successRate = (stats.completed / processedItems.length) * 100;

        // Calculate average processing time for completed items
        const completedWithTimes = items.filter(item => 
          item.status === 'completed' && 
          item.completedAt && 
          item.createdAt
        );

        if (completedWithTimes.length > 0) {
          const totalTime = completedWithTimes.reduce((sum, item) => {
            const completedAt = item.completedAt!;
            const createdAt = item.createdAt;
            return sum + (completedAt.getTime() - createdAt.getTime());
          }, 0);

          stats.averageProcessingTime = totalTime / completedWithTimes.length;
        }

        // Calculate throughput (completed items in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCompleted = items.filter(item => 
          item.status === 'completed' && 
          item.completedAt && 
          item.completedAt > oneHourAgo
        );
        stats.throughputPerHour = recentCompleted.length;
      }

      // Find oldest pending item
      const pendingItems = items.filter(item => item.status === 'pending');
      if (pendingItems.length > 0) {
        stats.oldestPending = pendingItems.reduce((oldest, item) => 
          item.createdAt < oldest ? item.createdAt : oldest, 
          pendingItems[0].createdAt
        );
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }

  // Enhanced queue health check
  async getQueueHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: {
      avgProcessingTime: string;
      successRate: string;
      throughput: string;
      oldestPending: string;
    };
  }> {
    try {
      const stats = await this.getQueueStats();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for low success rate
      if (stats.successRate < 80 && stats.totalProcessed > 10) {
        issues.push(`Low success rate: ${stats.successRate.toFixed(1)}%`);
        recommendations.push('Check external service configurations and API keys');
      }

      // Check for stuck processing items
      if (stats.processing > 5) {
        issues.push(`High number of processing items: ${stats.processing}`);
        recommendations.push('Check if queue processor is running properly');
      }

      // Check for high pending count
      if (stats.pending > 50) {
        issues.push(`High number of pending items: ${stats.pending}`);
        recommendations.push('Consider increasing processing frequency or batch size');
      }

      // Check for high failed count
      if (stats.failed > 20) {
        issues.push(`High number of failed items: ${stats.failed}`);
        recommendations.push('Review failed notifications and fix underlying issues');
      }

      // Check for old pending items
      if (stats.oldestPending) {
        const ageHours = (Date.now() - stats.oldestPending.getTime()) / (1000 * 60 * 60);
        if (ageHours > 1) {
          issues.push(`Old pending items detected (${ageHours.toFixed(1)} hours old)`);
          recommendations.push('Check for processing bottlenecks or stuck items');
        }
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 2 || stats.successRate < 50 ? 'critical' : 'warning';
      }

      return { 
        status, 
        issues, 
        recommendations,
        metrics: {
          avgProcessingTime: `${(stats.averageProcessingTime / 1000).toFixed(1)}s`,
          successRate: `${stats.successRate.toFixed(1)}%`,
          throughput: `${stats.throughputPerHour}/hour`,
          oldestPending: stats.oldestPending 
            ? `${Math.round((Date.now() - stats.oldestPending.getTime()) / (1000 * 60))}min ago`
            : 'None'
        }
      };
    } catch (error) {
      console.error('❌ Error checking queue health:', error);
      return {
        status: 'critical',
        issues: ['Unable to check queue health'],
        recommendations: ['Check database connectivity and permissions'],
        metrics: {
          avgProcessingTime: 'Unknown',
          successRate: 'Unknown',
          throughput: 'Unknown',
          oldestPending: 'Unknown'
        }
      };
    }
  }

  // Bulk retry failed notifications
  async retryAllFailedNotifications(): Promise<number> {
    try {
      const failedQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'failed'),
        limit(100)
      );

      const snapshot = await getDocs(failedQuery);
      
      if (snapshot.empty) {
        return 0;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'pending',
          attempts: 0,
          lastError: null,
          nextRetryAt: null,
          scheduledFor: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      
      const retriedCount = snapshot.docs.length;
      console.log(`🔄 Retried ${retriedCount} failed notifications`);
      return retriedCount;
    } catch (error) {
      console.error('❌ Error retrying failed notifications:', error);
      throw error;
    }
  }

  // Clean up old completed/failed notifications
  async cleanupOldNotifications(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldItemsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', 'in', ['completed', 'failed', 'cancelled']),
        where('updatedAt', '<', Timestamp.fromDate(cutoffDate)),
        limit(500)
      );

      const snapshot = await getDocs(oldItemsQuery);
      
      if (snapshot.empty) {
        return 0;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      const deletedCount = snapshot.docs.length;
      console.log(`🧹 Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Schedule notification for future delivery
  async scheduleNotification(
    notificationId: string,
    recipientIds: string[],
    notificationData: NotificationFormData,
    scheduledFor: Date,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      maxAttempts?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<string[]> {
    return this.enqueueNotification(notificationId, recipientIds, notificationData, {
      ...options,
      scheduledFor,
    });
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    this.stopProcessing();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const notificationQueueService = new NotificationQueueService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    notificationQueueService.cleanup();
  });
}