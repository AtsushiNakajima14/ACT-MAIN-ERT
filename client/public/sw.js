const CACHE_NAME = 'emergency-notifications-v3';
const API_CACHE_NAME = 'emergency-api-v3';
const ASSETS_CACHE_NAME = 'emergency-assets-v3';
const OFFLINE_QUEUE_NAME = 'offline-submissions-v1';
const OFFLINE_NOTIFICATIONS_DB = 'offline-notifications';

const CACHE_CONFIG = {
  APP_SHELL: [
    '/',
    '/operator',
    '/login',
    '/src/main.tsx',
    '/src/App.tsx',
    '/favicon.ico',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-192x192-maskable.png',
    '/icon-512x512.png',
    '/icon-512x512-maskable.png',
    '/screenshot-wide.png',
    '/screenshot-narrow.png'
  ],
  API_ENDPOINTS: [
    '/api/emergency-alerts',
    '/api/team-members',
    '/api/system-status',
    '/api/user/profile'
  ],
  STATIC_ASSETS: /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|eot)$/,
  API_CACHE_DURATION: 5 * 60 * 1000,
  ASSET_CACHE_DURATION: 24 * 60 * 60 * 1000
};

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing with full offline support');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('💾 Caching app shell...');
        return cache.addAll(CACHE_CONFIG.APP_SHELL).catch(error => {
          console.error('❌ Failed to cache some app shell files:', error);
          return Promise.allSettled(CACHE_CONFIG.APP_SHELL.map(url => 
            cache.add(url).catch(err => console.warn(`⚠️ Failed to cache ${url}:`, err))
          ));
        });
      }),
      caches.open(API_CACHE_NAME).then(cache => {
        console.log('💾 API cache initialized');
        return cache;
      }),
      caches.open(ASSETS_CACHE_NAME).then(cache => {
        console.log('💾 Assets cache initialized');
        return cache;
      })
    ]).catch(error => {
      console.error('❌ Cache setup failed:', error);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker activating with full offline support');
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, ASSETS_CACHE_NAME, 'delivery-confirmations'];
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ]).catch(error => {
      console.error('❌ Service Worker activation error:', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle all requests from same origin and fonts
  if (!url.origin.includes(self.location.origin) && !url.href.includes('fonts.googleapis.com')) return;
  
  // Handle POST requests for offline submissions
  if (request.method === 'POST' && url.pathname.startsWith('/api/')) {
    event.respondWith(handleOfflineSubmission(request));
    return;
  }
  
  // Handle GET requests normally
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleAPIRequest(request));
    } else if (CACHE_CONFIG.STATIC_ASSETS.test(url.pathname) || url.href.includes('fonts.googleapis.com')) {
      event.respondWith(handleAssetRequest(request));
    } else {
      event.respondWith(handleAppShellRequest(request));
    }
  }
});

async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const url = new URL(request.url);
  
  try {
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      const cachedResponse = new Response(await responseClone.text(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'cached-at': Date.now().toString()
        }
      });
      cache.put(request, cachedResponse);
      console.log('🌐 API response cached:', url.pathname);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Network failed for API request, trying cache:', url.pathname);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('cached-at');
      const isStale = cachedAt && (Date.now() - parseInt(cachedAt) > CACHE_CONFIG.API_CACHE_DURATION);
      
      if (isStale) {
        console.log('⚠️ Serving stale cached data for:', url.pathname);
      } else {
        console.log('💾 Serving cached data for:', url.pathname);
      }
      
      return cachedResponse;
    }
    
    if (CACHE_CONFIG.API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
      return new Response(JSON.stringify(getOfflineFallbackData(url.pathname)), {
        status: 200,
        statusText: 'OK (Offline)',
        headers: {
          'Content-Type': 'application/json',
          'offline-fallback': 'true'
        }
      });
    }
    
    throw error;
  }
}

async function handleAssetRequest(request) {
  const cache = await caches.open(ASSETS_CACHE_NAME);
  

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('💾 Serving cached asset:', request.url);
    return cachedResponse;
  }
  
  try {

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🌐 Asset cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Asset request failed:', request.url);
    throw error;
  }
}

async function handleAppShellRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('💾 Serving cached app shell:', request.url);
    return cachedResponse;
  }
  
  try {

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('🌐 App shell cached:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ App shell request failed, trying fallback:', request.url);
    
    if (request.mode === 'navigate') {
      const fallbackResponse = await cache.match('/operator');
      if (fallbackResponse) {
        console.log('💾 Serving operator page as fallback');
        return fallbackResponse;
      }
    }
    
    throw error;
  }
}

function getOfflineFallbackData(pathname) {
  const timestamp = Date.now();
  
  if (pathname.includes('/api/emergency-alerts')) {
    return JSON.parse(localStorage.getItem('last-emergency-alerts') || '[]').map(alert => ({
      ...alert,
      __offline: true,
      __cached: true,
      __source: 'localStorage'
    }));
  }
  
  if (pathname.includes('/api/team-members')) {
    const defaultTeam = [
      {
        id: 'offline-team-1',
        name: 'Emergency Team (Offline)',
        role: 'First Responder',
        status: 'available',
        contactNumber: 'N/A (Offline)',
        specializations: ['Emergency Response'],
        __offline: true,
        __fallback: true
      }
    ];
    const cachedTeam = JSON.parse(localStorage.getItem('last-team-members') || JSON.stringify(defaultTeam));
    return cachedTeam.map(member => ({
      ...member,
      __offline: true,
      __cached: true,
      __source: 'localStorage'
    }));
  }
  
  if (pathname.includes('/api/system-status')) {
    const defaultStatus = [
      {
        id: 'offline-status-1',
        component: 'Emergency Response System',
        status: 'offline',
        level: 0,
        notes: 'System running in offline mode',
        lastUpdated: new Date(timestamp).toISOString(),
        __offline: true,
        __fallback: true
      }
    ];
    const cachedStatus = JSON.parse(localStorage.getItem('last-system-status') || JSON.stringify(defaultStatus));
    return cachedStatus.map(status => ({
      ...status,
      __offline: true,
      __cached: true,
      __source: 'localStorage'
    }));
  }
  
  if (pathname.includes('/api/incidents')) {
    const cachedIncidents = JSON.parse(localStorage.getItem('last-incidents') || '[]');
    return cachedIncidents.map(incident => ({
      ...incident,
      __offline: true,
      __cached: true,
      __source: 'localStorage'
    }));
  }
  
  if (pathname.includes('/api/user-reports')) {
    const cachedReports = JSON.parse(localStorage.getItem('last-user-reports') || '[]');
    return cachedReports.map(report => ({
      ...report,
      __offline: true,
      __cached: true,
      __source: 'localStorage'
    }));
  }
  
  if (pathname.includes('/api/dashboard-stats')) {
    return {
      activeIncidents: 0,
      teamOnDuty: '0/0',
      pendingReports: 0,
      resolvedReports: 0,
      __offline: true,
      __fallback: true,
      __source: 'fallback'
    };
  }
  
  if (pathname.includes('/api/vapid-public-key')) {
    return {
      publicKey: 'BDhdybofVzDW3l9W1fJhhNQFQiBjc2y7E1l0bAzPDG_TPw0Sw8wTMu_rkdja_pQtLUZJRHT_85m4yIKmJa-w77Y',
      __offline: true,
      __fallback: true
    };
  }
  
  // Generic API endpoint fallback
  if (pathname.startsWith('/api/')) {
    const isListEndpoint = !pathname.match(/\/[^\/]+\/[a-zA-Z0-9-]+$/); // Check if it's a list vs single item
    
    if (isListEndpoint) {
      return {
        __offline: true,
        __empty: true,
        __source: 'fallback',
        message: 'This data is not available offline. Your actions will be queued and synchronized when connection is restored.'
      };
    } else {
      return {
        __offline: true,
        __notFound: true,
        __source: 'fallback',
        message: 'This resource is not available offline.'
      };
    }
  }
  
  return {
    __offline: true,
    __error: true,
    message: 'This service is unavailable offline. Please check your connection.'
  };
}

self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received at:', new Date().toISOString());
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('📦 Notification payload:', data);
    } catch (e) {
      console.error('❌ Failed to parse notification data:', e);
      data = { 
        title: '🚨 Emergency Alert', 
        body: event.data.text() || 'Critical emergency notification - check immediately',
        data: { priority: 'critical', type: 'emergency_alert' }
      };
    }
  } else {
    // No data received - create fallback emergency notification
    console.warn('⚠️ Push notification received without data');
    data = {
      title: '🚨 Emergency Alert',
      body: 'Emergency notification received - please check the app immediately',
      data: { priority: 'critical', type: 'emergency_alert' }
    };
  }

  // Enhanced emergency detection
  const isEmergency = 
    data.title?.includes('Emergency') || 
    data.title?.includes('URGENT') ||
    data.data?.priority === 'critical' || 
    data.data?.type === 'emergency_alert' ||
    data.data?.type === 'emergency_report';
    
  const isCritical = data.data?.priority === 'critical';
  const isRetry = data.data?.isRetry === true;
  
  // Critical alerts get maximum attention
  const options = {
    title: data.title || '🚨 Emergency Alert',
    body: data.body || 'Critical emergency notification - check immediately',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || (isCritical ? 'critical-emergency' : 'emergency'),
    requireInteraction: true, // Always require interaction for emergency alerts
    silent: false, // Never silent for emergencies
    renotify: isRetry, // Re-alert for retry notifications
    // Enhanced vibration patterns based on criticality
    vibrate: isCritical 
      ? [500, 200, 500, 200, 500, 200, 500, 200, 500] // Critical emergency
      : isEmergency 
        ? [300, 100, 300, 100, 300, 100, 300] // Standard emergency
        : [200, 100, 200], // Standard notification
    actions: [
      {
        action: 'respond',
        title: isCritical ? '🚨 URGENT RESPONSE' : isEmergency ? '🚨 RESPOND NOW' : 'View Details',
        icon: '/favicon.ico'
      },
      {
        action: 'acknowledge',
        title: 'Acknowledge',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ],
    data: {
      url: data.url || '/operator',
      timestamp: Date.now(),
      deliveryId: data.deliveryId,
      priority: data.priority || 'normal',
      isEmergency,
      isCritical,
      ...data
    }
  };

  event.waitUntil(
    Promise.all([
      // Show the notification with error handling
      showNotificationWithFallback(options.title, options),
      // Store notification offline for reliability
      storeNotificationOffline(data, options),
      // Confirm delivery to server (with retry logic)
      confirmNotificationDeliveryWithRetry(data.data?.deliveryId),
      // Wake up all clients for critical alerts
      isCritical ? wakeUpAllClientsWithRetry(data) : Promise.resolve()
    ]).catch(error => {
      console.error('❌ Push notification handling failed:', error);
      // Show emergency fallback notification
      return showEmergencyFallbackNotification();
    })
  );
});

// Handle notification clicks with enhanced actions
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked, action:', event.action);
  
  const notificationData = event.notification.data;
  const deliveryId = notificationData?.deliveryId;
  
  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    // Track dismissal
    if (deliveryId) {
      trackNotificationAction(deliveryId, 'dismissed');
    }
    return;
  }
  
  if (event.action === 'acknowledge') {
    // Track acknowledgment
    if (deliveryId) {
      trackNotificationAction(deliveryId, 'acknowledged');
    }
    // Still open the app but mark as acknowledged
  }

  // For respond action or general click, open/focus the app
  event.waitUntil(
    Promise.all([
      // Track interaction
      deliveryId ? trackNotificationAction(deliveryId, 'clicked') : Promise.resolve(),
      // Open or focus app
      openOrFocusApp(notificationData)
    ])
  );
});

// Enhanced app opening with better URL handling
async function openOrFocusApp(notificationData) {
  const clients = await self.clients.matchAll({ type: 'window' });
  const baseUrl = self.location.origin;
  const targetUrl = notificationData?.url || '/operator';
  const fullUrl = baseUrl + targetUrl;
  
  console.log('🔍 Looking for existing app window...', fullUrl);
  
  // Check if app is already open
  for (const client of clients) {
    if (client.url.startsWith(baseUrl) && 'focus' in client) {
      console.log('✅ Found existing app window, focusing...');
      await client.focus();
      // Send message to navigate to the right page
      if (client.postMessage) {
        client.postMessage({
          type: 'navigate',
          url: targetUrl,
          notificationData
        });
      }
      return client;
    }
  }
  
  // Open new window if app is not open
  if (self.clients.openWindow) {
    console.log('🆕 Opening new app window...', fullUrl);
    return self.clients.openWindow(fullUrl);
  }
}

// Handle background sync for offline notifications AND submissions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  if (event.tag === 'emergency-sync') {
    event.waitUntil(handleBackgroundSync());
  } else if (event.tag === 'offline-submissions') {
    event.waitUntil(processOfflineSubmissions());
  } else if (event.tag === 'sync-all-offline') {
    event.waitUntil(Promise.all([
      handleBackgroundSync(),
      processOfflineSubmissions()
    ]));
  }
});

// Enhanced background sync for emergency notifications
async function handleBackgroundSync() {
  console.log('🔄 Background sync for emergency notifications started');
  
  try {
    // Check for pending emergency notifications
    const response = await fetch('/api/emergency-alerts/pending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const pendingAlerts = await response.json();
      console.log(`📬 Found ${pendingAlerts.length} pending emergency alerts`);
      
      // Show notifications for any missed critical alerts
      for (const alert of pendingAlerts) {
        if (alert.priority === 'critical') {
          await self.registration.showNotification(
            '🚨 MISSED CRITICAL ALERT',
            {
              body: `Critical alert while offline: ${alert.message}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'missed-critical',
              requireInteraction: true,
              vibrate: [500, 200, 500, 200, 500],
              data: {
                url: '/operator',
                alertId: alert.id,
                isMissed: true
              }
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Enhanced notification display with fallback handling
async function showNotificationWithFallback(title, options) {
  try {
    return await self.registration.showNotification(title, options);
  } catch (error) {
    console.error('❌ Failed to show notification:', error);
    // Try with simplified options
    const fallbackOptions = {
      title: title || '🚨 Emergency Alert',
      body: options.body || 'Critical emergency notification',
      icon: '/favicon.ico',
      requireInteraction: true,
      tag: 'emergency-fallback'
    };
    try {
      return await self.registration.showNotification(fallbackOptions.title, fallbackOptions);
    } catch (fallbackError) {
      console.error('❌ Even fallback notification failed:', fallbackError);
      throw fallbackError;
    }
  }
}

// Store notification offline for reliability
async function storeNotificationOffline(data, options) {
  try {
    const notificationRecord = {
      id: data.data?.deliveryId || Date.now().toString(),
      timestamp: Date.now(),
      title: options.title,
      body: options.body,
      data: data,
      priority: data.data?.priority || 'normal'
    };
    
    // Store in localStorage as fallback (IndexedDB might not be available)
    try {
      const storedNotifications = JSON.parse(localStorage.getItem('emergency-notifications') || '[]');
      storedNotifications.push(notificationRecord);
      // Keep only last 50 notifications
      if (storedNotifications.length > 50) {
        storedNotifications.splice(0, storedNotifications.length - 50);
      }
      localStorage.setItem('emergency-notifications', JSON.stringify(storedNotifications));
      console.log('💾 Notification stored offline:', notificationRecord.id);
    } catch (storageError) {
      console.warn('⚠️ Offline storage not available:', storageError);
    }
  } catch (error) {
    console.error('❌ Failed to store notification offline:', error);
  }
}

// Emergency fallback notification
async function showEmergencyFallbackNotification() {
  try {
    return await self.registration.showNotification('🚨 Emergency System Alert', {
      body: 'Emergency notification system active - please check the app',
      icon: '/favicon.ico',
      requireInteraction: true,
      tag: 'system-emergency',
      vibrate: [200, 100, 200, 100, 200]
    });
  } catch (error) {
    console.error('❌ Even emergency fallback failed:', error);
  }
}

// Enhanced delivery confirmation with retry logic
async function confirmNotificationDeliveryWithRetry(deliveryId) {
  if (!deliveryId) return;
  
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch('/api/notifications/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryId })
      });
      
      if (response.ok) {
        console.log('✅ Notification delivery confirmed:', deliveryId);
        return;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      retries--;
      console.error(`❌ Delivery confirmation failed (${3 - retries}/3):`, error);
      
      if (retries > 0) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      } else {
        // Store for retry when online
        try {
          const cache = await caches.open('delivery-confirmations');
          await cache.put(
            new Request(`/delivery-confirm/${deliveryId}`),
            new Response(JSON.stringify({ deliveryId, timestamp: Date.now() }))
          );
          console.log('💾 Stored delivery confirmation for offline retry');
        } catch (cacheError) {
          console.error('❌ Failed to cache delivery confirmation:', cacheError);
        }
      }
    }
  }
}

// Enhanced wake up clients with retry logic
async function wakeUpAllClientsWithRetry(data) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.log(`⏰ Waking up ${clients.length} clients for critical alert`);
    
    const promises = clients.map(async (client) => {
      if (client.postMessage) {
        try {
          client.postMessage({
            type: 'critical-alert',
            data: data,
            timestamp: Date.now()
          });
          return { success: true, clientId: client.id };
        } catch (error) {
          console.error('❌ Failed to wake client:', client.id, error);
          return { success: false, clientId: client.id, error };
        }
      }
      return { success: false, clientId: client.id, error: 'No postMessage support' };
    });
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`📊 Wake up results: ${successful}/${clients.length} clients notified`);
    
  } catch (error) {
    console.error('❌ Failed to wake up clients:', error);
  }
}

// Original delivery confirmation (kept for backward compatibility)
async function confirmNotificationDelivery(deliveryId) {
  return confirmNotificationDeliveryWithRetry(deliveryId);
}

// Track notification actions
async function trackNotificationAction(deliveryId, action) {
  if (!deliveryId) return;
  
  try {
    await fetch('/api/notifications/track-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deliveryId, action, timestamp: Date.now() })
    });
    console.log(`📊 Tracked action '${action}' for delivery:`, deliveryId);
  } catch (error) {
    console.error('❌ Failed to track action:', error);
  }
}

// Handle offline submission requests
async function handleOfflineSubmission(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first with fast timeout for better UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    console.log('🌐 Attempting network submission:', url.pathname);
    const networkResponse = await fetch(request.clone(), {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      console.log('✅ Network submission successful:', url.pathname);
      return networkResponse;
    } else {
      throw new Error(`Network error: ${networkResponse.status}`);
    }
  } catch (error) {
    console.log('📡 Network failed, queueing for offline:', url.pathname, error.message);
    
    // Queue the submission for later
    await queueOfflineSubmission(request);
    
    // Return immediate success response for UX
    const offlineResponse = {
      success: true,
      offline: true,
      message: 'Your emergency report has been queued and will be submitted when connection is restored.',
      timestamp: Date.now(),
      queuedForSync: true
    };
    
    return new Response(JSON.stringify(offlineResponse), {
      status: 200,
      statusText: 'OK (Queued Offline)',
      headers: {
        'Content-Type': 'application/json',
        'offline-queued': 'true'
      }
    });
  }
}

// Queue submission for offline processing
async function queueOfflineSubmission(request) {
  try {
    const url = new URL(request.url);
    const body = await request.clone().text();
    const headers = Object.fromEntries(request.headers.entries());
    
    const submission = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      url: request.url,
      method: request.method,
      headers: headers,
      body: body,
      timestamp: Date.now(),
      retries: 0,
      isEmergency: url.pathname.includes('user-reports') || url.pathname.includes('emergency')
    };
    
    // Store in cache for persistence
    const cache = await caches.open(OFFLINE_QUEUE_NAME);
    const queueResponse = new Response(JSON.stringify(submission));
    await cache.put(new Request(`/offline-queue/${submission.id}`), queueResponse);
    
    // Also store in IndexedDB via offlineStorage for better operator visibility
    try {
      // Notify clients to queue in IndexedDB for better operator visibility
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        if (client.postMessage) {
          client.postMessage({ 
            type: 'queue-in-indexeddb', 
            submission: submission 
          });
        }
      });
    } catch (idbError) {
      console.warn('⚠️ Could not notify clients for IndexedDB queuing:', idbError);
    }
    
    console.log('💾 Queued offline submission:', submission.id);
    
    // Notify all clients about the queued submission
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      if (client.postMessage) {
        client.postMessage({
          type: 'submission-queued',
          data: {
            id: submission.id,
            url: submission.url,
            timestamp: submission.timestamp,
            isEmergency: submission.isEmergency
          }
        });
      }
    });
    
    // Register background sync
    if (self.registration.sync) {
      await self.registration.sync.register('offline-submissions');
      console.log('🔄 Background sync registered for offline submissions');
    }
    
  } catch (error) {
    console.error('❌ Failed to queue offline submission:', error);
  }
}

// Process queued offline submissions with enhanced error handling
async function processOfflineSubmissions() {
  console.log('🔄 Processing queued offline submissions...');
  
  try {
    const cache = await caches.open(OFFLINE_QUEUE_NAME);
    const requests = await cache.keys();
    
    if (requests.length === 0) {
      console.log('📭 No queued submissions found');
      return { processed: 0, failed: 0, remaining: 0 };
    }
    
    console.log(`📬 Found ${requests.length} queued submissions to process`);
    
    let processed = 0;
    let failed = 0;
    const maxRetries = 3;
    const retryDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (!response) {
          console.warn('⚠️ No response found for cached request, skipping');
          continue;
        }
        
        const submission = await response.json();
        
        // Check if submission has exceeded max retries
        if (submission.retries >= maxRetries) {
          console.error(`❌ Submission ${submission.id} exceeded max retries (${maxRetries}), removing from queue`);
          await cache.delete(request);
          failed++;
          continue;
        }
        
        console.log(`🚀 Attempting to submit queued item: ${submission.id} (attempt ${submission.retries + 1}/${maxRetries})`);
        
        // Create request with timeout and abort controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn(`⏰ Request timeout for submission: ${submission.id}`);
        }, 15000); // 15 second timeout
        
        try {
          const result = await fetch(submission.url, {
            method: submission.method,
            headers: {
              ...submission.headers,
              'Content-Type': 'application/json'
            },
            body: submission.body,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (result.ok) {
            console.log(`✅ Successfully submitted queued item: ${submission.id}`);
            await cache.delete(request);
            processed++;
            
            // Notify clients of successful submission
            await notifyClientsOfSubmissionSuccess(submission);
            
            // For emergency submissions, show additional confirmation
            if (submission.isEmergency) {
              try {
                await self.registration.showNotification('✅ Emergency Report Sent', {
                  body: 'Your emergency report has been successfully submitted to operators',
                  icon: '/favicon.ico',
                  tag: 'emergency-sent',
                  requireInteraction: false,
                  vibrate: [200, 100, 200],
                  data: { type: 'success', submissionId: submission.id }
                });
              } catch (notifError) {
                console.warn('⚠️ Could not show success notification:', notifError);
              }
            }
            
          } else {
            // Handle HTTP errors
            const errorText = await result.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${result.status}: ${result.statusText} - ${errorText}`);
          }
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Increment retry count and update submission
          submission.retries = (submission.retries || 0) + 1;
          submission.lastError = fetchError.message;
          submission.lastAttempt = Date.now();
          
          console.error(`❌ Failed to submit queued item ${submission.id} (attempt ${submission.retries}/${maxRetries}):`, fetchError.message);
          
          if (submission.retries < maxRetries) {
            // Update the cached submission with retry info
            const updatedResponse = new Response(JSON.stringify(submission));
            await cache.put(request, updatedResponse);
            
            // Wait before next retry
            const delay = retryDelay(submission.retries - 1);
            console.log(`⏳ Will retry submission ${submission.id} in ${delay}ms`);
            
          } else {
            console.error(`💀 Submission ${submission.id} permanently failed after ${maxRetries} attempts`);
            await cache.delete(request);
            failed++;
          }
        }
        
      } catch (submissionError) {
        console.error('❌ Error processing individual submission:', submissionError);
        failed++;
        
        // Try to remove corrupted submission data
        try {
          await cache.delete(request);
          console.log('🧹 Removed corrupted submission from queue');
        } catch (deleteError) {
          console.error('❌ Failed to remove corrupted submission:', deleteError);
        }
      }
    }
    
    // Check remaining items and schedule retry if needed
    const remainingRequests = await cache.keys();
    const remaining = remainingRequests.length;
    
    console.log(`📊 Offline sync completed: ${processed} processed, ${failed} failed, ${remaining} remaining`);
    
    if (remaining > 0) {
      console.log(`⏰ Scheduling retry for ${remaining} pending submissions`);
      if (self.registration.sync) {
        // Schedule retry with exponential backoff
        setTimeout(() => {
          self.registration.sync.register('offline-submissions').catch(syncError => {
            console.error('❌ Failed to register background sync:', syncError);
          });
        }, Math.min(30000, 5000 * Math.pow(1.5, failed))); // Adaptive retry delay
      }
    }
    
    return { processed, failed, remaining };
    
  } catch (error) {
    console.error('❌ Critical error processing offline submissions:', error);
    
    // Try to notify clients about the sync failure
    try {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        if (client.postMessage) {
          client.postMessage({
            type: 'sync-error',
            error: error.message,
            timestamp: Date.now()
          });
        }
      });
    } catch (clientError) {
      console.error('❌ Failed to notify clients of sync error:', clientError);
    }
    
    return { processed: 0, failed: 0, remaining: 0, error: error.message };
  }
}

// Notify clients about queued submissions
async function notifyClientsOfQueuedSubmission(submission) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      if (client.postMessage) {
        client.postMessage({
          type: 'submission-queued',
          data: {
            id: submission.id,
            timestamp: submission.timestamp,
            isEmergency: submission.isEmergency
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to notify clients of queued submission:', error);
  }
}

// Notify clients about successful submissions
async function notifyClientsOfSubmissionSuccess(submission) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      if (client.postMessage) {
        client.postMessage({
          type: 'submission-success',
          data: {
            id: submission.id,
            timestamp: Date.now(),
            wasQueued: true,
            isEmergency: submission.isEmergency
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to notify clients of submission success:', error);
  }
}

// Wake up all clients for critical alerts
async function wakeUpAllClients(data) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.log(`⏰ Waking up ${clients.length} clients for critical alert`);
    
    clients.forEach(client => {
      if (client.postMessage) {
        client.postMessage({
          type: 'critical-alert',
          data: data,
          timestamp: Date.now()
        });
      }
    });
  } catch (error) {
    console.error('❌ Failed to wake up clients:', error);
  }
}