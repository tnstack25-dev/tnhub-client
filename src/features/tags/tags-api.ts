import { apiClient } from "@/lib/axios/client";
import { saveResource } from "@/lib/admin/admin-api";
import type { ApiResponse, BulkResult } from "@/lib/contracts/api";
import type { ProjectTag } from "./tags-types";

export function sanitizeTagPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof values.name === "string" && values.name.trim()) {
    payload.name = values.name.trim();
  }
  if (Object.hasOwn(values, "color")) {
    const raw = typeof values.color === "string" ? values.color.trim().toUpperCase() : values.color;
    if (!raw) {
      if (isUpdate) payload.color = null;
    } else if (typeof raw === "string") {
      payload.color = raw;
    }
  }
  return payload;
}

export async function saveTag(values: Record<string, unknown>, id?: string) {
  const body = sanitizeTagPayload(values, Boolean(id));
  await saveResource("tags", body, id);
}

export async function saveTagBatch(
  values: { items: Record<string, unknown>[] },
  items?: ProjectTag[],
) {
  const isUpdate = Boolean(items);
  const body = {
    items: values.items.map((row, index) => ({
      ...sanitizeTagPayload(row, isUpdate),
      ...(items ? { id: items[index].id } : {}),
    })),
  };
  if (items) {
    return (await apiClient.patch<ApiResponse<BulkResult>>("/manage/tags/bulk", body)).data.data;
  }
  return (await apiClient.post<ApiResponse<BulkResult>>("/manage/tags/bulk", body)).data.data;
}
