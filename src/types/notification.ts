export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationCategory = 'system' | 'membership' | 'payment' | 'event' | 'general';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  category: NotificationCategory;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    senderId?: string;
    senderName?: string;
    senderRole?: string;
    recipientCount?: number;
    recipientIds?: string[];
    tags?: string[];
    attachments?: string[];
    relatedEntityId?: string;
    relatedEntityType?: string;
    customData?: Record<string, unknown>;
  };
  read: boolean;
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  tags?: string[];
  recipientIds?: string[];
  metadata?: {
    relatedEntityId?: string;
    relatedEntityType?: string;
    customData?: Record<string, unknown>;
  };
}

export interface NotificationFilters {
  status?: NotificationStatus[];
  type?: NotificationType[];
  priority?: NotificationPriority[];
  category?: NotificationCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  senderId?: string;
  recipientId?: string;
  tags?: string[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<NotificationCategory, number>;
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  averageResponseTime?: number;
  mostActiveHour?: number;
  topSenders?: Array<{
    senderId: string;
    senderName: string;
    count: number;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  variables?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  categories: Record<NotificationCategory, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  updatedAt: Date;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  recipientId: string;
  channel: 'app' | 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}