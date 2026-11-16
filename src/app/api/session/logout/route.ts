import type { NextRequest } from "next/server";

import { apiError, apiResponse, requestSessionId } from "@/lib/auth/api-route";
import { endSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl || request.headers.get("origin") !== new URL(baseUrl).origin) {
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  }

  try {
    const sessionId = await requestSessionId(request);
    if (sessionId) await endSession(sessionId);
    return apiResponse({ data: { loggedOut: true } });
  } catch (error) {
    return apiError(error);
  }
}
