import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  deleteDoc 
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
}

class NotificationQueueService {
  private readonly COLLECTION_NAME = 'notificationQueue';
  private readonly MAX_BATCH_SIZE = 10;
  private readonly RETRY_DELAYS = [
    1 * 60 * 1000,    // 1 minute
    5 * 60 * 1000,    // 5 minutes
    15 * 60 * 1000,   // 15 minutes
    30 * 60 * 1000,   // 30 minutes
    60 * 60 * 1000,   // 1 hour
    2 * 60 * 60 * 1000, // 2 hours
    4 * 60 * 60 * 1000, // 4 hours
    8 * 60 * 60 * 1000, // 8 hours
  ];

  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // Add notification to queue
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
      scheduledFor,
      maxAttempts = 3,
      metadata = {}
    } = options;

    const queuedIds: string[] = [];

    try {
      for (const recipientId of recipientIds) {
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

        const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
          ...queueItem,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          scheduledFor: scheduledFor ? Timestamp.fromDate(scheduledFor) : null,
        });

        queuedIds.push(docRef.id);
      }

      console.log(`Enqueued ${queuedIds.length} notifications`);
      return queuedIds;
    } catch (error) {
      console.error('Error enqueuing notifications:', error);
      throw error;
    }
  }

  // Start processing queue
  startProcessing(intervalMs: number = 30000): void {
    if (this.processingInterval) {
      this.stopProcessing();
    }

    console.log('Starting notification queue processing...');
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(console.error);
    }, intervalMs);

    // Process immediately
    this.processQueue().catch(console.error);
  }

  // Stop processing queue
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Stopped notification queue processing');
    }
  }

  // Process pending notifications
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Queue processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending notifications ordered by priority and creation time
      const pendingQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'pending'),
        where('scheduledFor', '<=', new Date()),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'asc'),
        limit(this.MAX_BATCH_SIZE)
      );

      const snapshot = await getDocs(pendingQuery);
      
      if (snapshot.empty) {
        console.log('No pending notifications to process');
        return;
      }

      console.log(`Processing ${snapshot.docs.length} notifications...`);

      const processingPromises = snapshot.docs.map(async (docSnapshot) => {
        const queueItem = { id: docSnapshot.id, ...docSnapshot.data() } as QueuedNotification;
        return this.processNotification(queueItem);
      });

      await Promise.allSettled(processingPromises);
      console.log('Batch processing completed');

    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual notification
  private async processNotification(queueItem: QueuedNotification): Promise<void> {
    const queueRef = doc(db, this.COLLECTION_NAME, queueItem.id);

    try {
      // Mark as processing
      await updateDoc(queueRef, {
        status: 'processing',
        updatedAt: serverTimestamp(),
      });

      console.log(`Processing notification ${queueItem.notificationId} for user ${queueItem.recipientId}`);

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
        await updateDoc(queueRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
          metadata: {
            ...queueItem.metadata,
            result,
            completedAt: new Date(),
          }
        });

        console.log(`Successfully processed notification ${queueItem.notificationId}`);
      } else {
        // All channels failed, schedule retry
        await this.scheduleRetry(queueItem, 'All delivery channels failed');
      }

    } catch (error) {
      console.error(`Error processing notification ${queueItem.notificationId}:`, error);
      await this.scheduleRetry(queueItem, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Schedule retry for failed notification
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

      console.log(`Notification ${queueItem.notificationId} failed after ${newAttempts} attempts`);
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
        updatedAt: serverTimestamp(),
      });

      console.log(`Scheduled retry for notification ${queueItem.notificationId} in ${delay / 1000} seconds (attempt ${newAttempts}/${queueItem.maxAttempts})`);
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<QueueStats> {
    try {
      const snapshot = await getDocs(collection(db, this.COLLECTION_NAME));
      const items = snapshot.docs.map(doc => doc.data() as QueuedNotification);

      const stats: QueueStats = {
        pending: items.filter(item => item.status === 'pending').length,
        processing: items.filter(item => item.status === 'processing').length,
        completed: items.filter(item => item.status === 'completed').length,
        failed: items.filter(item => item.status === 'failed').length,
        totalProcessed: 0,
        averageProcessingTime: 0,
        successRate: 0,
      };

      const processedItems = items.filter(item => 
        item.status === 'completed' || item.status === 'failed'
      );

      stats.totalProcessed = processedItems.length;

      if (processedItems.length > 0) {
        stats.successRate = (stats.completed / processedItems.length) * 100;

        // Calculate average processing time for completed items
        const completedWithTimes = processedItems.filter(item => 
          item.status === 'completed' && 
          item.metadata?.completedAt && 
          item.createdAt
        );

        if (completedWithTimes.length > 0) {
          const totalTime = completedWithTimes.reduce((sum, item) => {
            const completedAt = new Date(item.metadata!.completedAt as string | number | Date);
            const createdAt = new Date(item.createdAt);
            return sum + (completedAt.getTime() - createdAt.getTime());
          }, 0);

          stats.averageProcessingTime = totalTime / completedWithTimes.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }

  // Cancel queued notification
  async cancelNotification(queueItemId: string): Promise<void> {
    try {
      const queueRef = doc(db, this.COLLECTION_NAME, queueItemId);
      await updateDoc(queueRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
        metadata: {
          cancelledAt: new Date(),
        }
      });

      console.log(`Cancelled queued notification ${queueItemId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
      throw error;
    }
  }

  // Clean up old completed/failed notifications
  async cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldItemsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', 'in', ['completed', 'failed', 'cancelled']),
        where('updatedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(oldItemsQuery);
      let deletedCount = 0;

      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        deletedCount++;
      }

      console.log(`Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Get failed notifications for manual retry
  async getFailedNotifications(limitCount: number = 50): Promise<QueuedNotification[]> {
    try {
      const failedQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'failed'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(failedQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueuedNotification));
    } catch (error) {
      console.error('Error getting failed notifications:', error);
      throw error;
    }
  }

  // Manually retry failed notification
  async retryFailedNotification(queueItemId: string): Promise<void> {
    try {
      const queueRef = doc(db, this.COLLECTION_NAME, queueItemId);
      await updateDoc(queueRef, {
        status: 'pending',
        attempts: 0, // Reset attempts
        lastError: null,
        nextRetryAt: null,
        updatedAt: serverTimestamp(),
      });

      console.log(`Manually retrying notification ${queueItemId}`);
    } catch (error) {
      console.error('Error retrying notification:', error);
      throw error;
    }
  }

  // Bulk retry failed notifications
  async retryAllFailedNotifications(): Promise<number> {
    try {
      const failedNotifications = await this.getFailedNotifications(100);
      let retriedCount = 0;

      for (const notification of failedNotifications) {
        await this.retryFailedNotification(notification.id);
        retriedCount++;
      }

      console.log(`Retried ${retriedCount} failed notifications`);
      return retriedCount;
    } catch (error) {
      console.error('Error retrying all failed notifications:', error);
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

  // Get queue health status
  async getQueueHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getQueueStats();
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for high failure rate
      if (stats.successRate < 80 && stats.totalProcessed > 10) {
        issues.push(`Low success rate: ${stats.successRate.toFixed(1)}%`);
        recommendations.push('Check external service configurations and API keys');
      }

      // Check for stuck processing items
      if (stats.processing > 10) {
        issues.push(`High number of processing items: ${stats.processing}`);
        recommendations.push('Check if queue processor is running properly');
      }

      // Check for high pending count
      if (stats.pending > 100) {
        issues.push(`High number of pending items: ${stats.pending}`);
        recommendations.push('Consider increasing processing frequency or batch size');
      }

      // Check for high failed count
      if (stats.failed > 50) {
        issues.push(`High number of failed items: ${stats.failed}`);
        recommendations.push('Review failed notifications and fix underlying issues');
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 2 ? 'critical' : 'warning';
      }

      return { status, issues, recommendations };
    } catch (error) {
      console.error('Error checking queue health:', error);
      return {
        status: 'critical',
        issues: ['Unable to check queue health'],
        recommendations: ['Check database connectivity and permissions'],
      };
    }
  }
}

// Export singleton instance
export const notificationQueueService = new NotificationQueueService();

// Auto-start processing in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  notificationQueueService.startProcessing();
}