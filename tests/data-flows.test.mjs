import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { AxiosError } from "axios";
import { apiClient } from "../src/lib/axios/client.ts";
import { createQueryClient } from "../src/lib/query-client.ts";
import { clearSessionCache } from "../src/lib/auth/client-cache.ts";
import { queryKeys, adminInvalidationKeys } from "../src/lib/query-keys.ts";
import { mutateResource } from "../src/lib/admin/admin-api.ts";
import { saveService, saveServiceBatch } from "../src/features/services/services-api.ts";
import { uploadMediaFiles, mutateMedia } from "../src/features/media/media-api.ts";
import { allowed } from "../src/lib/auth/permissions.ts";
import { accessRowActions } from "../src/features/admin/access-actions.ts";

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });
const response = (config, data) => ({ status: 200, statusText: "OK", headers: {}, config, data: { data } });
const payload = config => typeof config.data === "string" ? JSON.parse(config.data) : config.data;

test("service mutations preserve immutable fields, decimal precision and dedicated status endpoints", async () => {
  const calls = [];
  apiClient.defaults.adapter = async config => { calls.push(config); return response(config, { affectedCount: 1, skipped: [] }); };
  await saveService({ code: "IMMUTABLE", name: "Updated", defaultPrice: "9999999999999999.99", isActive: true }, "service-id");
  assert.deepEqual(payload(calls[0]), { name: "Updated", defaultPrice: "9999999999999999.99" });
  await saveServiceBatch({ items: [{ code: "IMMUTABLE", isActive: true, defaultPrice: "0.10" }] }, [{ id: "service-id" }]);
  assert.deepEqual(payload(calls[1]), { items: [{ id: "service-id", defaultPrice: "0.10" }] });
  await mutateResource("services", { ids: ["a", "b"], action: "deactivate" });
  assert.equal(calls[2].url, "/manage/services/bulk/status");
  assert.equal(calls[2].method, "patch");
  assert.deepEqual(payload(calls[2]), { ids: ["a", "b"], isActive: false });
  await mutateResource("services", { ids: ["a"], action: "permanent" });
  assert.equal(calls[3].url, "/manage/services/a");
  await assert.rejects(mutateResource("services", { ids: [], action: "delete" }));
});

test("bulk results retain skipped entries and failures stay failures", async () => {
  const report = { affectedCount: 1, skipped: [{ id: "protected", reason: "SYSTEM_ROLE" }] };
  apiClient.defaults.adapter = async config => response(config, report);
  assert.deepEqual(await mutateResource("roles", { ids: ["ordinary", "protected"], action: "delete" }), report);
  await assert.rejects(mutateMedia({ ids: Array.from({ length: 51 }, (_, i) => String(i)), action: "delete" }));
  apiClient.defaults.adapter = async config => {
    throw new AxiosError("Forbidden", "ERR_BAD_REQUEST", config, undefined, { ...response(config, {}), status: 403, data: { message: "Denied" } });
  };
  await assert.rejects(mutateResource("roles", { ids: ["ordinary"], action: "delete" }), error => error.status === 403);
});

test("upload continues after a failed image and returns only successful IDs for removal", async () => {
  let count = 0;
  apiClient.defaults.adapter = async config => {
    count++;
    if (count === 2) throw new AxiosError("Disconnected", "ERR_NETWORK", config);
    return response(config, {});
  };
  const files = ["a", "b", "c"].map(uid => ({ uid, name: uid + ".png", file: new File(["image"], uid + ".png", { type: "image/png" }) }));
  const progress = [];
  const result = await uploadMediaFiles(files, " description ", event => progress.push(event));
  assert.deepEqual(result.succeeded, ["a", "c"]);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /^b\.png:/);
  assert.equal(count, 3);
  assert.deepEqual(progress.map(event => event.index), [1, 2, 3]);
});

test("invalidation refreshes affected service lists and details without discarding unrelated user data", async () => {
  const client = createQueryClient();
  try {
    const list = queryKeys.adminList("services", { page: 1, limit: 20 }, false);
    const detail = queryKeys.adminDetail("services", "a");
    const users = queryKeys.adminList("users", { page: 1 }, false);
    for (const key of [list, detail, users, queryKeys.serviceList(1, 5), queryKeys.profile]) client.setQueryData(key, { value: "cached" });
    await Promise.all(adminInvalidationKeys("services").map(queryKey => client.invalidateQueries({ queryKey })));
    assert.equal(client.getQueryState(list).isInvalidated, true);
    assert.equal(client.getQueryState(detail).isInvalidated, true);
    assert.equal(client.getQueryState(queryKeys.serviceList(1, 5)).isInvalidated, true);
    assert.equal(client.getQueryState(users).isInvalidated, false);
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, false);
    assert.ok(adminInvalidationKeys("roles").some(key => JSON.stringify(key) === JSON.stringify(queryKeys.profile)));
  } finally { client.clear(); }
});

test("clearing a session cancels pending requests and prevents stale identity data returning", async () => {
  const client = createQueryClient();
  let resolve;
  const pending = client.fetchQuery({ queryKey: queryKeys.profile, queryFn: () => new Promise(done => { resolve = done; }) }).catch(() => {});
  await clearSessionCache(client);
  resolve({ id: "previous-user" });
  await pending;
  assert.equal(client.getQueryData(queryKeys.profile), undefined);
  assert.equal(client.getQueryCache().getAll().length, 0);
});

test("permission UI omits unauthorized actions and disables protected deletion", () => {
  assert.equal(allowed(undefined, "users.delete"), false);
  assert.equal(allowed({ roles: [], permissions: ["users.read"] }, "users.delete"), false);
  assert.equal(allowed({ roles: ["super_admin"], permissions: [] }, "users.delete"), true);
  const context = { trash: false, can: () => false, openDetail() {}, openEditor() {}, confirm() {} };
  assert.deepEqual(accessRowActions("a", context, { blocked: false }).map(item => item.key), ["detail"]);
  const actions = accessRowActions("system", { ...context, can: () => true }, { blocked: true });
  assert.equal(actions.find(item => item.key === "delete").disabled, true);
});
