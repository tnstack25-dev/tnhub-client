import "client-only";

import axios from "axios";
import { normalizeApiError } from "./error";

export const apiClient = axios.create({
  baseURL: "/api",
  allowAbsoluteUrls: false,
  timeout: 50000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.response.use(undefined, (error) =>
  Promise.reject(axios.isCancel(error) ? error : normalizeApiError(error)),
);
