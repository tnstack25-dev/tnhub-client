import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import axios, { AxiosError } from "axios";
import { NextRequest } from "next/server.js";
import { encode } from "next-auth/jwt";
import { apiClient } from "../src/lib/axios/client.ts";
import { uploadMediaFile } from "../src/features/media/media-api.ts";
import { isSelectableImage, selectionLimit, toPickerValue, toggleMediaSelection } from "../src/features/media/media-selection.ts";
import { avatarPatch, profileAvatar } from "../src/features/account/avatar.ts";
import { updateProfile } from "../src/features/account/account-api.ts";
import { PATCH as updateProfileRoute } from "../src/app/api/account/profile/route.ts";

const mediaId = "00000000-0000-4000-8000-000000000015";
const otherId = "00000000-0000-4000-8000-000000000016";
const image = { id: mediaId, secureUrl: "https://images.example.test/avatar.png", originalName: "avatar.png", altText: "Ảnh đại diện", mimeType: "image/png", deletedAt: null, width: 128, height: 128, bytes: 200 };
const profile = { id: "user-id", email: "user@example.test", fullName: null, avatarUrl: image.secureUrl, avatarMediaId: mediaId, authProvider: "LOCAL", roles: [], permissions: [] };
const originalClientAdapter = apiClient.defaults.adapter;
const originalServerAdapter = axios.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalClientAdapter; axios.defaults.adapter = originalServerAdapter; });
const response = (config, data) => ({ config, status: 200, statusText: "OK", headers: {}, data: { data } });

test("avatar form sends IDs for changes and null for removal, preserving unchanged and external avatars", () => {
  const initial = profileAvatar(profile);
  assert.equal(initial[0].id, mediaId);
  assert.deepEqual(avatarPatch(profile, initial), {});
  assert.deepEqual(avatarPatch(profile, [toPickerValue({ ...image, id: otherId })]), { avatarMediaId: otherId });
  assert.deepEqual(avatarPatch(profile, []), { avatarMediaId: null });
  const googleProfile = { avatarUrl: image.secureUrl, avatarMediaId: null };
  assert.deepEqual(avatarPatch(googleProfile, profileAvatar(googleProfile)), {});
  assert.deepEqual(avatarPatch(googleProfile, []), { avatarMediaId: null });
  assert.deepEqual(avatarPatch({ avatarUrl: null, avatarMediaId: null }, []), {});
});

test("picker single selection replaces, multiple selection caps and toggles without duplicates", () => {
  assert.deepEqual(toggleMediaSelection([mediaId], otherId, false, 10), [otherId]);
  assert.deepEqual(toggleMediaSelection([mediaId], mediaId, false, 10), []);
  assert.deepEqual(toggleMediaSelection([mediaId], otherId, true, 2), [mediaId, otherId]);
  assert.deepEqual(toggleMediaSelection([mediaId], otherId, true, 1), [mediaId]);
  assert.equal(selectionLimit(true, -1), 1);
  assert.equal(selectionLimit(false, 10), 1);
});

test("picker rejects deleted, unsupported and unsafe media", () => {
  assert.equal(isSelectableImage(image), true);
  assert.equal(isSelectableImage({ ...image, deletedAt: new Date().toISOString() }), false);
  assert.equal(isSelectableImage({ ...image, mimeType: "image/svg+xml" }), false);
  assert.equal(isSelectableImage({ ...image, secureUrl: "javascript:alert(1)" }), false);
});

test("single upload returns persisted media for immediate selection, and rejects invalid files before HTTP", async () => {
  let calls = 0;
  apiClient.defaults.adapter = async config => { calls++; assert.equal(config.url, "/manage/media/upload"); return response(config, image); };
  const uploaded = await uploadMediaFile(new File(["image"], "avatar.png", { type: "image/png" }), "Avatar");
  assert.equal(uploaded.id, mediaId);
  assert.equal(toPickerValue(uploaded).url, image.secureUrl);
  await assert.rejects(uploadMediaFile(new File(["image"], "avatar.svg", { type: "image/svg+xml" })));
  assert.equal(calls, 1);
});

test("account API returns saved avatar and omits undefined fields without clearing unrelated values", async () => {
  apiClient.defaults.adapter = async config => {
    assert.deepEqual(JSON.parse(config.data), { fullName: "Updated", avatarMediaId: otherId });
    return response(config, { ...profile, fullName: "Updated", avatarMediaId: otherId });
  };
  const saved = await updateProfile({ fullName: " Updated ", avatarMediaId: otherId, avatarUrl: undefined });
  assert.equal(saved.avatarMediaId, otherId);
});

test("profile BFF forwards avatar ID/removal, rejects invalid IDs and preserves backend rejection", async () => {
  process.env.API_URL = "http://backend.test/api/v1";
  process.env.NEXTAUTH_URL = "http://localhost:5173";
  process.env.NEXTAUTH_SECRET = "media-picker-test-secret";
  process.env.AUTH_INTERNAL_SECRET = "media-picker-test-internal-secret";
  const jwt = await encode({ secret: process.env.NEXTAUTH_SECRET, token: { sub: "user-id", backendSessionId: "session-id" } });
  const patches = [];
  let reject = false;
  axios.defaults.adapter = async config => {
    if (config.url.startsWith("/internal/auth/sessions/")) return response(config, { accessToken: "valid-token", refreshAfter: Date.now() + 60_000 });
    assert.equal(config.url, "/auth/me");
    patches.push(JSON.parse(config.data));
    if (reject) throw new AxiosError("Deleted media", "ERR_BAD_REQUEST", config, undefined, { ...response(config, {}), status: 400, data: { message: "Ảnh không còn tồn tại" } });
    return response(config, profile);
  };
  const request = (data, origin = "http://localhost:5173") => new NextRequest("http://localhost:5173/api/account/profile", {
    method: "PATCH", headers: { origin, cookie: "next-auth.session-token=" + jwt, "content-type": "application/json" }, body: JSON.stringify(data),
  });
  assert.equal((await updateProfileRoute(request({ avatarMediaId: otherId }))).status, 200);
  assert.equal((await updateProfileRoute(request({ avatarMediaId: null }))).status, 200);
  assert.deepEqual(patches, [{ avatarMediaId: otherId }, { avatarMediaId: null }]);
  assert.equal((await updateProfileRoute(request({ avatarMediaId: "invalid-id" }))).status, 400);
  assert.equal((await updateProfileRoute(request({ avatarMediaId: otherId }, "http://evil.test"))).status, 403);
  assert.equal(patches.length, 2);
  reject = true;
  const denied = await updateProfileRoute(request({ avatarMediaId: otherId }));
  assert.equal(denied.status, 400);
  assert.match((await denied.json()).message, /không còn tồn tại/);
});
