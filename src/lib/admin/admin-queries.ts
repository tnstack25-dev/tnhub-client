"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/lib/contracts/api";
import { adminInvalidationKeys, queryKeys } from "@/lib/query-keys";
import { getResource, listResource, loadAssignmentCatalog, mutateResource } from "./admin-api";
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
// Load bounded pages in parallel and support server-side search for large catalogs.
export function useAssignmentOptions<T>(resource: "roles" | "permissions", enabled: boolean, search = "") {
  return useQuery({
    queryKey: queryKeys.options(resource, search), enabled, staleTime: 0,
    queryFn: ({ signal }) => loadAssignmentCatalog<T>(resource, { search, signal }),
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
