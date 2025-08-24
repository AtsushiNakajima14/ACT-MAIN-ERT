import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  deviceType?: string;
  deviceName?: string;
  userAgent?: string;
  platform?: string;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [vapidPublicKey, setVapidPublicKey] = useState<string>('');

  useEffect(() => {
    checkNotificationSupport();
    checkExistingSubscription();
    fetchVapidPublicKey();
  }, []);

  const fetchVapidPublicKey = async () => {
    try {
      const response = await fetch('/api/vapid-public-key');
      if (response.ok) {
        const data = await response.json();
        setVapidPublicKey(data.publicKey);
      } else {
        console.error('Failed to fetch VAPID public key');
        setVapidPublicKey('BDhdybofVzDW3l9W1fJhhNQFQiBjc2y7E1l0bAzPDG_TPw0Sw8wTMu_rkdja_pQtLUZJRHT_85m4yIKmJa-w77Y');
      }
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      setVapidPublicKey('BDhdybofVzDW3l9W1fJhhNQFQiBjc2y7E1l0bAzPDG_TPw0Sw8wTMu_rkdja_pQtLUZJRHT_85m4yIKmJa-w77Y');
    }
  };

  const checkNotificationSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('Push notifications are not supported in this browser');
    }
  };

  const checkExistingSubscription = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      try {
        toast({
          title: 'Not Supported',
          description: 'Push notifications are not supported in this browser',
          variant: 'destructive',
        });
      } catch (error) {
        console.error('Toast error:', error);
      }
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        try {
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive emergency alerts even when the app is closed',
          });
        } catch (error) {
          console.error('Toast error:', error);
        }
        return true;
      } else if (permission === 'denied') {
        try {
          toast({
            title: 'Notifications Blocked',
            description: 'Please enable notifications in your browser settings to receive emergency alerts',
            variant: 'destructive',
          });
        } catch (error) {
          console.error('Toast error:', error);
        }
        return false;
      } else {
        try {
          toast({
            title: 'Permission Required',
            description: 'Please allow notifications to receive emergency alerts',
            variant: 'destructive',
          });
        } catch (error) {
          console.error('Toast error:', error);
        }
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      try {
        toast({
          title: 'Error',
          description: 'Failed to request notification permission',
          variant: 'destructive',
        });
      } catch (toastError) {
        console.error('Toast error:', toastError);
      }
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    if (isLoading) {
      console.log('Subscription already in progress, skipping');
      return false;
    }
    
    setIsLoading(true);
    
    try {
      
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const p256dhBuffer = pushSubscription.getKey('p256dh');
      const authBuffer = pushSubscription.getKey('auth');
      
      if (!p256dhBuffer || !authBuffer) {
        throw new Error('Unable to get encryption keys from push subscription. Your browser may not fully support push notifications.');
      }
      
      const p256dhKey = arrayBufferToBase64(p256dhBuffer);
      const authKey = arrayBufferToBase64(authBuffer);
      
      const deviceInfo = detectDeviceInfo();
      
      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        p256dhKey,
        authKey,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
        userAgent: navigator.userAgent,
        platform: deviceInfo.platform,
      };

      console.log('Sending subscription data:', { 
        endpoint: subscriptionData.endpoint.substring(0, 50) + '...', 
        hasP256dh: !!p256dhKey,
        hasAuth: !!authKey 
      });

      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Subscription failed:', errorData);
        throw new Error(errorData.message || 'Failed to save subscription');
      }

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      
      try {
        toast({
          title: 'Emergency Alerts Enabled',
          description: 'You will now receive force notifications for incidents and help requests',
        });
      } catch (error) {
        console.error('Toast error:', error);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      setIsLoading(false);
      
      let errorMessage = 'Failed to enable emergency alerts. Please try again.';
      let errorTitle = 'Subscription Failed';
      
      if (error instanceof Error) {
        if (error.message.includes('VAPID')) {
          errorMessage = 'Push notification service temporarily unavailable. Please try again.';
          errorTitle = 'Service Temporarily Unavailable';
        } else if (error.message.includes('encryption keys')) {
          errorMessage = 'Your browser doesn\'t fully support push notifications. Try updating your browser.';
          errorTitle = 'Browser Compatibility Issue';
        } else if (error.message.includes('Server temporarily unavailable')) {
          errorMessage = error.message;
          errorTitle = 'Server Issue';
        } else {
          errorMessage = error.message;
        }
      }
      
      try {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        });
      } catch (toastError) {
        console.error('❌ Toast error:', toastError);
      
        try {
          alert(`${errorTitle}: ${errorMessage}`);
        } catch (alertError) {
          console.error('❌ Even alert fallback failed:', alertError);
        }
      }
      
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;
    
    setIsLoading(true);
    
    try {
      await subscription.unsubscribe();
      
      await fetch('/api/push-subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
      setIsSubscribed(false);
      
      try {
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive emergency alerts',
        });
      } catch (error) {
        console.error('Toast error:', error);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      try {
        toast({
          title: 'Error',
          description: 'Failed to disable notifications',
          variant: 'destructive',
        });
      } catch (toastError) {
        console.error('Toast error:', toastError);
      }
      setIsLoading(false);
      return false;
    }
  };

  const scheduleSubscriptionHealthCheck = () => {
    
    const healthCheckInterval = setInterval(async () => {
      if (isSubscribed && subscription) {
        try {
          
          const response = await fetch('/api/push-subscription/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          const isValid = response.ok;
          
          if (!isValid) {
            console.warn('⚠️ Subscription no longer valid, cleaning up');
            setSubscription(null);
            setIsSubscribed(false);
            clearInterval(healthCheckInterval);
            
            try {
              toast({
                title: 'Notification Settings Changed',
                description: 'Your notification subscription needs to be renewed',
                variant: 'destructive',
              });
            } catch (error) {
              console.error('❌ Toast error during health check:', error);
            }
          }
        } catch (error) {
          console.error('❌ Health check error:', error);
        }
      } else {
        clearInterval(healthCheckInterval);
      }
    }, 5 * 60 * 1000); 
    
    return () => clearInterval(healthCheckInterval);
  };

  return {
    isSubscribed,
    isSupported,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

function detectDeviceInfo(): {
  deviceType: string;
  deviceName: string;
  platform: string;
} {
  const userAgent = navigator.userAgent.toLowerCase();
  
  let deviceType = 'desktop';
  let platform = 'unknown';
  let deviceName = 'Unknown Device';
  
  if (/android/.test(userAgent)) {
    deviceType = 'mobile';
    platform = 'Android';
    deviceName = 'Android Device';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    deviceType = /ipad/.test(userAgent) ? 'tablet' : 'mobile';
    platform = 'iOS';
    deviceName = /ipad/.test(userAgent) ? 'iPad' : 'iPhone';
  } else if (/tablet/.test(userAgent)) {
    deviceType = 'tablet';
    deviceName = 'Tablet';
  }
  
  if (deviceType === 'desktop') {
    if (/windows/.test(userAgent)) {
      platform = 'Windows';
      deviceName = 'Windows PC';
    } else if (/macintosh|mac os x/.test(userAgent)) {
      platform = 'macOS';
      deviceName = 'Mac';
    } else if (/linux/.test(userAgent)) {
      platform = 'Linux';
      deviceName = 'Linux PC';
    }
  }
  
  try {
    if (typeof window !== 'undefined' && 'screen' in window) {
      const screen = window.screen;
      deviceName += ` (${screen.width}x${screen.height})`;
    }
  } catch (e) {
   
  }
  
  return { deviceType, deviceName, platform };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}