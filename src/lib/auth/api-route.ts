import "server-only";

import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ApiError } from "@/lib/axios/error";
import { getValidAccessToken } from "./session";

const responseHeaders = { "Cache-Control": "private, no-store" };

export function apiResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: responseHeaders });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return apiResponse({ message: error.message, code: error.code }, error.status);
  }

  if (error instanceof ApiError && error.code === "LOGOUT_UNCONFIRMED") {
    return apiResponse({ message: error.message, code: error.code }, 502);
  }

  const status = error instanceof ApiError && error.status === 503 ? 503 : 502;
  return apiResponse({ message: "Dịch vụ tạm thời không khả dụng." }, status);
}

export async function requestSessionId(request: NextRequest) {
  const token = await getToken({ req: request });
  return token?.backendSessionId;
}

export async function withAccessToken(
  request: NextRequest,
  load: (accessToken: string, sessionId: string) => Promise<unknown>,
) {
  try {
    const sessionId = await requestSessionId(request);
    const accessToken = sessionId ? await getValidAccessToken(sessionId) : null;
    if (!sessionId || !accessToken) return apiResponse({ message: "Vui lòng đăng nhập lại." }, 401);
    return apiResponse(await load(accessToken, sessionId));
  } catch (error) {
    return apiError(error);
  }
}
