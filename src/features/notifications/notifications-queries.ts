"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  changeMyNotificationState,
  deleteAdminNotification,
  getUnreadNotificationCount,
  listAdminNotifications,
  listMyNotifications,
  markAllNotificationsRead,
  saveAdminNotification,
} from "./notifications-api";
import type {
  NotificationInboxState,
  NotificationStateAction,
} from "./notifications-types";

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount,
    enabled,
    staleTime: 30_000,
    queryFn: ({ signal }) => getUnreadNotificationCount(signal),
  });
}

export function useMyNotifications(
  params: {
    page: number;
    limit: number;
    state: NotificationInboxState;
    search?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.notificationInbox(params),
    enabled,
    staleTime: 0,
    queryFn: ({ signal }) => listMyNotifications(params, signal),
  });
}

export function useAdminNotifications(
  params: { page: number; limit: number; search?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.adminList("notifications", params, false),
    enabled,
    queryFn: ({ signal }) => listAdminNotifications(params, signal),
  });
}

export function useRefreshNotifications() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.notifications }),
      client.invalidateQueries({ queryKey: queryKeys.admin("notifications") }),
      client.invalidateQueries({ queryKey: queryKeys.audit }),
    ]);
  };
}

export function useNotificationStateMutation() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: (input: { id: string; action: NotificationStateAction }) =>
      changeMyNotificationState(input.id, input.action),
    onSuccess: refresh,
  });
}

export function useMarkAllNotificationsReadMutation() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refresh,
  });
}

export function useSaveNotificationMutation() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: (input: { values: Record<string, unknown>; id?: string }) =>
      saveAdminNotification(input.values, input.id),
    onSuccess: refresh,
  });
}

export function useDeleteNotificationMutation() {
  const refresh = useRefreshNotifications();
  return useMutation({
    mutationFn: (id: string) => deleteAdminNotification(id),
    onSuccess: refresh,
  });
}
