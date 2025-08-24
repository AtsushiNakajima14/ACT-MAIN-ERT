import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';

interface User {
  id: string;
  username: string;
  role: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: (failureCount, error: any) => {
      return failureCount < 2 && error?.message?.includes('fetch');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isOperator: user?.role === 'operator',
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<User> => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const response = await apiRequest('POST', '/api/auth/logout');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });
}