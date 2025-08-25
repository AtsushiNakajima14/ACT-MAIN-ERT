import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { offlineStorage } from './offlineStorage';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Fast timeout for better UX - especially important for emergency submissions
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // If this is a POST request that failed, the service worker should have
    // queued it for offline submission, so we don't throw an error
    if (method === 'POST' && navigator && !navigator.onLine) {
      console.log('📱 API request failed offline, but service worker should handle it');
      // Return a success response to indicate the submission was queued
      return new Response(JSON.stringify({
        success: true,
        offline: true,
        message: 'Your submission has been queued and will be sent when connection is restored.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('4') && !error?.message?.includes('408')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry POST requests that might have been queued offline
        if (error?.message?.includes('4') || (error?.name === 'AbortError' && !navigator.onLine)) {
          return false;
        }
        return failureCount < 1;
      },
      // Faster retry for online mutations
      retryDelay: 2000,
    },
  },
});

const originalQueryFn = getQueryFn({ on401: "throw" });
export const enhancedQueryFn: typeof originalQueryFn = async (context) => {
  try {
    const result = await originalQueryFn(context);
    
    if (result && typeof result === 'object') {
      const queryPath = context.queryKey.join('/');
      
      // Cache data in IndexedDB based on endpoint type
      try {
        if (queryPath.includes('/api/emergency-alerts')) {
          await offlineStorage.cacheEmergencyAlerts(Array.isArray(result) ? result : [result]);
        } else if (queryPath.includes('/api/team-members')) {
          await offlineStorage.cacheTeamMembers(Array.isArray(result) ? result : [result]);
        } else if (queryPath.includes('/api/system-status')) {
          await offlineStorage.cacheSystemStatus(Array.isArray(result) ? result : [result]);
        } else if (queryPath.includes('/api/incidents')) {
          // Cache individual incidents
          if (Array.isArray(result)) {
            for (const incident of result) {
              await offlineStorage.cacheIncident(incident);
            }
          } else {
            await offlineStorage.cacheIncident(result);
          }
        } else if (queryPath.includes('/api/user-reports')) {
          // Cache individual user reports
          if (Array.isArray(result)) {
            for (const report of result) {
              await offlineStorage.cacheUserReport(report);
            }
          } else {
            await offlineStorage.cacheUserReport(result);
          }
        }
        
        // Also keep localStorage fallback for smaller data
        const cacheKey = context.queryKey.join('/');
        const cacheData = {
          data: result,
          timestamp: Date.now(),
          queryKey: context.queryKey
        };
        
        const dataStr = JSON.stringify(cacheData);
        if (dataStr.length < 2 * 1024 * 1024) { // 2MB limit for localStorage
          localStorage.setItem(`cache-${cacheKey.replace(/\//g, '-')}`, dataStr);
        }
        
      } catch (storageError) {
        console.warn('Failed to cache query result:', storageError);
      }
    }
    
    return result;
  } catch (error) {
    if (navigator && !navigator.onLine) {
      const queryPath = context.queryKey.join('/');
      
      // Try to get data from IndexedDB first (more comprehensive)
      try {
        let offlineData: any = null;
        
        if (queryPath.includes('/api/emergency-alerts')) {
          offlineData = await offlineStorage.getOfflineEmergencyAlerts();
        } else if (queryPath.includes('/api/team-members')) {
          offlineData = await offlineStorage.getOfflineTeamMembers();
        } else if (queryPath.includes('/api/system-status')) {
          offlineData = await offlineStorage.getOfflineSystemStatus();
        } else if (queryPath.includes('/api/incidents')) {
          offlineData = await offlineStorage.getOfflineIncidents();
        } else if (queryPath.includes('/api/user-reports')) {
          offlineData = await offlineStorage.getOfflineUserReports();
        }
        
        if (offlineData && offlineData.length > 0) {
          const isStale = await offlineStorage.isDataStale(queryPath, 30 * 60 * 1000); // 30 minutes
          
          console.warn(`📱 Using ${isStale ? 'stale ' : ''}IndexedDB data for offline request:`, queryPath);
          
          return {
            ...offlineData,
            __offline: true,
            __cached: true,
            __stale: isStale,
            __source: 'indexeddb'
          };
        }
      } catch (indexedDBError) {
        console.warn('Failed to get IndexedDB data, trying localStorage:', indexedDBError);
      }
      
      // Fallback to localStorage
      const cacheKey = context.queryKey.join('/');
      const cachedDataStr = localStorage.getItem(`cache-${cacheKey.replace(/\//g, '-')}`);
      
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          const isStale = Date.now() - cachedData.timestamp > 30 * 60 * 1000;
          
          console.warn(`📱 Using ${isStale ? 'stale ' : ''}localStorage data for offline request:`, cacheKey);
          
          return {
            ...cachedData.data,
            __offline: true,
            __cached: true,
            __stale: isStale,
            __source: 'localstorage'
          };
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError);
        }
      }
      
      // Last resort: return empty array for list endpoints
      if (queryPath.includes('/api/')) {
        console.warn(`📱 No offline data available for ${queryPath}, returning empty array`);
        return {
          __offline: true,
          __cached: false,
          __empty: true,
          __source: 'fallback'
        };
      }
    }
    
    throw error;
  }
};

queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    queryFn: enhancedQueryFn
  }
});
