"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { queryKeys } from "@/lib/query-keys";
import { clearSessionCache } from "@/lib/auth/client-cache";
import { listSessions, revokeSession, updateProfile } from "./account-api";

export function useUpdateProfile(onSaved: () => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateProfile, onSuccess: async profile => {
    await client.cancelQueries({ queryKey: queryKeys.profile });
    client.setQueryData(queryKeys.profile, profile);
    await client.invalidateQueries({ queryKey: queryKeys.profile });
    onSaved();
  } });
}
export function useSessions(page: number) {
  return useQuery({ queryKey: queryKeys.sessionList(page), queryFn: ({ signal }) => listSessions(page, signal) });
}
export function useRevokeSession(onRevoked: () => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (input: Parameters<typeof revokeSession>[0]) => {
    await revokeSession(input);
    if (!input.id || input.current) {
      await clearSessionCache(client);
      await signOut({ redirect: false });
      window.location.replace("/login");
    }
  }, onSuccess: async () => {
    await client.invalidateQueries({ queryKey: queryKeys.sessions });
    onRevoked();
  } });
}
