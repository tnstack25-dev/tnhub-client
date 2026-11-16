import type { NextRequest } from "next/server";

import { withAccessToken } from "@/lib/auth/api-route";
import { getBackendProfile } from "@/lib/auth/backend";

export function GET(request: NextRequest) {
  return withAccessToken(request, async (token) => ({
    data: await getBackendProfile(token, request.signal),
  }));
}
