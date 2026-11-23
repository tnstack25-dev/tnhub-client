import "server-only";

import axios from "axios";
import { getServerEnv } from "@/lib/env/server";
import { normalizeApiError } from "./error";

export function createServerApi(accessToken?: string) {
  const baseURL = getServerEnv().API_URL;

  const api = axios.create({
    baseURL,
    allowAbsoluteUrls: false,
    maxRedirects: 0,
    timeout: 15000,
    headers: {
      Accept: "application/json",
      Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
    },
  });

  api.interceptors.response.use(undefined, (error) =>
    Promise.reject(axios.isCancel(error) ? error : normalizeApiError(error)),
  );

  return api;
}
