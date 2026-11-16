import type { NextRequest } from "next/server";
import { z } from "zod";

import { apiResponse, withAccessToken } from "@/lib/auth/api-route";
import { removeSession } from "@/lib/auth/session-store";
import { createServerApi } from "@/lib/axios/server";

const passwordChange = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(12).max(72),
});

export async function POST(request: NextRequest) {
  const origin = process.env.NEXTAUTH_URL;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin) {
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  }

  const input = passwordChange.safeParse(await request.json().catch(() => null));
  if (!input.success) return apiResponse({ message: "Vui lòng kiểm tra mật khẩu đã nhập." }, 400);

  return withAccessToken(request, async (token, sessionId) => {
    await createServerApi(token).post("/auth/change-password", input.data);
    await removeSession(sessionId).catch(() => {
      console.error("Unable to clear local session after password change");
    });
    return { data: { success: true } };
  });
}
