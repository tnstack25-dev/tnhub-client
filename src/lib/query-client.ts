import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./axios/error";

export function createQueryClient() {
  return new QueryClient({ defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  } });
}
