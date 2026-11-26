import { apiClient } from "@/lib/axios/client";
import type { ApiResponse, BulkResult, ListParams, Page } from "@/lib/contracts/api";
import type { Resource } from "./resource-types";

export async function listResource<T>(resource: Resource, params: ListParams, trash: boolean, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<Page<T>>>(`/manage/${resource}${trash ? "/trash" : ""}`, { params, signal })).data.data;
}
export async function getResource<T>(resource: Resource, id: string, trash: boolean, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<T>>(`/manage/${resource}${trash ? "/trash" : ""}/${id}`, { signal })).data.data;
}
export async function saveResource(resource: Resource, payload: Record<string, unknown>, id?: string) {
  if (id) await apiClient.patch(`/manage/${resource}/${id}`, payload);
  else await apiClient.post(`/manage/${resource}`, payload);
}
export async function mutateResource(resource: Resource, input: {
  ids: string[];
  action: "delete" | "restore" | "permanent" | "activate" | "deactivate";
}) {
  const { ids, action } = input;
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một mục.");
  const bulk = ids.length > 1;
  const status = action === "activate" || action === "deactivate";
  const suffix = action === "restore" ? "/restore"
    : action === "permanent" && !["services", "tags"].includes(resource) ? "/permanent"
      : status ? "/status" : "";
  return (await apiClient.request<ApiResponse<BulkResult>>({
    url: `/manage/${resource}/${bulk ? "bulk" : ids[0]}${suffix}`,
    method: action === "restore" || status ? "PATCH" : "DELETE",
    data: { ...(bulk ? { ids } : {}), ...(status ? { isActive: action === "activate" } : {}) },
  })).data.data;
}
export async function assignResource(target: { kind: "roles" | "users"; id: string }, ids: string[]) {
  const role = target.kind === "roles";
  await apiClient.put(`/manage/${target.kind}/${target.id}/${role ? "permissions" : "roles"}`,
    role ? { permissionIds: ids } : { roleIds: ids });
}

export type SystemHealthStatus = {
  alive: boolean;
  ready: boolean;
  service?: string;
  checks?: Record<string, { ok: boolean }>;
};

export async function getSystemHealth(signal?: AbortSignal): Promise<SystemHealthStatus> {
  const [liveRes, readyRes] = await Promise.allSettled([
    apiClient.get<ApiResponse<{ alive: boolean }>>("/manage/health/live", { signal }),
    apiClient.get<
      ApiResponse<{
        ready: boolean;
        service: string;
        checks: Record<string, { ok: boolean }>;
      }>
    >("/manage/health/ready", { signal }),
  ]);
  const alive = liveRes.status === "fulfilled" && Boolean(liveRes.value.data.data?.alive);
  const readyData = readyRes.status === "fulfilled" ? readyRes.value.data.data : undefined;
  return {
    alive,
    ready: Boolean(readyData?.ready),
    service: readyData?.service,
    checks: readyData?.checks,
  };
}

export const MAX_ASSIGNMENT_PAGES = 5;

export async function loadAssignmentCatalog<T>(
  resource: "roles" | "permissions",
  options: { search?: string; maxPages?: number; signal?: AbortSignal } = {},
) {
  const search = options.search?.trim() || undefined;
  const maxPages = options.maxPages ?? MAX_ASSIGNMENT_PAGES;
  const first = await listResource<T>(resource, { page: 1, limit: 100, search }, false, options.signal);
  const totalPages = Math.min(first.meta.totalPages, maxPages);
  if (totalPages <= 1) {
    return Object.assign([...first.items], {
      total: first.meta.total,
      truncated: first.meta.totalPages > maxPages,
    });
  }
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listResource<T>(resource, { page: index + 2, limit: 100, search }, false, options.signal),
    ),
  );
  const items = [first, ...rest].flatMap(page => page.items);
  return Object.assign(items, {
    total: first.meta.total,
    truncated: first.meta.totalPages > maxPages,
  });
}
