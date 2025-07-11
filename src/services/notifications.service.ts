import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  NotificationFormData, 
  NotificationDelivery, 
  NotificationSettings,
  NotificationType,
  NotificationPriority 
} from '@/types/notification';

// Email service using SendGrid
class EmailService {
  private apiKey: string;
  private baseUrl = 'https://api.sendgrid.com/v3/mail/send';

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    textContent?: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured');
      return false;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: subject,
          }],
          from: {
            email: process.env.FROM_EMAIL || 'noreply@fidelita.com',
            name: process.env.FROM_NAME || 'Fidelita'
          },
          content: [
            {
              type: 'text/html',
              value: htmlContent
            },
            ...(textContent ? [{
              type: 'text/plain',
              value: textContent
            }] : [])
          ]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

// SMS service using Twilio
class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private baseUrl: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('Twilio credentials not configured');
      return false;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: this.fromNumber,
          To: to,
          Body: message
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }
}

// Push notification service using Firebase Cloud Messaging
class PushNotificationService {
  private serverKey: string;
  private baseUrl = 'https://fcm.googleapis.com/fcm/send';

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
  }

  async sendPushNotification(
    token: string, 
    title: string, 
    body: string, 
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.serverKey) {
      console.warn('FCM server key not configured');
      return false;
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title,
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          },
          data: data || {}
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  async sendToMultipleTokens(
    tokens: string[], 
    title: string, 
    body: string, 
    data?: Record<string, string>
  ): Promise<{ success: number; failure: number }> {
    if (!this.serverKey) {
      console.warn('FCM server key not configured');
      return { success: 0, failure: tokens.length };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: {
            title,
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          },
          data: data || {}
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: result.success || 0,
          failure: result.failure || 0
        };
      }

      return { success: 0, failure: tokens.length };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { success: 0, failure: tokens.length };
    }
  }
}

// Main notification service
export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
  }

  // Get user notification settings
  async getUserSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const settingsQuery = query(
        collection(db, 'notificationSettings'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: doc.id } as unknown as NotificationSettings;
      }

      // Return default settings if none exist
      return {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        categories: {
          system: true,
          membership: true,
          payment: true,
          event: true,
          general: true
        },
        priorities: {
          low: true,
          medium: true,
          high: true,
          urgent: true
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        frequency: 'immediate',
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Get user contact information
  async getUserContactInfo(userId: string): Promise<{
    email?: string;
    phone?: string;
    pushTokens?: string[];
  } | null> {
    try {
      // This would typically query your users collection
      // For now, we'll return a mock structure
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(userQuery);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return {
          email: userData.email,
          phone: userData.telefono,
          pushTokens: userData.pushTokens || []
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user contact info:', error);
      return null;
    }
  }

  // Check if notification should be sent based on user settings
  private shouldSendNotification(
    settings: NotificationSettings,
    notificationType: NotificationType,
    priority: NotificationPriority,
    category: string
  ): boolean {
    // Check category preferences
    if (!settings.categories[category as keyof typeof settings.categories]) {
      return false;
    }

    // Check priority preferences
    if (!settings.priorities[priority]) {
      return false;
    }

    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const { start, end } = settings.quietHours;
      
      if (start < end) {
        // Same day quiet hours (e.g., 22:00 to 08:00 next day)
        if (currentTime >= start || currentTime <= end) {
          // Only send urgent notifications during quiet hours
          return priority === 'urgent';
        }
      } else {
        // Cross-day quiet hours (e.g., 08:00 to 22:00)
        if (currentTime >= start && currentTime <= end) {
          return priority === 'urgent';
        }
      }
    }

    return true;
  }

  // Create delivery record
  private async createDeliveryRecord(
    notificationId: string,
    recipientId: string,
    channel: 'app' | 'email' | 'sms' | 'push',
    status: 'pending' | 'sent' | 'delivered' | 'failed'
  ): Promise<string> {
    const deliveryData: Omit<NotificationDelivery, 'id'> = {
      notificationId,
      recipientId,
      channel,
      status,
      retryCount: 0,
      metadata: {}
    };

    if (status === 'sent') {
      deliveryData.sentAt = new Date();
    }

    const docRef = await addDoc(collection(db, 'notificationDeliveries'), {
      ...deliveryData,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Update delivery record
  private async updateDeliveryRecord(
    deliveryId: string,
    updates: Partial<NotificationDelivery>
  ): Promise<void> {
    const deliveryRef = doc(db, 'notificationDeliveries', deliveryId);
    await updateDoc(deliveryRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Generate email template
  private generateEmailTemplate(
    title: string,
    message: string,
    type: NotificationType,
    actionUrl?: string,
    actionLabel?: string
  ): { html: string; text: string } {
    const typeColors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      announcement: '#8b5cf6'
    };

    const typeIcons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      announcement: '📢'
    };

    const color = typeColors[type];
    const icon = typeIcons[type];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">${icon}</div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${title}</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <div style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              
              ${actionUrl && actionLabel ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    ${actionLabel}
                  </a>
                </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Este mensaje fue enviado desde <strong>Fidelita</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                Si no deseas recibir estas notificaciones, puedes cambiar tus preferencias en tu perfil.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${icon} ${title}

${message}

${actionUrl && actionLabel ? `${actionLabel}: ${actionUrl}` : ''}

---
Este mensaje fue enviado desde Fidelita.
Si no deseas recibir estas notificaciones, puedes cambiar tus preferencias en tu perfil.
    `.trim();

    return { html, text };
  }

  // Send notification to a single user
  async sendNotificationToUser(
    notificationId: string,
    userId: string,
    notificationData: NotificationFormData
  ): Promise<{
    email: boolean;
    sms: boolean;
    push: boolean;
  }> {
    const results = {
      email: false,
      sms: false,
      push: false
    };

    try {
      // Get user settings and contact info
      const [settings, contactInfo] = await Promise.all([
        this.getUserSettings(userId),
        this.getUserContactInfo(userId)
      ]);

      if (!settings || !contactInfo) {
        console.warn(`No settings or contact info found for user ${userId}`);
        return results;
      }

      // Check if notification should be sent
      if (!this.shouldSendNotification(
        settings,
        notificationData.type,
        notificationData.priority,
        notificationData.category
      )) {
        console.log(`Notification blocked by user settings for user ${userId}`);
        return results;
      }

      // Send email notification
      if (settings.emailNotifications && contactInfo.email) {
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'email',
          'pending'
        );

        try {
          const { html, text } = this.generateEmailTemplate(
            notificationData.title,
            notificationData.message,
            notificationData.type,
            notificationData.actionUrl,
            notificationData.actionLabel
          );

          const emailSent = await this.emailService.sendEmail(
            contactInfo.email,
            notificationData.title,
            html,
            text
          );

          results.email = emailSent;
          
          await this.updateDeliveryRecord(deliveryId, {
            status: emailSent ? 'sent' : 'failed',
            sentAt: emailSent ? new Date() : undefined,
            failureReason: emailSent ? undefined : 'Email service error'
          });
        } catch (error) {
          console.error('Error sending email:', error);
          await this.updateDeliveryRecord(deliveryId, {
            status: 'failed',
            failureReason: 'Email sending failed'
          });
        }
      }

      // Send SMS notification
      if (settings.smsNotifications && contactInfo.phone) {
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'sms',
          'pending'
        );

        try {
          const smsMessage = `${notificationData.title}\n\n${notificationData.message}${
            notificationData.actionUrl ? `\n\nVer más: ${notificationData.actionUrl}` : ''
          }`;

          const smsSent = await this.smsService.sendSMS(
            contactInfo.phone,
            smsMessage
          );

          results.sms = smsSent;
          
          await this.updateDeliveryRecord(deliveryId, {
            status: smsSent ? 'sent' : 'failed',
            sentAt: smsSent ? new Date() : undefined,
            failureReason: smsSent ? undefined : 'SMS service error'
          });
        } catch (error) {
          console.error('Error sending SMS:', error);
          await this.updateDeliveryRecord(deliveryId, {
            status: 'failed',
            failureReason: 'SMS sending failed'
          });
        }
      }

      // Send push notification
      if (settings.pushNotifications && contactInfo.pushTokens && contactInfo.pushTokens.length > 0) {
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'push',
          'pending'
        );

        try {
          const pushResult = await this.pushService.sendToMultipleTokens(
            contactInfo.pushTokens,
            notificationData.title,
            notificationData.message,
            {
              notificationId,
              type: notificationData.type,
              actionUrl: notificationData.actionUrl || ''
            }
          );

          results.push = pushResult.success > 0;
          
          await this.updateDeliveryRecord(deliveryId, {
            status: pushResult.success > 0 ? 'sent' : 'failed',
            sentAt: pushResult.success > 0 ? new Date() : undefined,
            failureReason: pushResult.success === 0 ? 'Push notification failed' : undefined,
            metadata: {
              successCount: pushResult.success,
              failureCount: pushResult.failure
            }
          });
        } catch (error) {
          console.error('Error sending push notification:', error);
          await this.updateDeliveryRecord(deliveryId, {
            status: 'failed',
            failureReason: 'Push notification sending failed'
          });
        }
      }

    } catch (error) {
      console.error('Error sending notification to user:', error);
    }

    return results;
  }

  // Send notification to multiple users
  async sendNotificationToUsers(
    notificationId: string,
    userIds: string[],
    notificationData: NotificationFormData
  ): Promise<{
    totalUsers: number;
    emailSent: number;
    smsSent: number;
    pushSent: number;
  }> {
    const results = {
      totalUsers: userIds.length,
      emailSent: 0,
      smsSent: 0,
      pushSent: 0
    };

    // Process users in batches to avoid overwhelming external services
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId) => {
        const userResults = await this.sendNotificationToUser(
          notificationId,
          userId,
          notificationData
        );
        
        return userResults;
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        if (result.email) results.emailSent++;
        if (result.sms) results.smsSent++;
        if (result.push) results.pushSent++;
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Get delivery statistics for a notification
  async getDeliveryStats(notificationId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    byChannel: Record<string, number>;
  }> {
    try {
      const deliveriesQuery = query(
        collection(db, 'notificationDeliveries'),
        where('notificationId', '==', notificationId)
      );

      const snapshot = await getDocs(deliveriesQuery);
      const deliveries = snapshot.docs.map(doc => doc.data() as NotificationDelivery);

      const stats = {
        total: deliveries.length,
        sent: deliveries.filter(d => d.status === 'sent').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        byChannel: {} as Record<string, number>
      };

      // Count by channel
      deliveries.forEach(delivery => {
        stats.byChannel[delivery.channel] = (stats.byChannel[delivery.channel] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        byChannel: {}
      };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
