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
    : action === "permanent" && resource !== "services" ? "/permanent"
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
