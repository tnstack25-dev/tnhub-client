import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, createSerializer } from "nuqs/server";
import nextConfig, { securityHeaders } from "../next.config.ts";
import { palettes, themeStyle } from "../src/lib/theme/palette.ts";
import { resourceParsers, mediaParsers, auditParsers } from "../src/lib/url/list-parsers.ts";
import { parseServerEnv } from "../src/lib/env/schema.ts";
import { buildAuditFilters } from "../src/lib/audit/filters.ts";

test("shared URLs round-trip filters and reject invalid pagination and enum values", () => {
  const serialize = createSerializer(resourceParsers);
  const load = createLoader(resourceParsers);
  const input = {
    page: 3,
    limit: 50,
    search: "thiết kế web",
    status: "INACTIVE",
    category: "WEB",
    clientType: "BUSINESS",
    projectType: "WEB",
    priority: "HIGH",
    clientId: "",
    projectId: "",
    tagId: "",
    expiresBefore: "",
    source: "referral",
    sort: "defaultPrice:asc",
    trash: true,
  };
  assert.deepEqual(load(serialize(input)), input);
  const invalid = load("?page=-2&limit=999&status=UNKNOWN&sort=arbitrary&category=OTHER");
  assert.equal(invalid.page, 1);
  assert.equal(invalid.limit, 20);
  assert.equal(invalid.status, null);
  assert.equal(invalid.sort, "createdAt:desc");
  assert.equal(load("?page=1.5").page, 1);
  assert.equal(load("?page=9007199254740993").page, 1);
});

test("media URL preserves view mode, uploader scope and allowed page sizes", () => {
  const load = createLoader(mediaParsers);
  const serialize = createSerializer(mediaParsers);
  const filters = { page: 2, limit: 48, search: "banner", format: "webp", trash: true, mine: true, layout: "table" };
  assert.deepEqual(load(serialize(filters)), filters);
  assert.equal(load("?limit=100&format=svg&layout=unknown").limit, 24);
  assert.equal(load("?format=svg").format, null);
});

test("audit URL restores the exact export time range and validates manually edited intervals", () => {
  const load = createLoader(auditParsers);
  const filters = load("?eventType=media.uploaded&severity=ERROR&from=2026-11-20T17%3A00%3A00.000Z&to=2026-11-21T17%3A00%3A00.000Z");
  const applied = buildAuditFilters({ eventType: filters.eventType, severity: filters.severity, fromLocal: filters.from, toLocal: filters.to });
  assert.equal(applied.from, "2026-11-20T17:00:00.000Z");
  assert.equal(applied.to, "2026-11-21T17:00:00.000Z");
  assert.throws(() => buildAuditFilters({ fromLocal: filters.to, toLocal: filters.from }));
});

test("server environment validation identifies field names without exposing secrets", () => {
  const valid = { API_URL: "http://localhost:3000/api/v1", NEXTAUTH_URL: "http://localhost:5173", NEXTAUTH_SECRET: "private-secret", AUTH_INTERNAL_SECRET: "internal-secret" };
  assert.equal(parseServerEnv(valid).AUTH_COOKIE_NAME, "refresh_token");
  assert.throws(() => parseServerEnv({ ...valid, API_URL: "file:///private-secret" }), error => /API_URL/.test(error.message) && !/private-secret/.test(error.message));
  assert.throws(() => parseServerEnv({ ...valid, AUTH_INTERNAL_SECRET: "" }), /AUTH_INTERNAL_SECRET/);
});

test("next.config enforces security headers and restricted image optimization", async () => {
  assert.equal(nextConfig.poweredByHeader, false);
  const rules = await nextConfig.headers();
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, "/:path*");
  const headerMap = Object.fromEntries(securityHeaders.map(h => [h.key, h.value]));
  assert.equal(headerMap["X-Content-Type-Options"], "nosniff");
  assert.equal(headerMap["X-Frame-Options"], "DENY");
  assert.equal(headerMap["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headerMap["Permissions-Policy"], /camera=\(\)/);

  assert.deepEqual(nextConfig.images.formats, ["image/avif", "image/webp"]);
  assert.equal(nextConfig.images.maximumRedirects, 0);
  assert.equal(nextConfig.images.maximumResponseBody, 10 * 1024 * 1024);
  assert.equal(nextConfig.images.contentDispositionType, "attachment");
  const hosts = nextConfig.images.remotePatterns.map(p => p.hostname);
  assert.deepEqual(hosts, ["res.cloudinary.com", "*.googleusercontent.com"]);
});

test("light and dark theme palettes define identical semantic tokens and CSS variables", () => {
  assert.deepEqual(Object.keys(palettes.light), Object.keys(palettes.dark));
  for (const key of Object.keys(palettes.light)) {
    assert.ok(palettes.light[key].length > 0);
    assert.ok(palettes.dark[key].length > 0);
    assert.ok(themeStyle.includes(`--tn-${key}:`));
  }
  assert.ok(themeStyle.includes(":root{color-scheme:light;"));
  assert.ok(themeStyle.includes(":root.dark{color-scheme:dark;"));
});
