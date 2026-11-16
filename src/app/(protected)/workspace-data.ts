"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuthProfile } from "@/lib/auth/backend";
import { apiClient } from "@/lib/axios/client";

export function useWorkspaceProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ data: AuthProfile }>("/me", { signal });
      return data.data;
    },
  });
}

export function canReadServices(profile?: AuthProfile) {
  return Boolean(profile?.roles.includes("super_admin") || profile?.permissions.includes("services.read"));
}

export function useWorkspaceServices(page: number, limit: number, enabled: boolean) {
  return useQuery({
    queryKey: ["services", { page, limit }],
    enabled,
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ data: ServicePage }>("/services", {
        params: { page, limit },
        signal,
      });
      return data.data;
    },
  });
}

export type ServicePage = {
  items: { id: string; code: string; name: string; isActive: boolean }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
