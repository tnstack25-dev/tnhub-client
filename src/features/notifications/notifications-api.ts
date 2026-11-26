import { apiClient } from "@/lib/axios/client";
import type { ApiResponse, Page } from "@/lib/contracts/api";
import type {
  NotificationContent,
  NotificationInboxState,
  NotificationStateAction,
  UserNotificationItem,
} from "./notifications-types";

const NULLABLE_NOTIFICATION_FIELDS = [
  "actionUrl",
  "imageUrl",
  "scheduledAt",
  "expiresAt",
] as const;

export function sanitizeNotificationPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof values.type === "string" && values.type.trim()) {
    payload.type = values.type.trim().toUpperCase();
  }
  if (typeof values.title === "string" && values.title.trim()) {
    payload.title = values.title.trim();
  }
  if (typeof values.body === "string" && values.body.trim()) {
    payload.body = values.body.trim();
  }
  if (typeof values.priority === "number" && Number.isInteger(values.priority)) {
    payload.priority = values.priority;
  }
  for (const key of NULLABLE_NOTIFICATION_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = values[key];
    if (raw === undefined) continue;
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if (trimmed === "" || trimmed === null) {
      if (isUpdate) payload[key] = null;
    } else if (typeof trimmed === "string") {
      if ((key === "scheduledAt" || key === "expiresAt") && !Number.isNaN(Date.parse(trimmed))) {
        payload[key] = new Date(trimmed).toISOString();
      } else {
        payload[key] = trimmed;
      }
    }
  }
  if (!isUpdate && Array.isArray(values.userIds)) {
    payload.userIds = [
      ...new Set(
        values.userIds
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim().toLowerCase()),
      ),
    ];
  }
  return payload;
}

// --- Personal Inbox APIs ---

export async function listMyNotifications(
  params: {
    page?: number;
    limit?: number;
    state?: NotificationInboxState;
    search?: string;
  },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<UserNotificationItem>>>(
      "/manage/notifications/me",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          state: params.state ?? "all",
          search: params.search?.trim() || undefined,
        },
        signal,
      },
    )
  ).data.data;
}

export async function getUnreadNotificationCount(signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<{ count: number }>>(
      "/manage/notifications/me/unread-count",
      { signal },
    )
  ).data.data.count;
}

export async function markAllNotificationsRead() {
  return (
    await apiClient.patch<ApiResponse<{ affectedCount: number }>>(
      "/manage/notifications/me/read-all",
    )
  ).data.data;
}

export async function changeMyNotificationState(
  receiptId: string,
  action: NotificationStateAction,
) {
  return (
    await apiClient.patch<ApiResponse<{ affectedCount: number }>>(
      `/manage/notifications/me/${receiptId}/${action}`,
    )
  ).data.data;
}

// --- Admin Broadcast Management APIs ---

export async function listAdminNotifications(
  params: { page?: number; limit?: number; search?: string },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<NotificationContent>>>(
      "/manage/notifications",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          search: params.search?.trim() || undefined,
        },
        signal,
      },
    )
  ).data.data;
}

export async function getAdminNotification(id: string, signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<NotificationContent>>(
      `/manage/notifications/${id}`,
      { signal },
    )
  ).data.data;
}

export async function saveAdminNotification(
  values: Record<string, unknown>,
  id?: string,
) {
  const body = sanitizeNotificationPayload(values, Boolean(id));
  if (id) {
    return (
      await apiClient.patch<ApiResponse<NotificationContent>>(
        `/manage/notifications/${id}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<NotificationContent>>(
      "/manage/notifications",
      body,
    )
  ).data.data;
}

export async function deleteAdminNotification(id: string) {
  return (
    await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/manage/notifications/${id}`,
    )
  ).data.data;
}
