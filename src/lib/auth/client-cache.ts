import type { QueryClient } from "@tanstack/react-query";

// Await cancellations so an old account's in-flight requests cannot refill the cache.
export async function clearSessionCache(client: QueryClient) {
  await client.cancelQueries();
  client.clear();
}
