import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Shield, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSubscribed,
    isSupported,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleToggleNotifications = async () => {
    setLastError(null);
    
    try {
      let success = false;
      
      if (isSubscribed) {
        success = await unsubscribe();
      } else {
        success = await subscribe();
      }
      
      if (success) {
        setRetryCount(0);
      } else {
        setRetryCount(prev => prev + 1);
        setLastError(isSubscribed ? 'Failed to disable notifications' : 'Failed to enable notifications');
      }
    } catch (error) {
      setRetryCount(prev => prev + 1);
      setLastError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="destructive" data-testid="badge-not-supported">Not Supported</Badge>;
    }
    
    if (notificationPermission === 'denied') {
      return <Badge variant="destructive" data-testid="badge-blocked">Blocked</Badge>;
    }
    
    if (isSubscribed) {
      return <Badge variant="default" className="bg-green-500" data-testid="badge-enabled">Enabled</Badge>;
    }
    
    return <Badge variant="secondary" data-testid="badge-disabled">Disabled</Badge>;
  };

  const getIcon = () => {
    if (isSubscribed) {
      return <Bell className="h-5 w-5 text-green-500" />;
    }
    return <BellOff className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card className="w-full max-w-md" data-testid="card-notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="title-emergency-alerts">
          {getIcon()}
          Emergency Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium" data-testid="text-force-notifications">
              Force Notifications
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-notification-description">
              Get alerts even when the app is closed
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="notifications"
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={!isSupported || isLoading || notificationPermission === 'denied'}
            data-testid="switch-notifications"
          />
          <label htmlFor="notifications" className="text-sm font-medium">
            Enable emergency alerts
          </label>
        </div>

        {lastError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-xs text-red-700 dark:text-red-300">{lastError}</p>
                {retryCount > 1 && (
                  <p className="text-xs text-red-600 dark:text-red-400">Retry attempt: {retryCount}</p>
                )}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLastError(null);
                    handleToggleNotifications();
                  }}
                  disabled={isLoading}
                  className="h-6 text-xs px-2 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isSupported && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              <p className="font-medium">Browser Not Supported</p>
              <p>Your browser doesn't support push notifications.</p>
              <div className="space-y-1">
                <p className="font-medium">Compatible browsers:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Chrome 50+ or Firefox 44+</li>
                  <li>Safari 16+ (macOS 13+)</li>
                  <li>Edge 79+</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300">
              <p className="font-medium">Notifications Blocked</p>
              <p>Please enable notifications in your browser settings to receive emergency alerts.</p>
            </div>
          </div>
        )}

        {isSupported && notificationPermission !== 'denied' && (
          <div className="space-y-2">
            <Button
              onClick={handleToggleNotifications}
              disabled={isLoading}
              variant={lastError ? "destructive" : isSubscribed ? "destructive" : "default"}
              className="w-full"
              data-testid={isSubscribed ? "button-disable-alerts" : "button-enable-alerts"}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </span>
              ) : isSubscribed ? (
                'Disable Emergency Alerts'
              ) : (
                'Enable Emergency Alerts'
              )}
            </Button>

            {isSubscribed && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5" />
                <div className="text-xs text-green-700 dark:text-green-300">
                  <p className="font-medium">Emergency Alerts Active</p>
                  <p>You will receive critical notifications for incidents and help requests, even when this tab is closed or your device is idle.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}