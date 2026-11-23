"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuthProfile } from "@/lib/auth/contracts";
import { apiClient } from "@/lib/axios/client";
import { queryKeys } from "@/lib/query-keys";

export function useWorkspaceProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{ data: AuthProfile }>("/me", { signal });
      return data.data;
    },
  });
}
