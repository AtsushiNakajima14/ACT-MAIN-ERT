import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOnlineStatusWithCallback(callback?: () => void) {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      setWasOffline(false);
      if (callback) {
        setTimeout(callback, 1000);
      }
      
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          if ('sync' in registration) {
            console.log('📶 Back online - registering sync for offline submissions');
            (registration as any).sync.register('sync-all-offline').catch((error: any) => {
              console.error('Failed to register background sync:', error);
            });
          }
        });
      }
    }
  }, [isOnline, wasOffline, callback]);

  return { isOnline, wasOffline };
}

// Hook specifically for handling offline submissions sync
export function useOfflineSubmissionSync() {
  const { isOnline } = useOnlineStatusWithCallback();
  
  useEffect(() => {
    if (isOnline && 'serviceWorker' in navigator) {
      // Check if we have any queued submissions and sync them
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          (registration as any).sync.register('offline-submissions').catch((error: any) => {
            console.error('Failed to sync offline submissions:', error);
          });
        }
      });
    }
  }, [isOnline]);
  
  return { isOnline };
}