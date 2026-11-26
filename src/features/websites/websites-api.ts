import { apiClient } from "@/lib/axios/client";
import { saveResource } from "@/lib/admin/admin-api";
import type { ApiResponse, BulkResult, Page } from "@/lib/contracts/api";
import type {
  Website,
  WebsiteDeliverable,
  WebsiteMaintenanceLog,
  WebsiteStatus,
} from "./websites-types";

const NULLABLE_WEBSITE_FIELDS = [
  "domainName",
  "productionUrl",
  "stagingUrl",
  "repositoryUrl",
  "cms",
  "framework",
  "hostingProvider",
  "serverIp",
  "domainExpiresOn",
  "hostingExpiresOn",
  "launchedAt",
  "notes",
] as const;

export function sanitizeWebsitePayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (!isUpdate && typeof values.projectId === "string" && values.projectId.trim()) {
    payload.projectId = values.projectId.trim().toLowerCase();
  }
  if (typeof values.displayName === "string" && values.displayName.trim()) {
    payload.displayName = values.displayName.trim();
  }
  for (const key of NULLABLE_WEBSITE_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = values[key];
    if (raw === undefined) continue;
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if (trimmed === "" || trimmed === null) {
      if (isUpdate) payload[key] = null;
    } else if (typeof trimmed === "string") {
      payload[key] = key === "domainName" ? trimmed.toLowerCase() : trimmed;
    }
  }
  return payload;
}

export async function saveWebsite(values: Record<string, unknown>, id?: string) {
  const body = sanitizeWebsitePayload(values, Boolean(id));
  await saveResource("websites", body, id);
}

export async function saveWebsiteBatch(
  values: { items: Record<string, unknown>[] },
  items?: Website[],
) {
  const isUpdate = Boolean(items);
  const body = {
    items: values.items.map((row, index) => ({
      ...sanitizeWebsitePayload(row, isUpdate),
      ...(items ? { id: items[index].id } : {}),
    })),
  };
  if (items) {
    return (await apiClient.patch<ApiResponse<BulkResult>>("/manage/websites/bulk", body)).data.data;
  }
  return (await apiClient.post<ApiResponse<BulkResult>>("/manage/websites/bulk", body)).data.data;
}

export async function updateWebsiteStatus(id: string, status: WebsiteStatus) {
  return (
    await apiClient.patch<ApiResponse<Website>>(`/manage/websites/${id}/status`, {
      status,
    })
  ).data.data;
}

export async function updateWebsitesStatusBulk(ids: string[], status: WebsiteStatus) {
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một website.");
  return (
    await apiClient.patch<ApiResponse<BulkResult>>("/manage/websites/bulk/status", {
      ids,
      status,
    })
  ).data.data;
}

export async function listWebsiteDeliverables(
  websiteId: string,
  params: { page?: number; limit?: number; category?: string; status?: string },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<WebsiteDeliverable>>>(
      `/manage/websites/${websiteId}/deliverables`,
      { params, signal },
    )
  ).data.data;
}

export async function getWebsiteDeliverable(
  websiteId: string,
  itemId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<WebsiteDeliverable>>(
      `/manage/websites/${websiteId}/deliverables/${itemId}`,
      { signal },
    )
  ).data.data;
}

export async function saveWebsiteDeliverable(
  websiteId: string,
  values: Record<string, unknown>,
  itemId?: string,
) {
  const isUpdate = Boolean(itemId);
  const body: Record<string, unknown> = {};
  if (typeof values.title === "string" && values.title.trim()) {
    body.title = values.title.trim();
  }
  if (typeof values.category === "string") body.category = values.category;
  if (typeof values.status === "string") body.status = values.status;
  for (const key of ["dueDate", "notes"] as const) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = typeof values[key] === "string" ? values[key].trim() : values[key];
    if (!raw) {
      if (isUpdate) body[key] = null;
    } else {
      body[key] = raw;
    }
  }
  if (itemId) {
    return (
      await apiClient.patch<ApiResponse<WebsiteDeliverable>>(
        `/manage/websites/${websiteId}/deliverables/${itemId}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<WebsiteDeliverable>>(
      `/manage/websites/${websiteId}/deliverables`,
      body,
    )
  ).data.data;
}

export async function deleteWebsiteDeliverable(websiteId: string, itemId: string) {
  return (
    await apiClient.delete<ApiResponse<WebsiteDeliverable>>(
      `/manage/websites/${websiteId}/deliverables/${itemId}`,
    )
  ).data.data;
}

export async function listWebsiteMaintenanceLogs(
  websiteId: string,
  params: { page?: number; limit?: number; maintenanceType?: string },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<WebsiteMaintenanceLog>>>(
      `/manage/websites/${websiteId}/maintenance-logs`,
      { params, signal },
    )
  ).data.data;
}

export async function getWebsiteMaintenanceLog(
  websiteId: string,
  itemId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<WebsiteMaintenanceLog>>(
      `/manage/websites/${websiteId}/maintenance-logs/${itemId}`,
      { signal },
    )
  ).data.data;
}

export async function saveWebsiteMaintenanceLog(
  websiteId: string,
  values: Record<string, unknown>,
  itemId?: string,
) {
  const isUpdate = Boolean(itemId);
  const body: Record<string, unknown> = {};
  if (typeof values.maintenanceType === "string") {
    body.maintenanceType = values.maintenanceType;
  }
  if (typeof values.description === "string" && values.description.trim()) {
    body.description = values.description.trim();
  }
  if (values.cost !== undefined && values.cost !== null && String(values.cost).trim() !== "") {
    body.cost = String(values.cost).trim();
  }
  if (Object.hasOwn(values, "nextDueDate")) {
    const raw = typeof values.nextDueDate === "string" ? values.nextDueDate.trim() : values.nextDueDate;
    if (!raw) {
      if (isUpdate) body.nextDueDate = null;
    } else {
      body.nextDueDate = raw;
    }
  }
  if (itemId) {
    return (
      await apiClient.patch<ApiResponse<WebsiteMaintenanceLog>>(
        `/manage/websites/${websiteId}/maintenance-logs/${itemId}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<WebsiteMaintenanceLog>>(
      `/manage/websites/${websiteId}/maintenance-logs`,
      body,
    )
  ).data.data;
}

export async function deleteWebsiteMaintenanceLog(websiteId: string, itemId: string) {
  return (
    await apiClient.delete<ApiResponse<WebsiteMaintenanceLog>>(
      `/manage/websites/${websiteId}/maintenance-logs/${itemId}`,
    )
  ).data.data;
}
