"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/lib/contracts/api";
import { adminInvalidationKeys, queryKeys } from "@/lib/query-keys";
import { getResource, listResource, mutateResource } from "./admin-api";
import type { Resource } from "./resource-types";

export function useAdminList<T>(resource: Resource, params: ListParams, enabled: boolean, trash = false) {
  return useQuery({
    queryKey: queryKeys.adminList(resource, params, trash), enabled,
    queryFn: ({ signal }) => listResource<T>(resource, params, trash, signal),
  });
}
export function useAdminDetail<T>(resource: Resource, id: string, enabled: boolean, trash = false) {
  return useQuery({
    queryKey: queryKeys.adminDetail(resource, id, trash), enabled, staleTime: 0,
    queryFn: ({ signal }) => getResource<T>(resource, id, trash, signal),
  });
}
// Assignments must load all pages before replacing relationships.
export function useAssignmentOptions<T>(resource: "roles" | "permissions", enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.options(resource), enabled, staleTime: 0,
    queryFn: async ({ signal }) => {
      const items: T[] = [];
      let page = 1;
      let pages = 1;
      do {
        const result = await listResource<T>(resource, { page, limit: 100 }, false, signal);
        items.push(...result.items);
        pages = result.meta.totalPages;
        page++;
      } while (page <= pages);
      return items;
    },
  });
}
export function useRefreshAdmin(resource: Resource) {
  const client = useQueryClient();
  return () => Promise.all(adminInvalidationKeys(resource).map(queryKey => client.invalidateQueries({ queryKey })));
}
export function useResourceMutation(resource: Resource) {
  const refresh = useRefreshAdmin(resource);
  return useMutation({
    mutationFn: (input: Parameters<typeof mutateResource>[1]) => mutateResource(resource, input),
    onSuccess: async () => { await refresh(); },
  });
}
