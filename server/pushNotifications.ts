import webpush from 'web-push';
import { storage } from './storage';
import { CONFIG } from './config';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || CONFIG.pushNotifications.vapidPublicKey;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || CONFIG.pushNotifications.vapidPrivateKey;
const VAPID_EMAIL = process.env.VAPID_EMAIL || CONFIG.pushNotifications.vapidEmail;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
  console.error('❌ VAPID configuration incomplete. Push notifications may not work properly.');
  console.log('Missing:', {
    publicKey: !VAPID_PUBLIC_KEY,
    privateKey: !VAPID_PRIVATE_KEY,
    email: !VAPID_EMAIL
  });
} else {
  console.log('✅ VAPID configuration loaded successfully');
}

webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { VAPID_PUBLIC_KEY };

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
}

export async function sendPushNotificationWithReliability(
  subscription: any,
  payload: PushNotificationPayload,
  alertId?: string,
  messageType: string = 'emergency_alert'
): Promise<{ success: boolean; deliveryId: string }> {
  const subscriptionRecord = await storage.getPushSubscriptionByEndpoint(subscription.endpoint);
  if (!subscriptionRecord) {
    throw new Error('Subscription not found in storage');
  }

  const delivery = await storage.createNotificationDelivery({
    subscriptionId: subscriptionRecord.id,
    alertId: alertId || null,
    messageType,
    status: 'sent',
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
  });

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || 'emergency',
      url: payload.url || '/operator',
      data: {
        ...payload.data,
        deliveryId: delivery.id,
        priority: messageType === 'emergency_alert' ? 'critical' : 'normal',
        timestamp: Date.now(),
      },
    });

    await webpush.sendNotification(subscription, notificationPayload);
    
    await storage.updateNotificationDeliveryStatus(delivery.id, 'delivered');
    await storage.updatePushSubscription(subscription.endpoint, {
      lastSuccessfulNotification: new Date(),
      failureCount: 0,
      lastUsed: new Date(),
    });
    
    console.log(`✅ Emergency notification delivered successfully to device: ${subscriptionRecord.deviceName || 'Unknown'}`);
    return { success: true, deliveryId: delivery.id };
    
  } catch (error) {
    console.error('Failed to send push notification:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await storage.updateNotificationDeliveryStatus(delivery.id, 'failed', errorMessage);
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        console.log(`🔄 Deactivating invalid push subscription: ${subscriptionRecord.deviceName}`);
        await storage.deactivatePushSubscription(subscription.endpoint);
      } else {
        const newFailureCount = (subscriptionRecord.failureCount || 0) + 1;
        await storage.updatePushSubscription(subscription.endpoint, {
          failureCount: newFailureCount,
          lastFailureReason: errorMessage,
        });
        
        if (newFailureCount >= 5) {
          console.log(`⚠️ Deactivating subscription after ${newFailureCount} failures: ${subscriptionRecord.deviceName}`);
          await storage.deactivatePushSubscription(subscription.endpoint);
        }
      }
    }
    
    return { success: false, deliveryId: delivery.id };
  }
}

export async function sendPushNotification(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  const subscription = {
    endpoint,
    keys: {
      p256dh: p256dhKey,
      auth: authKey,
    },
  };
  
  const result = await sendPushNotificationWithReliability(subscription, payload);
  return result.success;
}

export async function sendNotificationToAllOperators(
  payload: PushNotificationPayload, 
  alertId?: string,
  messageType: string = 'emergency_alert'
): Promise<{ successful: number; failed: number; total: number }> {
  try {
    const subscriptions = await storage.getActivePushSubscriptions();
    
    if (subscriptions.length === 0) {
      console.log('⚠️ No active push subscriptions found for emergency notification');
      return { successful: 0, failed: 0, total: 0 };
    }

    console.log(`📡 Broadcasting ${messageType} to ${subscriptions.length} active devices...`);
    
    const notifications = subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dhKey,
          auth: sub.authKey,
        },
      };
      
      return await sendPushNotificationWithReliability(subscription, payload, alertId, messageType);
    });

    const results = await Promise.allSettled(notifications);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    const failed = results.length - successful;
    
    console.log(`📊 Emergency notification results: ${successful} delivered, ${failed} failed out of ${results.length} devices`);
    
    if (failed > 0) {
      setTimeout(() => retryFailedNotifications(), 30000);
    }
    
    return { successful, failed, total: results.length };
  } catch (error) {
    console.error('Failed to send emergency notifications:', error);
    return { successful: 0, failed: 0, total: 0 };
  }
}

export async function retryFailedNotifications(): Promise<void> {
  try {
    const failedDeliveries = await storage.getFailedNotificationDeliveries();
    
    if (failedDeliveries.length === 0) {
      return;
    }
    
    console.log(`🔄 Retrying ${failedDeliveries.length} failed notifications...`);
    
    for (const delivery of failedDeliveries) {
      try {
        const subscription = await storage.getPushSubscriptionByEndpoint(
          (await storage.getPushSubscriptions()).find(s => s.id === delivery.subscriptionId)?.endpoint || ''
        );
        
        if (!subscription || !subscription.isActive) {
          continue;
        }
        
        const retryCount = (delivery.retryCount || 0) + 1;
        const maxRetries = delivery.maxRetries || 3;
        
        if (retryCount > maxRetries) {
          console.log(`❌ Abandoning notification delivery after ${retryCount} attempts`);
          await storage.updateNotificationDeliveryStatus(delivery.id, 'abandoned');
          continue;
        }
        
        const backoffDelay = Math.pow(2, retryCount - 1) * 1000;
        const jitter = Math.random() * 500;
        const totalDelay = Math.min(backoffDelay + jitter, 30000);
        
        console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${Math.round(totalDelay)}ms for delivery ${delivery.id}`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        
        let retryPayload: PushNotificationPayload;
        if (delivery.messageType === 'emergency_alert') {
          retryPayload = {
            title: '🚨 URGENT: Emergency Alert (Retry)',
            body: 'Critical emergency notification - please check immediately',
            tag: 'emergency-retry',
            url: '/operator',
            data: { type: 'emergency_alert', priority: 'critical', isRetry: true }
          };
        } else {
          retryPayload = {
            title: '📢 Important Notification (Retry)',
            body: 'You have an important notification waiting',
            tag: 'notification-retry',
            url: '/operator',
            data: { type: delivery.messageType, isRetry: true }
          };
        }
        
        const webPushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey,
          },
        };
        
        await storage.updateNotificationDeliveryRetryCount(delivery.id, retryCount);
        
        try {
          const result = await sendPushNotificationWithReliability(
            webPushSubscription, 
            retryPayload, 
            delivery.alertId || undefined, 
            delivery.messageType
          );
          
          if (result.success) {
            console.log(`✅ Retry ${retryCount}/${maxRetries} successful for device: ${subscription.deviceName}`);
          } else {
            console.log(`❌ Retry ${retryCount}/${maxRetries} failed for device: ${subscription.deviceName}`);
          }
        } catch (retrySpecificError) {
          console.error(`❌ Retry ${retryCount}/${maxRetries} exception for device ${subscription.deviceName}:`, retrySpecificError);
          
          if (retryCount >= maxRetries) {
            await storage.updateNotificationDeliveryStatus(delivery.id, 'abandoned', 
              `Final retry failed: ${retrySpecificError instanceof Error ? retrySpecificError.message : 'Unknown error'}`);
          }
        }
        
      } catch (retryError) {
        console.error('Error during notification retry:', retryError);
      }
    }
  } catch (error) {
    console.error('Failed to retry notifications:', error);
  }
}

export async function sendNotificationToAllOperatorsLegacy(payload: PushNotificationPayload): Promise<void> {
  await sendNotificationToAllOperators(payload);
}

export async function sendIncidentNotification(incident: any): Promise<void> {
  const payload: PushNotificationPayload = {
    title: '🚨 New Emergency Incident',
    body: `${incident.priority.toUpperCase()}: ${incident.title} at ${incident.location}`,
    tag: `incident-${incident.id}`,
    url: '/operator',
    data: {
      type: 'incident',
      id: incident.id,
      priority: incident.priority,
    },
  };

  await sendNotificationToAllOperators(payload);
}

export async function sendHelpRequestNotification(report: any): Promise<void> {
  const isEmergency = report.type === 'emergency_report';
  
  const payload: PushNotificationPayload = {
    title: isEmergency ? '🚨 Emergency Help Request' : '📢 New Help Request',
    body: `${report.title || 'Help needed'} at ${report.location}`,
    tag: `report-${report.id}`,
    url: '/operator',
    data: {
      type: 'user-report',
      id: report.id,
      reportType: report.type,
      priority: report.priority,
    },
  };

  await sendNotificationToAllOperators(payload);
}