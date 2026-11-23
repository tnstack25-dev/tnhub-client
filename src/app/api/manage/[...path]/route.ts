import { getServerEnv } from "@/lib/env/server";
import type { NextRequest } from "next/server";
import { apiResponse, withAccessToken } from "@/lib/auth/api-route";
import { createServerApi } from "@/lib/axios/server";
import { adminEndpoint, sameOrigin } from "@/lib/admin/proxy-policy";
import { ApiError } from "@/lib/axios/error";
import { imageError, MAX_IMAGE_BYTES } from "@/lib/media/validation";
async function proxy(
  request: NextRequest,
  context: RouteContext<"/api/manage/[...path]">,
) {
  const { path } = await context.params;
  const endpoint = adminEndpoint(request.method, path);
  if (!endpoint) return apiResponse({ message: "Thao tác không được hỗ trợ." }, 404);
  const write = request.method !== "GET";
  if (write && !sameOrigin(request.headers.get("origin"), getServerEnv().NEXTAUTH_URL))
    return apiResponse({ message: "Nguồn yêu cầu không hợp lệ." }, 403);
  if (endpoint === "/media/upload")
    return withAccessToken(request, async (token) => {
      const length = Number(request.headers.get("content-length"));
      if (length > MAX_IMAGE_BYTES + 65536)
        throw new ApiError("Ảnh vượt quá dung lượng cho phép.", 413);
      const incoming = await request.formData().catch(() => {
        throw new ApiError("Biểu mẫu tải ảnh không hợp lệ.", 400);
      });
      const file = incoming.get("file");
      if (!file || typeof file === "string" || incoming.getAll("file").length !== 1)
        throw new ApiError("Vui lòng chọn một ảnh.", 400);
      const error = imageError(file);
      if (error) throw new ApiError(error, 400);
      const altText = incoming.get("altText");
      if (altText !== null && (typeof altText !== "string" || altText.length > 255))
        throw new ApiError("Mô tả ảnh tối đa 255 ký tự.", 400);
      const form = new FormData();
      form.set("file", file, file.name);
      if (typeof altText === "string") form.set("altText", altText);
      return (
        await createServerApi(token).post(endpoint, form, {
          timeout: 60000,
          maxBodyLength: MAX_IMAGE_BYTES + 65536,
          signal: request.signal,
        })
      ).data;
    });
  let body: unknown;
  if (write) {
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : undefined;
    } catch {
      return apiResponse({ message: "Dữ liệu JSON không hợp lệ." }, 400);
    }
  }
  return withAccessToken(request, async (token) => {
    const response = await createServerApi(token).request({
      url: endpoint,
      method: request.method,
      params: request.nextUrl.searchParams,
      data: body,
      signal: request.signal,
    });
    return response.data;
  });
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
