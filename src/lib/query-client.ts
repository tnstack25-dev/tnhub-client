import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { handleSessionError } from "./auth/client-cache";
import { ApiError } from "./axios/error";

export function createQueryClient() {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        handleSessionError(client, error, query.queryKey);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleSessionError(client, error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 429
          )
            return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
  return client;
}
