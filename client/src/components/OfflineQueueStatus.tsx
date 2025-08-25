import { useState, useEffect } from 'react';
import { Clock, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineQueueStatus() {
  const [queuedCount, setQueuedCount] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const checkQueuedSubmissions = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('offline-submissions-v1');
          const requests = await cache.keys();
          setQueuedCount(requests.length);
          setHasChecked(true);
        } catch (error) {
          console.error('Failed to check offline queue:', error);
          setHasChecked(true);
        }
      } else {
        setHasChecked(true);
      }
    };

    checkQueuedSubmissions();
    
    // Check periodically
    const interval = setInterval(checkQueuedSubmissions, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for service worker messages about queue changes
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'submission-queued') {
        setQueuedCount(prev => prev + 1);
      } else if (event.data?.type === 'submission-success') {
        setQueuedCount(prev => Math.max(0, prev - 1));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  if (!hasChecked || queuedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert 
        className={`border-2 shadow-lg ${
          isOnline 
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' 
            : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
        }`}
        data-testid="offline-queue-status"
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        )}
        <AlertDescription className={
          isOnline 
            ? 'text-blue-800 dark:text-blue-200' 
            : 'text-orange-800 dark:text-orange-200'
        }>
          <strong>
            {queuedCount} submission{queuedCount !== 1 ? 's' : ''} queued
          </strong>
          <br />
          {isOnline 
            ? 'Syncing with server...' 
            : 'Will sync when connection returns'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
}