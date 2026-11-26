"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { queryKeys } from "@/lib/query-keys";
import {
  deleteClientContact,
  deleteClientContactsBulk,
  getClientContact,
  listClientContacts,
  saveClientContact,
  saveClientContactBatch,
  setPrimaryClientContact,
  updateClientsStatusBulk,
} from "./clients-api";
import type { ClientContact, ClientStatus } from "./clients-types";

export function useClientContacts(clientId: string, page: number, limit: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.clientContactList(clientId, page, limit),
    enabled: Boolean(clientId) && enabled,
    staleTime: 0,
    queryFn: ({ signal }) => listClientContacts(clientId, page, limit, signal),
  });
}

export function useClientContactDetail(clientId: string, contactId?: string) {
  return useQuery({
    queryKey: [...queryKeys.clientContacts(clientId), "detail", contactId ?? ""] as const,
    enabled: Boolean(clientId && contactId),
    staleTime: 0,
    queryFn: ({ signal }) => getClientContact(clientId, contactId!, signal),
  });
}

export function useRefreshClientContacts(clientId: string) {
  const client = useQueryClient();
  const refreshClients = useRefreshAdmin("clients");
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.clientContacts(clientId) }),
      refreshClients(),
    ]);
  };
}

export function useSaveContactMutation(clientId: string) {
  const refresh = useRefreshClientContacts(clientId);
  return useMutation({
    mutationFn: (input: { values: Record<string, unknown>; contactId?: string }) =>
      saveClientContact(clientId, input.values, input.contactId),
    onSuccess: async () => {
      await refresh();
    },
  });
}

export function useSaveContactBatchMutation(clientId: string) {
  const refresh = useRefreshClientContacts(clientId);
  return useMutation({
    mutationFn: (input: {
      values: { items: Record<string, unknown>[] };
      items?: ClientContact[];
    }) => saveClientContactBatch(clientId, input.values, input.items),
    onSuccess: async () => {
      await refresh();
    },
  });
}

export function useSetPrimaryContactMutation(clientId: string) {
  const refresh = useRefreshClientContacts(clientId);
  return useMutation({
    mutationFn: (contactId: string) => setPrimaryClientContact(clientId, contactId),
    onSuccess: async () => {
      await refresh();
    },
  });
}

export function useDeleteContactMutation(clientId: string) {
  const refresh = useRefreshClientContacts(clientId);
  return useMutation({
    mutationFn: (ids: string[]) =>
      ids.length === 1
        ? deleteClientContact(clientId, ids[0]).then(() => ({ affectedCount: 1, skipped: [] }))
        : deleteClientContactsBulk(clientId, ids),
    onSuccess: async () => {
      await refresh();
    },
  });
}

export function useBulkClientStatusMutation() {
  const refresh = useRefreshAdmin("clients");
  return useMutation({
    mutationFn: (input: { ids: string[]; status: ClientStatus }) =>
      updateClientsStatusBulk(input.ids, input.status),
    onSuccess: async () => {
      await refresh();
    },
  });
}
