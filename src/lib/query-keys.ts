import type { ListParams } from "./contracts/api";

export const queryKeys = {
  profile: ["me"] as const,
  admin: (resource: string) => ["admin", resource] as const,
  adminList: (resource: string, params: ListParams, trash: boolean) => ["admin", resource, "list", { ...params, trash }] as const,
  adminDetail: (resource: string, id: string, trash = false) => ["admin", resource, "detail", id, trash] as const,
  options: (resource: string, search = "") => ["admin", resource, "options", search] as const,
  clientContacts: (clientId: string) => ["admin", "clients", "contacts", clientId] as const,
  clientContactList: (clientId: string, page: number, limit: number) =>
    ["admin", "clients", "contacts", clientId, { page, limit }] as const,
  projectWork: (projectId: string) => ["admin", "projects", "work", projectId] as const,
  projectSection: (projectId: string, section: string, params?: Record<string, unknown>) =>
    ["admin", "projects", "work", projectId, section, params ?? {}] as const,
  taskDetail: (projectId: string, taskId: string, section = "root") =>
    ["admin", "projects", "work", projectId, "task", taskId, section] as const,
  websiteSubList: (websiteId: string, section: string, params?: Record<string, unknown>) =>
    ["admin", "websites", "sub", websiteId, section, params ?? {}] as const,
  notifications: ["notifications"] as const,
  notificationUnreadCount: ["notifications", "unread-count"] as const,
  notificationInbox: (params: Record<string, unknown>) =>
    ["notifications", "inbox", params] as const,
  services: ["services"] as const,
  serviceList: (page: number, limit: number) => ["services", { page, limit }] as const,
  media: ["media"] as const,
  mediaPickerSelection: (ids: string[]) => ["media", "picker-selection", ids] as const,
  mediaList: (params: ListParams, trash: boolean) => ["media", "list", { ...params, trash }] as const,
  mediaDetail: (id: string, trash: boolean) => ["media", "detail", id, trash] as const,
  audit: ["audit-logs"] as const,
  auditList: (params: ListParams) => ["audit-logs", "list", params] as const,
  auditDetail: (id: string) => ["audit-logs", "detail", id] as const,
  sessions: ["sessions"] as const,
  sessionList: (page: number) => ["sessions", "list", page] as const,
};

// Access changes affect the current profile and user/role relationships.
export function adminInvalidationKeys(resource: string) {
  const keys: (readonly unknown[])[] = [queryKeys.admin(resource), queryKeys.audit];
  if (resource === "services") keys.push(queryKeys.services);
  if (["roles", "permissions", "users"].includes(resource)) {
    keys.push(queryKeys.profile);
    if (resource !== "roles") keys.push(queryKeys.admin("roles"));
    if (resource !== "users") keys.push(queryKeys.admin("users"));
  }
  return keys;
}
