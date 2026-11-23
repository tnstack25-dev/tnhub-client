import { apiClient } from "@/lib/axios/client";
import type { ApiResponse, Page } from "@/lib/contracts/api";
import type { AuditEvent, AuditExport, AuditFilters } from "./audit-types";

export async function listAudit(filters: AuditFilters, page: number, limit: number, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<Page<AuditEvent>>>("/manage/audit-logs", { params: { ...filters, page, limit }, signal })).data.data;
}
export async function getAudit(id: string, signal?: AbortSignal) {
  return (await apiClient.get<ApiResponse<AuditEvent>>(`/manage/audit-logs/${id}`, { signal })).data.data;
}
export async function exportAudit(filters: AuditFilters) {
  return (await apiClient.get<ApiResponse<AuditExport>>("/manage/audit-logs/export", { params: filters, timeout: 60000 })).data.data;
}
