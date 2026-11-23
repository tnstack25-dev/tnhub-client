import { apiClient } from "@/lib/axios/client";
import type { ApiResponse, Page } from "@/lib/contracts/api";
import type { Session } from "./account-types";
import { profileSchema } from "@/lib/auth/contracts";

export async function updateProfile(values: Record<string, unknown>) {
  const body = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined).map(([key, value]) =>
    [key, typeof value === "string" ? value.trim() || null : value ?? null]));
  const response = await apiClient.patch("/account/profile", body);
  return profileSchema.parse(response.data.data);
}
export async function listSessions(page: number, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<Page<Session>>>("/account/sessions", { params: { page, limit: 10 }, signal })).data.data;
}
export async function revokeSession({ id, current }: { id?: string; current?: boolean }) {
  await apiClient.delete("/account/sessions" + (id ? "/" + id : ""), { params: current ? { current: "1" } : undefined });
}
