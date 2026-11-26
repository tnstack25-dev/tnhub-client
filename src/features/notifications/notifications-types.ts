export type NotificationInboxState = "all" | "unread" | "archived";
export type NotificationStateAction = "read" | "unread" | "archive" | "unarchive";

export type NotificationContent = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  actionUrl: string | null;
  imageUrl: string | null;
  priority: number;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt?: string;
  recipientCount?: number;
};

export type UserNotificationItem = {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  readAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  notification: NotificationContent;
};

export const NOTIFICATION_TYPE_SUGGESTIONS = [
  { value: "SYSTEM", label: "Hệ thống (SYSTEM)" },
  { value: "PROJECT_UPDATE", label: "Cập nhật dự án (PROJECT_UPDATE)" },
  { value: "TASK_ASSIGNED", label: "Giao công việc (TASK_ASSIGNED)" },
  { value: "MAINTENANCE_ALERT", label: "Cảnh báo bảo trì (MAINTENANCE_ALERT)" },
  { value: "SECURITY", label: "Bảo mật (SECURITY)" },
  { value: "ANNOUNCEMENT", label: "Thông báo chung (ANNOUNCEMENT)" },
] as const;
