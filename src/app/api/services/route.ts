import type { NextRequest } from "next/server";

import { withAccessToken } from "@/lib/auth/api-route";
import { createServerApi } from "@/lib/axios/server";

export function GET(request: NextRequest) {
  return withAccessToken(request, async (token) => {
    const response = await createServerApi(token).get("/services", {
      params: request.nextUrl.searchParams,
      signal: request.signal,
    });
    return response.data;
  });
}
