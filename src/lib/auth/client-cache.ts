import type { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/axios/error";
import { queryKeys } from "@/lib/query-keys";

export function isUnauthorizedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

// Await cancellations so an old account's in-flight requests cannot refill the cache.
export async function clearSessionCache(client: QueryClient) {
  await client.cancelQueries();
  client.clear();
}

// Revalidate the identity query when any workspace query or mutation fails with 401.
export function handleSessionError(
  client: QueryClient,
  error: unknown,
  originQueryKey?: readonly unknown[],
) {
  if (!isUnauthorizedError(error)) return false;
  if (
    originQueryKey &&
    originQueryKey.length === queryKeys.profile.length &&
    originQueryKey[0] === queryKeys.profile[0]
  ) {
    return true;
  }
  const state = client.getQueryState(queryKeys.profile);
  if (state?.fetchStatus !== "fetching" && !isUnauthorizedError(state?.error)) {
    void client.invalidateQueries({ queryKey: queryKeys.profile });
  }
  return true;
}
