import { apiClient } from "@/lib/axios/client";
import { saveResource } from "@/lib/admin/admin-api";
import type { ApiResponse, BulkResult } from "@/lib/contracts/api";
import type { Client, ClientContact, ClientStatus, ContactPage } from "./clients-types";

const NULLABLE_CLIENT_FIELDS = [
  "email",
  "phone",
  "websiteUrl",
  "taxCode",
  "address",
  "source",
  "notes",
] as const;

const ALLOWED_CLIENT_FIELDS = [
  "name",
  "clientType",
  "status",
  ...NULLABLE_CLIENT_FIELDS,
] as const;

export function sanitizeClientPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of ALLOWED_CLIENT_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = values[key];
    if (raw === undefined) continue;
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if ((NULLABLE_CLIENT_FIELDS as readonly string[]).includes(key)) {
      if (trimmed === "" || trimmed === null) {
        if (isUpdate) payload[key] = null;
      } else {
        payload[key] = trimmed;
      }
    } else if (trimmed !== "" && trimmed !== null) {
      payload[key] = trimmed;
    }
  }
  return payload;
}

export async function saveClient(values: Record<string, unknown>, id?: string) {
  const body = sanitizeClientPayload(values, Boolean(id));
  await saveResource("clients", body, id);
}

export async function saveClientBatch(
  values: { items: Record<string, unknown>[] },
  items?: Client[],
) {
  const isUpdate = Boolean(items);
  const body = {
    items: values.items.map((row, index) => ({
      ...sanitizeClientPayload(row, isUpdate),
      ...(items ? { id: items[index].id } : {}),
    })),
  };
  if (items) {
    return (await apiClient.patch<ApiResponse<BulkResult>>("/manage/clients/bulk", body)).data.data;
  }
  return (await apiClient.post<ApiResponse<BulkResult>>("/manage/clients/bulk", body)).data.data;
}

export async function updateClientsStatusBulk(ids: string[], status: ClientStatus) {
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một khách hàng.");
  return (
    await apiClient.patch<ApiResponse<BulkResult>>("/manage/clients/bulk/status", {
      ids,
      status,
    })
  ).data.data;
}

const NULLABLE_CONTACT_FIELDS = ["title", "email", "phone", "notes"] as const;
const ALLOWED_CONTACT_FIELDS = ["fullName", "isPrimary", ...NULLABLE_CONTACT_FIELDS] as const;

export function sanitizeContactPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of ALLOWED_CONTACT_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = values[key];
    if (raw === undefined) continue;
    if (key === "isPrimary") {
      if (typeof raw === "boolean") payload.isPrimary = raw;
      continue;
    }
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if ((NULLABLE_CONTACT_FIELDS as readonly string[]).includes(key)) {
      if (trimmed === "" || trimmed === null) {
        if (isUpdate) payload[key] = null;
      } else {
        payload[key] = trimmed;
      }
    } else if (trimmed !== "" && trimmed !== null) {
      payload[key] = trimmed;
    }
  }
  return payload;
}

export async function listClientContacts(
  clientId: string,
  page = 1,
  limit = 20,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<ContactPage>>(`/manage/clients/${clientId}/contacts`, {
      params: { page, limit },
      signal,
    })
  ).data.data;
}

export async function getClientContact(
  clientId: string,
  contactId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<ClientContact>>(
      `/manage/clients/${clientId}/contacts/${contactId}`,
      { signal },
    )
  ).data.data;
}

export async function saveClientContact(
  clientId: string,
  values: Record<string, unknown>,
  contactId?: string,
) {
  const body = sanitizeContactPayload(values, Boolean(contactId));
  if (contactId) {
    return (
      await apiClient.patch<ApiResponse<ClientContact>>(
        `/manage/clients/${clientId}/contacts/${contactId}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<ClientContact>>(
      `/manage/clients/${clientId}/contacts`,
      body,
    )
  ).data.data;
}

export async function saveClientContactBatch(
  clientId: string,
  values: { items: Record<string, unknown>[] },
  items?: ClientContact[],
) {
  const isUpdate = Boolean(items);
  const body = {
    items: values.items.map((row, index) => ({
      ...sanitizeContactPayload(row, isUpdate),
      ...(items ? { id: items[index].id } : {}),
    })),
  };
  if (items) {
    return (
      await apiClient.patch<ApiResponse<BulkResult>>(
        `/manage/clients/${clientId}/contacts/bulk`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<BulkResult>>(
      `/manage/clients/${clientId}/contacts/bulk`,
      body,
    )
  ).data.data;
}

export async function setPrimaryClientContact(clientId: string, contactId: string) {
  return (
    await apiClient.patch<ApiResponse<ClientContact>>(
      `/manage/clients/${clientId}/contacts/${contactId}/primary`,
    )
  ).data.data;
}

export async function deleteClientContact(clientId: string, contactId: string) {
  return (
    await apiClient.delete<ApiResponse<ClientContact>>(
      `/manage/clients/${clientId}/contacts/${contactId}`,
    )
  ).data.data;
}

export async function deleteClientContactsBulk(clientId: string, ids: string[]) {
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một liên hệ.");
  return (
    await apiClient.delete<ApiResponse<BulkResult>>(
      `/manage/clients/${clientId}/contacts/bulk`,
      { data: { ids } },
    )
  ).data.data;
}
