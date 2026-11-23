"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/lib/contracts/api";
import { queryKeys } from "@/lib/query-keys";
import { getMedia, listMedia } from "./media-api";
export function useMedia(params: ListParams, trash: boolean, enabled: boolean) {
  return useQuery({ queryKey: queryKeys.mediaList(params, trash), enabled,
    queryFn: ({ signal }) => listMedia(params, trash, signal) });
}
export function useMediaDetail(id: string, trash: boolean) {
  return useQuery({ queryKey: queryKeys.mediaDetail(id, trash), staleTime: 0, gcTime: 0, refetchOnReconnect: false,
    queryFn: ({ signal }) => getMedia(id, trash, signal) });
}
export function useRefreshMedia() {
  const client = useQueryClient();
  return () => Promise.all([queryKeys.media, queryKeys.audit].map(queryKey => client.invalidateQueries({ queryKey })));
}
