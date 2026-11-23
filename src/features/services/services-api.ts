import { apiClient } from "@/lib/axios/client";
import { saveResource } from "@/lib/admin/admin-api";
import type { ApiResponse } from "@/lib/contracts/api";
import type { Service, ServicePage } from "./services-types";

export async function listWorkspaceServices(page: number, limit: number, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<ServicePage>>("/services", { params: { page, limit }, signal })).data.data;
}
export async function saveService(values: Record<string, unknown>, id?: string) {
  const body = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
  if (body.defaultPrice !== undefined) body.defaultPrice = String(body.defaultPrice);
  if (id) { delete body.code; delete body.isActive; }
  await saveResource("services", body, id);
}
export async function saveServiceBatch(values: { items: Record<string, unknown>[] }, items?: Service[]) {
  const body = { items: values.items.map((value, index) => {
    const row: Record<string, unknown> = { ...value, defaultPrice: String(value.defaultPrice ?? "0"), ...(items ? { id: items[index].id } : {}) };
    if (items) { delete row.code; delete row.isActive; }
    return row;
  }) };
  if (items) await apiClient.patch("/manage/services/bulk", body);
  else await apiClient.post("/manage/services/bulk", body);
}
