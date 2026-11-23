import { getServerEnv } from "@/lib/env/server";
import type { NextRequest } from "next/server";
import { apiResponse, withAccessToken } from "@/lib/auth/api-route";
import { createServerApi } from "@/lib/axios/server";
import { sameOrigin } from "@/lib/admin/proxy-policy";
import { removeSession } from "@/lib/auth/session-store";
async function handle(
  request: NextRequest,
  context: RouteContext<"/api/account/sessions/[[...path]]">,
) {
  const { path = [] } = await context.params;
  const id = path[0];
  if (
    path.length > 1 ||
    (id &&
      id !== "others" &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )) ||
    (request.method === "GET" && path.length)
  )
    return apiResponse({ message: "Không tìm thấy." }, 404);
  if (
    request.method === "DELETE" &&
    !sameOrigin(request.headers.get("origin"), getServerEnv().NEXTAUTH_URL)
  )
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  return withAccessToken(request, async (token, sessionId) => {
    const response = await createServerApi(token).request({
      url: "/auth/sessions" + (id ? "/" + id : ""),
      method: request.method,
      params: request.method === "GET" ? request.nextUrl.searchParams : undefined,
      signal: request.signal,
    });
    if (
      request.method === "DELETE" &&
      (!id || request.nextUrl.searchParams.get("current") === "1")
    )
      await removeSession(sessionId);
    return response.data;
  });
}
export { handle as GET, handle as DELETE };
