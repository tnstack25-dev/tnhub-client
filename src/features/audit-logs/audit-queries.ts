"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAudit, listAudit } from "./audit-api";
import type { AuditFilters } from "./audit-types";
export function useAudit(filters: AuditFilters, page: number, limit: number, enabled: boolean) {
  return useQuery({ queryKey: queryKeys.auditList({ ...filters, page, limit }), enabled,
    queryFn: ({ signal }) => listAudit(filters, page, limit, signal) });
}
export function useAuditDetail(id: string) {
  return useQuery({ queryKey: queryKeys.auditDetail(id), staleTime: 0,
    queryFn: ({ signal }) => getAudit(id, signal) });
}
