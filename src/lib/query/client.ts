import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
    },
  },
});

queryClient.setQueryDefaults(['cart'], { staleTime: 0 });
queryClient.setQueryDefaults(['quote'], { staleTime: 0 });
queryClient.setQueryDefaults(['order'], {
  staleTime: 0,
  gcTime: 10 * 60 * 1000,
});

export const terminalOrderOptions = {
  staleTime: Infinity,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;
