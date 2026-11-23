import { getServerEnv } from "@/lib/env/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiResponse } from "@/lib/auth/api-route";
import { createServerApi } from "@/lib/axios/server";

const email = z.email().max(254);
const token = z.string().min(32).max(256);
const password = z.string().min(12).max(72);
const actions = {
  register: z.object({ email, fullName: z.string().trim().min(1).max(150), password }),
  "verify-email": z.object({ token }),
  "resend-verification": z.object({ email }),
  "forgot-password": z.object({ email }),
  "reset-password": z.object({ token, newPassword: password }),
};

export async function POST(request: NextRequest, { params }: RouteContext<"/api/account/[action]">) {
  const { action } = await params;
  if (!Object.hasOwn(actions, action)) return apiResponse({ message: "Không tìm thấy yêu cầu." }, 404);

  const origin = getServerEnv().NEXTAUTH_URL;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin) {
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  }

  const input = actions[action as keyof typeof actions].safeParse(await request.json().catch(() => null));
  if (!input.success) return apiResponse({ message: "Vui lòng kiểm tra thông tin đã nhập." }, 400);

  try {
    const result = await createServerApi().post("/auth/" + action, input.data, {
      headers: { "User-Agent": request.headers.get("user-agent") ?? undefined },
      signal: request.signal,
    });
    return apiResponse({ data: { success: true } }, result.status);
  } catch (error) {
    return apiError(error);
  }
}
