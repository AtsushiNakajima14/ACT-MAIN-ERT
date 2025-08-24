import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950" data-testid="offline-alert">
      <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <strong>Offline Mode:</strong> You're currently offline. The app will continue to work with cached data.
        Emergency notifications and critical features remain functional.
      </AlertDescription>
    </Alert>
  );
}

export function NetworkStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-sm" data-testid="network-status">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-orange-500" />
          <span className="text-orange-600 dark:text-orange-400">Offline</span>
        </>
      )}
    </div>
  );
}

export function DataFreshnessIndicator({ data }: { data: any }) {
  if (!data || (!data.__offline && !data.__cached)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" data-testid="data-freshness">
      <AlertTriangle className="h-3 w-3" />
      {data.__offline && data.__stale && (
        <span>Showing stale offline data</span>
      )}
      {data.__offline && !data.__stale && (
        <span>Showing cached offline data</span>
      )}
      {data.__cached && !data.__offline && (
        <span>Showing cached data</span>
      )}
    </div>
  );
}