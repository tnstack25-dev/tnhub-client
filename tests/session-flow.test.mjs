import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import axios, { AxiosError } from "axios";
import { NextRequest } from "next/server.js";
import { encode } from "next-auth/jwt";
import { getValidAccessToken, endSession } from "../src/lib/auth/session.ts";
import { withAccessToken } from "../src/lib/auth/api-route.ts";
import { GET as profileRoute } from "../src/app/api/me/route.ts";

process.env.API_URL = "http://backend.test/api/v1";
process.env.NEXTAUTH_URL = "http://localhost:5173";
process.env.NEXTAUTH_SECRET = "test-auth-secret-only-for-local-tests";
process.env.AUTH_INTERNAL_SECRET = "test-internal-secret-only-for-local-tests";
const originalAdapter = axios.defaults.adapter;
afterEach(() => { axios.defaults.adapter = originalAdapter; });

function backend({ refreshStatus = 200, profileStatus = 200, logoutStatus = 200, missing = false } = {}) {
  let tokens = missing ? null : { accessToken: "expired-access", refreshAfter: 0, refreshToken: "old-refresh", refreshExpiresAt: Date.now() + 60_000, csrfToken: "csrf" };
  let owner;
  let refreshes = 0;
  const accessToken = "header." + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString("base64url") + ".signature";
  axios.defaults.adapter = async config => {
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    const ok = (body, headers = {}) => ({ config, status: 200, statusText: "OK", headers, data: { data: body } });
    const fail = status => { throw new AxiosError("Backend failure", "ERR_BAD_RESPONSE", config, undefined, { config, status, headers: {}, data: { message: "Rejected" } }); };
    if (config.url.endsWith("/operations/begin")) {
      if (!tokens) return ok("missing");
      if (owner) return ok("busy");
      owner = data.owner;
      return ok("acquired");
    }
    if (config.url.endsWith("/operations/finish")) {
      assert.equal(data.owner, owner);
      tokens = data.tokens;
      owner = undefined;
      return ok(true);
    }
    if (config.url.startsWith("/internal/auth/sessions/")) return ok(tokens);
    if (config.url === "/auth/refresh") {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      if (refreshStatus !== 200) return fail(refreshStatus);
      return ok({ accessToken, csrfToken: "new_csrf" }, { "set-cookie": ["refresh_token=new_refresh; Max-Age=3600; HttpOnly"] });
    }
    if (config.url === "/auth/logout") {
      if (logoutStatus !== 200) return fail(logoutStatus);
      return ok({ success: true });
    }
    if (config.url === "/auth/me") {
      if (profileStatus !== 200) return fail(profileStatus);
      assert.equal(config.headers.get("Authorization"), "Bearer " + tokens.accessToken);
      return ok({ id: "user-id", email: "user@example.test", fullName: null, avatarUrl: null, authProvider: "LOCAL", roles: [], permissions: [] });
    }
    throw new Error("Unexpected backend request: " + config.url);
  };
  return { accessToken, get tokens() { return tokens; }, get refreshes() { return refreshes; } };
}

async function authenticatedRequest() {
  const jwt = await encode({ secret: process.env.NEXTAUTH_SECRET, token: { sub: "user-id", backendSessionId: "session-id" } });
  return new NextRequest("http://localhost:5173/api/me", { headers: { cookie: "next-auth.session-token=" + jwt } });
}

test("concurrent expired requests rotate once and reuse the committed access token", async () => {
  const state = backend();
  const results = await Promise.all(Array.from({ length: 4 }, () => getValidAccessToken("session-id")));
  assert.deepEqual(results, Array(4).fill(state.accessToken));
  assert.equal(state.refreshes, 1);
  assert.equal(state.tokens.refreshToken, "new_refresh");
});

test("invalid refresh closes the session and returns no access token", async () => {
  const state = backend({ refreshStatus: 401 });
  assert.equal(await getValidAccessToken("session-id"), null);
  assert.equal(state.tokens, null);
});

test("BFF denies missing sessions and forwards a valid encrypted session to the backend", async () => {
  let called = false;
  const denied = await withAccessToken(new NextRequest("http://localhost:5173/api/me"), async () => { called = true; });
  assert.equal(denied.status, 401);
  assert.equal(called, false);
  backend();
  const result = await profileRoute(await authenticatedRequest());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "private, no-store");
  assert.equal((await result.json()).data.id, "user-id");
});

test("BFF preserves backend forbidden responses", async () => {
  backend({ profileStatus: 403 });
  const result = await profileRoute(await authenticatedRequest());
  assert.equal(result.status, 403);
});

test("logout clears local session even when upstream revocation cannot be confirmed", async () => {
  const state = backend({ logoutStatus: 503 });
  await assert.rejects(endSession("session-id"), error => error.code === "LOGOUT_UNCONFIRMED");
  assert.equal(state.tokens, null);
});
