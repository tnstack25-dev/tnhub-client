import { apiClient } from "@/lib/axios/client";
import type { ApiResponse, BulkResult, ListParams, Page } from "@/lib/contracts/api";
import type { MediaItem } from "./media-types";
import { imageError } from "@/lib/media/validation";

export async function listMedia(params: ListParams, trash: boolean, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<Page<MediaItem>>>(`/manage/media${trash ? "/trash" : ""}`, { params, signal })).data.data;
}
export async function getMedia(id: string, trash: boolean, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<MediaItem>>(`/manage/media${trash ? "/trash" : ""}/${id}`, { signal })).data.data;
}
export async function updateMedia(id: string, values: { altText?: string }) {
  await apiClient.patch(`/manage/media/${id}`, { altText: values.altText?.trim() ?? "" });
}
export async function mutateMedia({ ids, action }: { ids: string[]; action: "delete" | "restore" | "permanent" }) {
  if (!ids.length || ids.length > 50) throw new Error("Vui lòng chọn từ 1 đến 50 ảnh.");
  const path = `/manage/media/${ids.length > 1 ? "bulk" : ids[0]}${action === "restore" ? "/restore" : action === "permanent" ? "/permanent" : ""}`;
  return (await apiClient.request<ApiResponse<BulkResult>>({
    url: path, method: action === "restore" ? "PATCH" : "DELETE", data: ids.length > 1 ? { ids } : {},
  })).data.data;
}

export type UploadProgress = { index: number; total: number; percent: number };
export async function uploadMediaFile(file: File, altText?: string, options?: {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}) {
  const error = imageError(file);
  if (error) throw new Error(error);
  const body = new FormData();
  body.set("file", file, file.name);
  if (altText?.trim()) body.set("altText", altText.trim());
  return (await apiClient.post<ApiResponse<MediaItem>>("/manage/media/upload", body, {
    timeout: 90000,
    signal: options?.signal,
    onUploadProgress: event => options?.onProgress?.(event.total ? Math.min(100, Math.round(event.loaded / event.total * 100)) : 0),
  })).data.data;
}
export async function uploadMediaFiles(
  files: { uid: string; name: string; file?: File }[],
  altText: string | undefined,
  onProgress: (progress: UploadProgress) => void,
) {
  const succeeded: string[] = [];
  const failures: string[] = [];
  for (const [index, item] of files.entries()) {
    if (!item.file) { failures.push(item.name + ": Không đọc được ảnh."); continue; }
    onProgress({ index: index + 1, total: files.length, percent: 0 });
    try {
      await uploadMediaFile(item.file, altText, {
        onProgress: percent => onProgress({ index: index + 1, total: files.length, percent }),
      });
      succeeded.push(item.uid);
    } catch (error) {
      failures.push(item.name + ": " + (error instanceof Error ? error.message : "Chưa thể tải ảnh."));
    }
  }
  return { succeeded, failures };
}
