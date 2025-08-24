import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
        if (error?.message?.includes('4')) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

const originalQueryFn = getQueryFn({ on401: "throw" });
export const enhancedQueryFn: typeof originalQueryFn = async (context) => {
  try {
    const result = await originalQueryFn(context);
    
    if (result && typeof result === 'object') {
      const cacheKey = context.queryKey.join('/');
      const cacheData = {
        data: result,
        timestamp: Date.now(),
        queryKey: context.queryKey
      };
      
      try {
        const dataStr = JSON.stringify(cacheData);
        if (dataStr.length < 5 * 1024 * 1024) {
          localStorage.setItem(`cache-${cacheKey.replace(/\//g, '-')}`, dataStr);
        }
      } catch (storageError) {
        console.warn('Failed to cache query result:', storageError);
      }
    }
    
    return result;
  } catch (error) {
    if (navigator && !navigator.onLine) {
      const cacheKey = context.queryKey.join('/');
      const cachedDataStr = localStorage.getItem(`cache-${cacheKey.replace(/\//g, '-')}`);
      
      if (cachedDataStr) {
        try {
          const cachedData = JSON.parse(cachedDataStr);
          const isStale = Date.now() - cachedData.timestamp > 30 * 60 * 1000;
          
          console.warn(`Using ${isStale ? 'stale ' : ''}cached data for offline request:`, cacheKey);
          
          return {
            ...cachedData.data,
            __offline: true,
            __cached: true,
            __stale: isStale
          };
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError);
        }
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
