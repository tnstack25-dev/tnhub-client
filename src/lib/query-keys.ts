import type { ListParams } from "./contracts/api";

export const queryKeys = {
  profile: ["me"] as const,
  admin: (resource: string) => ["admin", resource] as const,
  adminList: (resource: string, params: ListParams, trash: boolean) => ["admin", resource, "list", { ...params, trash }] as const,
  adminDetail: (resource: string, id: string, trash = false) => ["admin", resource, "detail", id, trash] as const,
  options: (resource: string) => ["admin", resource, "options"] as const,
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
