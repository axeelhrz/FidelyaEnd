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
  NotificationType
} from '@/types/notification';

// Enhanced Email service using SendGrid with real implementation
class EnhancedEmailService {
  private apiKey: string;
  private baseUrl = 'https://api.sendgrid.com/v3/mail/send';
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@fidelita.com';
    this.fromName = process.env.FROM_NAME || 'Fidelita';
  }

  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    textContent?: string,
    trackingId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    try {
      const payload = {
        personalizations: [{
          to: [{ email: to }],
          subject: subject,
          custom_args: trackingId ? { tracking_id: trackingId } : undefined,
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
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
        ],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
          subscription_tracking: { enable: false }
        },
        reply_to: {
          email: this.fromEmail,
          name: this.fromName
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const messageId = response.headers.get('X-Message-Id');
        console.log(`✅ Email sent successfully to ${to}`, { messageId });
        return { success: true, messageId: messageId || undefined };
      } else {
        const errorText = await response.text();
        console.error(`❌ SendGrid error:`, errorText);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Batch email sending
  async sendBatchEmails(
    emails: Array<{
      to: string;
      subject: string;
      htmlContent: string;
      textContent?: string;
      trackingId?: string;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const email of emails) {
      const result = await this.sendEmail(
        email.to,
        email.subject,
        email.htmlContent,
        email.textContent,
        email.trackingId
      );

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${email.to}: ${result.error}`);
      }

      // Rate limiting - SendGrid allows 600 emails per minute
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

// Enhanced SMS service using Twilio with real implementation
class EnhancedSMSService {
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

  async sendSMS(
    to: string, 
    message: string,
    trackingId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('Twilio credentials not configured');
      return { success: false, error: 'Twilio credentials not configured' };
    }

    try {
      const body = new URLSearchParams({
        From: this.fromNumber,
        To: to,
        Body: message,
        ...(trackingId && { StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms/${trackingId}` })
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SMS sent successfully to ${to}`, { sid: result.sid });
        return { success: true, messageId: result.sid };
      } else {
        const errorText = await response.text();
        console.error(`❌ Twilio error:`, errorText);
        return { success: false, error: `Twilio error: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Batch SMS sending
  async sendBatchSMS(
    messages: Array<{
      to: string;
      message: string;
      trackingId?: string;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const msg of messages) {
      const result = await this.sendSMS(msg.to, msg.message, msg.trackingId);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${msg.to}: ${result.error}`);
      }

      // Rate limiting - Twilio allows 1 message per second by default
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}

// Enhanced Push notification service using Firebase Cloud Messaging
class EnhancedPushNotificationService {
  private serverKey: string;
  private baseUrl = 'https://fcm.googleapis.com/fcm/send';

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
  }

  async sendPushNotification(
    token: string, 
    title: string, 
    body: string, 
    data?: Record<string, string>,
    trackingId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.serverKey) {
      console.warn('FCM server key not configured');
      return { success: false, error: 'FCM server key not configured' };
    }

    try {
      const payload = {
        to: token,
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          click_action: data?.actionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          tag: trackingId || 'default',
        },
        data: {
          ...data,
          tracking_id: trackingId || '',
          timestamp: Date.now().toString(),
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channel_id: 'fidelita_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success === 1) {
          console.log(`✅ Push notification sent successfully`, { messageId: result.multicast_id });
          return { success: true, messageId: result.multicast_id?.toString() };
        } else {
          console.error(`❌ FCM error:`, result);
          return { success: false, error: result.results?.[0]?.error || 'FCM send failed' };
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ FCM HTTP error:`, errorText);
        return { success: false, error: `FCM error: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendToMultipleTokens(
    tokens: string[], 
    title: string, 
    body: string, 
    data?: Record<string, string>,
    trackingId?: string
  ): Promise<{ success: number; failure: number; errors: string[] }> {
    if (!this.serverKey) {
      console.warn('FCM server key not configured');
      return { success: 0, failure: tokens.length, errors: ['FCM server key not configured'] };
    }

    try {
      const payload = {
        registration_ids: tokens,
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          click_action: data?.actionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          tag: trackingId || 'default',
        },
        data: {
          ...data,
          tracking_id: trackingId || '',
          timestamp: Date.now().toString(),
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
            channel_id: 'fidelita_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const errors: string[] = [];
        
        result.results?.forEach((res: { error?: string }, index: number) => {
          if (res.error) {
            errors.push(`Token ${index}: ${res.error}`);
          }
        });

        console.log(`✅ Batch push notification completed`, { 
          success: result.success || 0, 
          failure: result.failure || 0 
        });

        return {
          success: result.success || 0,
          failure: result.failure || 0,
          errors
        };
      } else {
        const errorText = await response.text();
        console.error(`❌ FCM batch error:`, errorText);
        return { 
          success: 0, 
          failure: tokens.length, 
          errors: [`FCM error: ${response.status}`] 
        };
      }
    } catch (error) {
      console.error('❌ Error sending batch push notifications:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: 0, 
        failure: tokens.length, 
        errors: [errorMsg] 
      };
    }
  }
}

// Main enhanced notification service
export class EnhancedNotificationService {
  private emailService: EnhancedEmailService;
  private smsService: EnhancedSMSService;
  private pushService: EnhancedPushNotificationService;

  constructor() {
    this.emailService = new EnhancedEmailService();
    this.smsService = new EnhancedSMSService();
    this.pushService = new EnhancedPushNotificationService();
  }

  // Get user notification settings with caching
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

      // Create default settings if none exist
      const defaultSettings: Omit<NotificationSettings, 'id'> = {
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

      const docRef = await addDoc(collection(db, 'notificationSettings'), {
        ...defaultSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { ...(defaultSettings as NotificationSettings), id: docRef.id } as NotificationSettings & { id: string };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Get user contact information with validation
  async getUserContactInfo(userId: string): Promise<{
    email?: string;
    phone?: string;
    pushTokens?: string[];
    name?: string;
  } | null> {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(userQuery);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        
        // Validate email format
        const email = userData.email;
        const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        // Validate phone format (basic validation)
        const phone = userData.telefono || userData.phone;
        const phoneValid = phone && /^\+?[\d\s\-\(\)]+$/.test(phone);
        
        return {
          email: emailValid ? email : undefined,
          phone: phoneValid ? phone : undefined,
          pushTokens: Array.isArray(userData.pushTokens) ? userData.pushTokens : [],
          name: userData.nombre || userData.name || 'Usuario'
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user contact info:', error);
      return null;
    }
  }

  // Enhanced template generation with better styling
  private generateEmailTemplate(
    title: string,
    message: string,
    type: NotificationType,
    userName: string = 'Usuario',
    actionUrl?: string,
    actionLabel?: string
  ): { html: string; text: string } {
    const typeConfig = {
      info: { color: '#3b82f6', icon: 'ℹ️', bgColor: '#eff6ff' },
      success: { color: '#10b981', icon: '✅', bgColor: '#f0fdf4' },
      warning: { color: '#f59e0b', icon: '⚠️', bgColor: '#fffbeb' },
      error: { color: '#ef4444', icon: '❌', bgColor: '#fef2f2' },
      announcement: { color: '#8b5cf6', icon: '📢', bgColor: '#faf5ff' }
    };

    const config = typeConfig[type];
    const currentYear = new Date().getFullYear();

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 40px 32px; text-align: center; }
            .icon { font-size: 48px; margin-bottom: 16px; }
            .title { color: white; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2; }
            .content { padding: 40px 32px; }
            .greeting { font-size: 18px; color: #374151; margin-bottom: 24px; }
            .message { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 32px; white-space: pre-line; }
            .button { display: inline-block; background: ${config.color}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
            .footer { background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; }
            .unsubscribe { margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; }
            .unsubscribe a { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">${config.icon}</div>
              <h1 class="title">${title}</h1>
            </div>
            
            <div class="content">
              <div class="greeting">Hola ${userName},</div>
              <div class="message">${message.replace(/\n/g, '<br>')}</div>
              
              ${actionUrl && actionLabel ? `
                <div style="text-align: center;">
                  <a href="${actionUrl}" class="button">${actionLabel}</a>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p class="footer-text">
                <strong>Fidelita</strong><br>
                Tu plataforma de gestión de socios y beneficios
              </p>
              <p class="unsubscribe">
                Si no deseas recibir estas notificaciones, puedes 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracion">cambiar tus preferencias</a>.
              </p>
              <p class="unsubscribe">© ${currentYear} Fidelita. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${config.icon} ${title}

Hola ${userName},

${message}

${actionUrl && actionLabel ? `${actionLabel}: ${actionUrl}\n` : ''}

---
Fidelita - Tu plataforma de gestión de socios y beneficios

Si no deseas recibir estas notificaciones, puedes cambiar tus preferencias en: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/configuracion

© ${currentYear} Fidelita. Todos los derechos reservados.
    `.trim();

    return { html, text };
  }

  // Enhanced delivery record creation with better metadata
  private async createDeliveryRecord(
    notificationId: string,
    recipientId: string,
    channel: 'app' | 'email' | 'sms' | 'push',
    status: 'pending' | 'sent' | 'delivered' | 'failed',
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    const deliveryData: Omit<NotificationDelivery, 'id'> = {
      notificationId,
      recipientId,
      channel,
      status,
      retryCount: 0,
      metadata: {
        ...metadata,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: Date.now(),
        version: '2.0'
      }
    };

    if (status === 'sent') {
      deliveryData.sentAt = new Date();
    }

    const docRef = await addDoc(collection(db, 'notificationDeliveries'), {
      ...deliveryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  // Send notification to a single user with enhanced tracking
  async sendNotificationToUser(
    notificationId: string,
    userId: string,
    notificationData: NotificationFormData
  ): Promise<{
    email: { success: boolean; messageId?: string; error?: string };
    sms: { success: boolean; messageId?: string; error?: string };
    push: { success: boolean; messageId?: string; error?: string };
  }> {
    const results: {
      email: { success: boolean; messageId?: string; error?: string };
      sms: { success: boolean; messageId?: string; error?: string };
      push: { success: boolean; messageId?: string; error?: string };
    } = {
      email: { success: false, error: 'Not attempted' },
      sms: { success: false, error: 'Not attempted' },
      push: { success: false, error: 'Not attempted' }
    };

    try {
      console.log(`📤 Starting notification delivery for user ${userId}`);

      // Get user settings and contact info
      const [settings, contactInfo] = await Promise.all([
        this.getUserSettings(userId),
        this.getUserContactInfo(userId)
      ]);

      if (!settings || !contactInfo) {
        console.warn(`⚠️ No settings or contact info found for user ${userId}`);
        return results;
      }

      const trackingId = `${notificationId}_${userId}_${Date.now()}`;

      // Send email notification
      if (settings.emailNotifications && contactInfo.email) {
        console.log(`📧 Sending email to ${contactInfo.email}`);
        
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'email',
          'pending',
          { email: contactInfo.email, trackingId }
        );

        try {
          const { html, text } = this.generateEmailTemplate(
            notificationData.title,
            notificationData.message,
            notificationData.type,
            contactInfo.name,
            notificationData.actionUrl,
            notificationData.actionLabel
          );

          const emailResult = await this.emailService.sendEmail(
            contactInfo.email,
            notificationData.title,
            html,
            text,
            trackingId
          );

          results.email = {
            success: emailResult.success,
            error: emailResult.error ?? '',
            messageId: emailResult.messageId
          };
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: emailResult.success ? 'sent' : 'failed',
            sentAt: emailResult.success ? serverTimestamp() : undefined,
            failureReason: emailResult.error,
            metadata: {
              email: contactInfo.email,
              trackingId,
              messageId: emailResult.messageId
            },
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('❌ Error sending email:', error);
          results.email = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: 'failed',
            failureReason: 'Email sending failed',
            updatedAt: serverTimestamp()
          });
        }
      }

      // Send SMS notification
      if (settings.smsNotifications && contactInfo.phone) {
        console.log(`📱 Sending SMS to ${contactInfo.phone}`);
        
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'sms',
          'pending',
          { phone: contactInfo.phone, trackingId }
        );

        try {
          const smsMessage = `${notificationData.title}\n\n${notificationData.message}${
            notificationData.actionUrl ? `\n\nVer más: ${notificationData.actionUrl}` : ''
          }\n\n- Fidelita`;

          const smsResult = await this.smsService.sendSMS(
            contactInfo.phone,
            smsMessage,
            trackingId
          );

          results.sms = smsResult;
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: smsResult.success ? 'sent' : 'failed',
            sentAt: smsResult.success ? serverTimestamp() : undefined,
            failureReason: smsResult.error,
            metadata: {
              phone: contactInfo.phone,
              trackingId,
              messageId: smsResult.messageId
            },
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('❌ Error sending SMS:', error);
          results.sms = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: 'failed',
            failureReason: 'SMS sending failed',
            updatedAt: serverTimestamp()
          });
        }
      }

      // Send push notification
      if (settings.pushNotifications && contactInfo.pushTokens && contactInfo.pushTokens.length > 0) {
        console.log(`🔔 Sending push notification to ${contactInfo.pushTokens.length} devices`);
        
        const deliveryId = await this.createDeliveryRecord(
          notificationId,
          userId,
          'push',
          'pending',
          { pushTokens: contactInfo.pushTokens, trackingId }
        );

        try {
          const pushResult = await this.pushService.sendToMultipleTokens(
            contactInfo.pushTokens,
            notificationData.title,
            notificationData.message,
            {
              notificationId,
              type: notificationData.type,
              actionUrl: notificationData.actionUrl || '',
              userId
            },
            trackingId
          );

          results.push = { 
            success: pushResult.success > 0,
            error: pushResult.errors.length > 0 ? pushResult.errors.join(', ') : undefined
          };
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: pushResult.success > 0 ? 'sent' : 'failed',
            sentAt: pushResult.success > 0 ? serverTimestamp() : undefined,
            failureReason: pushResult.errors.length > 0 ? pushResult.errors.join(', ') : undefined,
            metadata: {
              pushTokens: contactInfo.pushTokens,
              trackingId,
              successCount: pushResult.success,
              failureCount: pushResult.failure,
              errors: pushResult.errors
            },
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('❌ Error sending push notification:', error);
          results.push = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          
          await updateDoc(doc(db, 'notificationDeliveries', deliveryId), {
            status: 'failed',
            failureReason: 'Push notification sending failed',
            updatedAt: serverTimestamp()
          });
        }
      }

      console.log(`✅ Notification delivery completed for user ${userId}`, results);

    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
    }

    return results;
  }

  // Get comprehensive delivery statistics
  async getDeliveryStats(notificationId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    byChannel: Record<string, { sent: number; failed: number; rate: number }>;
    timeline: Array<{ timestamp: Date; status: string; channel: string }>;
  }> {
    try {
      const deliveriesQuery = query(
        collection(db, 'notificationDeliveries'),
        where('notificationId', '==', notificationId)
      );

      const snapshot = await getDocs(deliveriesQuery);
      const deliveries: NotificationDelivery[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          notificationId: data.notificationId,
          recipientId: data.recipientId,
          channel: data.channel,
          status: data.status,
          retryCount: data.retryCount ?? 0,
          metadata: data.metadata ?? {},
          createdAt: data.createdAt?.toDate() || new Date(),
          sentAt: data.sentAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          failureReason: data.failureReason,
        };
      });

      const stats = {
        total: deliveries.length,
        sent: deliveries.filter(d => d.status === 'sent').length,
        delivered: deliveries.filter(d => d.status === 'delivered').length,
        failed: deliveries.filter(d => d.status === 'failed').length,
        byChannel: {} as Record<string, { sent: number; failed: number; rate: number }>,
        timeline: [] as Array<{ timestamp: Date; status: string; channel: string }>
      };

      // Calculate by channel statistics
      const channels = ['email', 'sms', 'push'];
      channels.forEach(channel => {
        const channelDeliveries = deliveries.filter(d => d.channel === channel);
        const sent = channelDeliveries.filter(d => d.status === 'sent').length;
        const failed = channelDeliveries.filter(d => d.status === 'failed').length;
        const total = channelDeliveries.length;
        
        stats.byChannel[channel] = {
          sent,
          failed,
          rate: total > 0 ? (sent / total) * 100 : 0
        };
      });

      // Create timeline
      stats.timeline = deliveries
        .filter(d => d.sentAt || d.deliveredAt)
        .map(d => ({
          timestamp: d.deliveredAt || d.sentAt!,
          status: d.status,
          channel: d.channel
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return stats;
    } catch (error) {
      console.error('❌ Error getting delivery stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
