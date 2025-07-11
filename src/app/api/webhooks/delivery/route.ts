import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Webhook handler for delivery confirmations from external services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    // Validate webhook signature (implement based on your providers)
    const isValidSignature = await validateWebhookSignature(request);
    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Update delivery record based on provider
    switch (provider) {
      case 'sendgrid':
        await handleSendGridWebhook(body);
        break;
      case 'twilio':
        await handleTwilioWebhook(body);
        break;
      case 'fcm':
        await handleFCMWebhook(body);
        break;
      default:
        console.warn(`Unknown provider: ${provider}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function validateWebhookSignature(request: NextRequest): Promise<boolean> {
  // Implement signature validation based on provider
  // This is a simplified example - implement proper validation for each provider
  
  const signature = request.headers.get('x-signature') || request.headers.get('x-twilio-signature');
  
  if (!signature) {
    return false;
  }

  // Add your signature validation logic here
  // For SendGrid, Twilio, etc.
  
  return true; // Simplified for demo
}

interface SendGridEvent {
  sg_message_id?: string;
  event: string;
  timestamp: number;
  reason?: string;
  [key: string]: unknown;
}

interface SendGridWebhookData {
  events?: SendGridEvent[];
  [key: string]: unknown;
}

async function handleSendGridWebhook(data: SendGridWebhookData) {
  const events = data.events || [data];
  
  for (const event of events) {
    const { sg_message_id, event: eventType, timestamp } = event;
    
    if (!sg_message_id) continue;

    // Find delivery record by external ID
    const deliveryRef = doc(db, 'notificationDeliveries', String(sg_message_id));
    
    const status = mapSendGridEventToStatus(typeof eventType === 'string' ? eventType : '');
    const updateData: {
      status: string;
      updatedAt: ReturnType<typeof serverTimestamp>;
      deliveredAt?: Date;
      failureReason?: string;
    } = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (eventType === 'delivered') {
      if (typeof timestamp === 'number') {
        updateData.deliveredAt = new Date(timestamp * 1000);
      }
    } else if (eventType === 'bounce' || eventType === 'dropped') {
      updateData.failureReason = typeof event.reason === 'string' ? event.reason : 'Email delivery failed';
    }

    await updateDoc(deliveryRef, updateData);
  }
}

interface TwilioWebhookData {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string | number;
  ErrorMessage?: string;
  [key: string]: unknown;
}

async function handleTwilioWebhook(data: TwilioWebhookData) {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = data;
  
  if (!MessageSid) return;

  const deliveryRef = doc(db, 'notificationDeliveries', MessageSid);
  
  const status = mapTwilioStatusToStatus(MessageStatus);
  const updateData: {
    status: string;
    updatedAt: ReturnType<typeof serverTimestamp>;
    deliveredAt?: Date;
    failureReason?: string;
  } = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (MessageStatus === 'delivered') {
    updateData.deliveredAt = new Date();
  } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
    updateData.failureReason = ErrorMessage || `SMS delivery failed (${ErrorCode})`;
  }

  await updateDoc(deliveryRef, updateData);
}

interface FCMWebhookData {
  messageId: string;
  status: string;
  timestamp: number;
  error?: string;
  [key: string]: unknown;
}

async function handleFCMWebhook(data: FCMWebhookData) {
  const { messageId, status, timestamp, error } = data;
  
  if (!messageId) return;

  const deliveryRef = doc(db, 'notificationDeliveries', messageId);
  
  const updateData: {
    status: string;
    updatedAt: ReturnType<typeof serverTimestamp>;
    deliveredAt?: Date;
    failureReason?: string;
  } = {
    status: status === 'success' ? 'delivered' : 'failed',
    updatedAt: serverTimestamp(),
  };

  if (status === 'success') {
    updateData.deliveredAt = new Date(timestamp);
  } else {
    updateData.failureReason = error || 'Push notification delivery failed';
  }

  await updateDoc(deliveryRef, updateData);
}

function mapSendGridEventToStatus(eventType: string): string {
  switch (eventType) {
    case 'processed':
    case 'delivered':
      return 'delivered';
    case 'bounce':
    case 'dropped':
    case 'spamreport':
    case 'unsubscribe':
      return 'failed';
    default:
      return 'sent';
  }
}

function mapTwilioStatusToStatus(status: string): string {
  switch (status) {
    case 'delivered':
      return 'delivered';
    case 'failed':
    case 'undelivered':
      return 'failed';
    case 'sent':
      return 'sent';
    default:
      return 'pending';
  }
}
