import { getServerEnv } from "@/lib/env/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiResponse, withAccessToken } from "@/lib/auth/api-route";
import { createServerApi } from "@/lib/axios/server";
import { sameOrigin } from "@/lib/admin/proxy-policy";
const schema = z.object({
  fullName: z.string().max(150).nullable().optional(),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9._-]{3,50}$/)
    .nullable()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{8,20}$/)
    .nullable()
    .optional(),
  avatarUrl: z.url().nullable().optional(),
  avatarMediaId: z.uuidv4().nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
});
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request.headers.get("origin"), getServerEnv().NEXTAUTH_URL))
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return apiResponse({ message: "Vui lòng kiểm tra thông tin hồ sơ." }, 400);
  return withAccessToken(
    request,
    async (token) => (await createServerApi(token).patch("/auth/me", body.data)).data,
  );
}
