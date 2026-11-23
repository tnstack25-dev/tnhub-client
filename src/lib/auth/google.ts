import { getServerEnv } from "@/lib/env/server";
import "server-only";

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createServerApi } from "@/lib/axios/server";
import { readTokens, refreshBackendCookies, logoutBackend } from "./backend";
import { googleTicketCookie, googleTicketPath, googleTicketTtl } from "./google-ticket";
import { storeGoogleTicket } from "./session-store";

const callbackPath = "/api/v1/auth/google/callback";
const stateCookie = "google_oauth_state";

function redirectTo(url: URL) {
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function setCookie(response: NextResponse, name: string, value: string, path: string, maxAge: number, origin: URL) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: origin.protocol === "https:",
    sameSite: "lax",
    path,
    maxAge,
  });
}

export async function startGoogle(request: NextRequest) {
  const origin = new URL(getServerEnv().NEXTAUTH_URL);
  try {
    const upstream = await createServerApi().get("/auth/google", {
      headers: { "User-Agent": request.headers.get("user-agent") ?? undefined },
      validateStatus: (status) => status === 302 || status === 303,
    });
    const target = new URL(String(upstream.headers.location));
    const cookie = upstream.headers["set-cookie"]?.find((line) => line.startsWith(stateCookie + "="));
    const state = cookie?.split(";", 1)[0].slice(stateCookie.length + 1);
    if (target.origin !== "https://accounts.google.com" || !state || !/^[\w.-]+$/.test(state)) {
      throw new Error("Invalid Google OAuth initiation");
    }

    const response = redirectTo(target);
    setCookie(response, stateCookie, state, callbackPath, 600, origin);
    return response;
  } catch {
    return redirectTo(new URL("/login?google=unavailable", origin));
  }
}

export async function finishGoogle(request: NextRequest) {
  const origin = new URL(getServerEnv().NEXTAUTH_URL ?? request.nextUrl.origin);
  let target = "/login?google=failed";
  let ticket: string | undefined;

  const cookie = request.cookies.get(stateCookie)?.value;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (cookie && /^[\w.-]+$/.test(cookie) && state === cookie && code) {
    try {
      const upstream = await createServerApi().get("/auth/google/callback", {
        params: request.nextUrl.searchParams,
        headers: { Cookie: stateCookie + "=" + cookie, "User-Agent": request.headers.get("user-agent") ?? undefined },
        validateStatus: (status) => status === 200 || status === 303,
      });

      const cookies = upstream.headers["set-cookie"] ?? [];
      const tokens = upstream.status === 303
        ? await refreshBackendCookies(cookies)
        : readTokens(upstream.data, cookies);
      try {
        const id = randomUUID();
        await storeGoogleTicket(id, tokens);
        ticket = id;
        target = "/auth/google/complete";
      } catch {
        await logoutBackend(tokens.accessToken).catch(() => {});
        target = "/login?google=unavailable";
      }
    } catch {
      // The provider denied the request or the backend rejected the callback.
    }
  } else if (state && state === cookie && request.nextUrl.searchParams.get("error") === "access_denied") {
    target = "/login?google=cancelled";
  }

  const response = redirectTo(new URL(target, origin));
  setCookie(response, stateCookie, "", callbackPath, 0, origin);
  setCookie(response, googleTicketCookie, ticket ?? "", googleTicketPath, ticket ? googleTicketTtl : 0, origin);
  return response;
}
