import { getServerEnv } from "@/lib/env/server";
import "server-only";

import { z } from "zod";

import { createServerApi } from "@/lib/axios/server";

import { profileSchema } from "./contracts";

const issuedTokens = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    csrfToken: z.string().regex(/^[A-Za-z0-9_.-]+$/),
  }),
});

export type BackendTokens = {
  accessToken: string;
  refreshAfter: number;
  refreshToken: string;
  refreshExpiresAt: number;
  csrfToken: string;
};

function refreshCookieName() {
  return getServerEnv().AUTH_COOKIE_NAME || "refresh_token";
}

export function readTokens(data: unknown, cookies: string[]): BackendTokens {
  const { accessToken, csrfToken } = issuedTokens.parse(data).data;
  const prefix = refreshCookieName() + "=";
  const cookie = cookies.find((value) => value.startsWith(prefix));
  const refreshToken = cookie?.split(";", 1)[0].slice(prefix.length);
  const maxAge = Number(cookie?.match(/;\s*Max-Age=(\d+)(?:;|$)/i)?.[1]);
  // The token comes directly from NestJS. Read exp for scheduling.
  const { exp, iat } = z.object({
    exp: z.number().int().positive(),
    iat: z.number().int().positive(),
  }).parse(
    JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString()),
  );

  if (!refreshToken || !/^[A-Za-z0-9_-]+$/.test(refreshToken) || !maxAge) {
    throw new Error("Invalid backend refresh cookie");
  }

  return {
    accessToken,
    refreshAfter: (exp - Math.min(30, (exp - iat) / 5)) * 1000,
    refreshToken,
    refreshExpiresAt: Date.now() + maxAge * 1000,
    csrfToken,
  };
}

export async function loginBackend(
  credentials: { email: string; password: string },
  userAgent?: string,
) {
  const response = await createServerApi().post("/auth/login", credentials, {
    headers: { "User-Agent": userAgent },
  });
  return readTokens(response.data, response.headers["set-cookie"] ?? []);
}

export async function refreshBackend(tokens: BackendTokens) {
  return refreshWithCookies(tokens.refreshToken, tokens.csrfToken);
}

export async function refreshBackendCookies(cookies: string[]) {
  function readCookie(name: string) {
    const prefix = name + "=";
    const value = cookies.find((line) => line.startsWith(prefix))?.split(";", 1)[0].slice(prefix.length);
    return z.string().regex(/^[A-Za-z0-9_.-]+$/).parse(value);
  }
  return refreshWithCookies(readCookie(refreshCookieName()), readCookie("csrf_token"));
}

async function refreshWithCookies(refreshToken: string, csrfToken: string) {
  const response = await createServerApi().post("/auth/refresh", undefined, {
    headers: {
      Cookie: refreshCookieName() + "=" + refreshToken + "; csrf_token=" + csrfToken,
      "X-CSRF-Token": csrfToken,
    },
  });
  return readTokens(response.data, response.headers["set-cookie"] ?? []);
}

export async function getBackendProfile(accessToken: string, signal?: AbortSignal) {
  const { data } = await createServerApi(accessToken).get("/auth/me", { signal });
  return z.object({ data: profileSchema }).parse(data).data;
}

export async function logoutBackend(accessToken: string) {
  await createServerApi(accessToken).post("/auth/logout");
}
