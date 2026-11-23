"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { listWorkspaceServices } from "./services-api";
export function useWorkspaceServices(page: number, limit: number, enabled: boolean) {
  return useQuery({ queryKey: queryKeys.serviceList(page, limit), enabled,
    queryFn: ({ signal }) => listWorkspaceServices(page, limit, signal) });
}
