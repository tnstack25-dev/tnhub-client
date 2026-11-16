import "server-only";

import axios from "axios";
import { normalizeApiError } from "./error";

export function createServerApi(accessToken?: string) {
  const baseURL = process.env.API_URL;
  if (!baseURL || !["http:", "https:"].includes(new URL(baseURL).protocol)) {
    throw new Error("API_URL must be an absolute HTTP(S) URL");
  }

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
