import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { AxiosError } from "axios";
import { apiClient } from "../src/lib/axios/client.ts";
import { ApiError } from "../src/lib/axios/error.ts";
import { createQueryClient } from "../src/lib/query-client.ts";
import { clearSessionCache, isUnauthorizedError } from "../src/lib/auth/client-cache.ts";
import { queryKeys, adminInvalidationKeys } from "../src/lib/query-keys.ts";
import { loadAssignmentCatalog, mutateResource } from "../src/lib/admin/admin-api.ts";
import { formatEntityDetailItems } from "../src/features/admin/components/entity-detail.tsx";
import { saveService, saveServiceBatch } from "../src/features/services/services-api.ts";
import {
  saveClient,
  saveClientBatch,
  saveClientContact,
  setPrimaryClientContact,
  updateClientsStatusBulk,
} from "../src/features/clients/clients-api.ts";
import {
  createTaskChecklist,
  createTaskTimeEntry,
  mutateProjectTasks,
  saveProject,
  saveProjectMilestone,
  saveProjectTask,
} from "../src/features/projects/projects-api.ts";
import { saveTag } from "../src/features/tags/tags-api.ts";
import {
  saveWebsite,
  saveWebsiteDeliverable,
  saveWebsiteMaintenanceLog,
} from "../src/features/websites/websites-api.ts";
import {
  changeMyNotificationState,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  saveAdminNotification,
} from "../src/features/notifications/notifications-api.ts";
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

test("assignment catalog loads pages in parallel, supports server search and bounds page count", async () => {
  const requestedPages = [];
  apiClient.defaults.adapter = async config => {
    requestedPages.push({ page: config.params.page, search: config.params.search });
    return response(config, {
      items: [{ id: `perm-${config.params.page}`, slug: `perm.${config.params.page}` }],
      meta: { page: config.params.page, limit: 100, total: 400, totalPages: 4 },
    });
  };
  const result = await loadAssignmentCatalog("permissions", { search: " users ", maxPages: 2 });
  assert.equal(result.length, 2);
  assert.equal(result.total, 400);
  assert.equal(result.truncated, true);
  assert.deepEqual(requestedPages, [
    { page: 1, search: "users" },
    { page: 2, search: "users" },
  ]);
});

test("entity detail formatter supports custom field label maps without coupling to specific domain types", () => {
  const customItem = {
    id: "1",
    orderCode: "ORD-01",
    totalAmount: "500000",
    note: null,
  };
  const items = formatEntityDetailItems(customItem, {
    orderCode: "Mã đơn hàng",
    totalAmount: "Tổng tiền",
    note: "Ghi chú",
  });
  assert.deepEqual(items, [
    { key: "orderCode", label: "Mã đơn hàng", children: "ORD-01" },
    { key: "totalAmount", label: "Tổng tiền", children: "500000" },
    { key: "note", label: "Ghi chú", children: "—" },
  ]);
});

test("centralized 401 handler invalidates profile on unauthorized queries and mutations without looping", async () => {
  const client = createQueryClient();
  try {
    client.setQueryData(queryKeys.profile, { id: "user-1" });
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, false);

    // 403 Forbidden should NOT invalidate the user's session profile
    await assert.rejects(
      client.fetchQuery({
        queryKey: queryKeys.adminList("roles", { page: 1 }, false),
        queryFn: async () => {
          throw new ApiError("Forbidden", 403);
        },
      }),
    );
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, false);

    // 401 Unauthorized on any workspace query must invalidate queryKeys.profile
    await assert.rejects(
      client.fetchQuery({
        queryKey: queryKeys.adminList("services", { page: 1 }, false),
        queryFn: async () => {
          throw new ApiError("Unauthorized", 401);
        },
      }),
    );
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, true);

    // Reset profile state, then test a 401 mutation
    client.setQueryData(queryKeys.profile, { id: "user-1" });
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, false);

    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => {
        throw new ApiError("Session expired", 401);
      },
    });
    await assert.rejects(mutation.execute());
    assert.equal(client.getQueryState(queryKeys.profile).isInvalidated, true);
    assert.equal(isUnauthorizedError(new ApiError("Expired", 401)), true);
    assert.equal(isUnauthorizedError(new ApiError("Forbidden", 403)), false);
  } finally {
    client.clear();
  }
});

test("client and contact APIs trim text, convert cleared nullable fields to null on update and call exact server endpoints", async () => {
  const calls = [];
  apiClient.defaults.adapter = async config => {
    calls.push(config);
    return response(config, { id: "c-1", affectedCount: 1, skipped: [] });
  };

  // Create client omits empty optional strings and forbidden fields
  await saveClient({
    id: "ignored",
    createdById: "ignored",
    name: "  TN Agency  ",
    clientType: "BUSINESS",
    status: "LEAD",
    email: "   ",
    source: " referral ",
  });
  assert.equal(calls[0].url, "/manage/clients");
  assert.equal(calls[0].method, "post");
  assert.deepEqual(payload(calls[0]), {
    name: "TN Agency",
    clientType: "BUSINESS",
    status: "LEAD",
    source: "referral",
  });

  // Update client converts cleared optional strings to null so backend clears DB columns
  await saveClient(
    {
      name: " TN Agency Updated ",
      email: "",
      taxCode: " 0101234567 ",
    },
    "client-uuid",
  );
  assert.equal(calls[1].url, "/manage/clients/client-uuid");
  assert.equal(calls[1].method, "patch");
  assert.deepEqual(payload(calls[1]), {
    name: "TN Agency Updated",
    email: null,
    taxCode: "0101234567",
  });

  // Bulk status update and batch update
  await updateClientsStatusBulk(["id-1", "id-2"], "ACTIVE");
  assert.equal(calls[2].url, "/manage/clients/bulk/status");
  assert.deepEqual(payload(calls[2]), { ids: ["id-1", "id-2"], status: "ACTIVE" });

  await saveClientBatch(
    { items: [{ name: " Batch Co ", email: "" }] },
    [{ id: "id-1", name: "Old", clientType: "BUSINESS", status: "ACTIVE" }],
  );
  assert.equal(calls[3].url, "/manage/clients/bulk");
  assert.equal(calls[3].method, "patch");
  assert.deepEqual(payload(calls[3]), {
    items: [{ id: "id-1", name: "Batch Co", email: null }],
  });

  // Contact create, update and primary switch
  await saveClientContact("client-uuid", {
    fullName: " Nguyễn An ",
    title: " Giám đốc ",
    email: "",
    isPrimary: true,
  });
  assert.equal(calls[4].url, "/manage/clients/client-uuid/contacts");
  assert.deepEqual(payload(calls[4]), {
    fullName: "Nguyễn An",
    title: "Giám đốc",
    isPrimary: true,
  });

  await setPrimaryClientContact("client-uuid", "contact-uuid");
  assert.equal(
    calls[5].url,
    "/manage/clients/client-uuid/contacts/contact-uuid/primary",
  );
  assert.equal(calls[5].method, "patch");
});

test("project, work, tag and website APIs enforce immutable fields, uppercase codes and nested endpoints", async () => {
  const calls = [];
  apiClient.defaults.adapter = async config => {
    calls.push(config);
    return response(config, { id: "p-1", affectedCount: 1, skipped: [] });
  };

  // Create project normalizes code to uppercase and clientId to lowercase
  await saveProject({
    code: " web-2026-01 ",
    name: " Website Portal ",
    clientId: "A11C1E00-2026-4000-8000-000000000001",
    projectType: "WEB",
    priority: "HIGH",
    budget: "15000000.00",
    currency: "vnd",
    deadline: "",
  });
  assert.equal(calls[0].url, "/manage/projects");
  assert.deepEqual(payload(calls[0]), {
    code: "WEB-2026-01",
    name: "Website Portal",
    clientId: "a11c1e00-2026-4000-8000-000000000001",
    projectType: "WEB",
    priority: "HIGH",
    budget: "15000000.00",
    currency: "VND",
  });

  // Update project strips immutable code & currency and sets cleared nullable fields to null
  await saveProject(
    {
      code: "IGNORED",
      currency: "USD",
      name: " Website Portal V2 ",
      deadline: "",
    },
    "proj-id",
  );
  assert.equal(calls[1].url, "/manage/projects/proj-id");
  assert.equal(calls[1].method, "patch");
  assert.deepEqual(payload(calls[1]), {
    name: "Website Portal V2",
    deadline: null,
  });

  // Milestones, Tasks, Checklists, and Time Entries
  await saveProjectMilestone("proj-id", { title: " Phase 1 ", dueDate: "2026-12-31" });
  assert.equal(calls[2].url, "/manage/projects/proj-id/milestones");
  assert.deepEqual(payload(calls[2]), { title: "Phase 1", dueDate: "2026-12-31" });

  await saveProjectTask("proj-id", {
    title: " Build Header ",
    priority: "URGENT",
    estimatedMinutes: 90,
  });
  assert.equal(calls[3].url, "/manage/projects/proj-id/tasks");
  assert.deepEqual(payload(calls[3]), {
    title: "Build Header",
    priority: "URGENT",
    estimatedMinutes: 90,
  });

  await mutateProjectTasks("proj-id", {
    ids: ["t-1", "t-2"],
    action: "status",
    status: "DONE",
  });
  assert.equal(calls[4].url, "/manage/projects/proj-id/tasks/bulk/status");
  assert.deepEqual(payload(calls[4]), { ids: ["t-1", "t-2"], status: "DONE" });

  await createTaskChecklist("proj-id", "t-1", " Unit Test ");
  assert.equal(calls[5].url, "/manage/projects/proj-id/tasks/t-1/checklists");
  assert.deepEqual(payload(calls[5]), { title: "Unit Test" });

  await createTaskTimeEntry("proj-id", "t-1", {
    durationMinutes: 45,
    isBillable: true,
    notes: " Done ",
  });
  assert.equal(calls[6].url, "/manage/projects/proj-id/tasks/t-1/time-entries");
  assert.deepEqual(payload(calls[6]), {
    durationMinutes: 45,
    isBillable: true,
    notes: "Done",
  });

  // Tags and Websites
  await saveTag({ name: " Sprint 1 ", color: " #2563eb " });
  assert.equal(calls[7].url, "/manage/tags");
  assert.deepEqual(payload(calls[7]), { name: "Sprint 1", color: "#2563EB" });

  await saveWebsite({
    projectId: "6F0B3F3F-A8EC-4C23-A511-55985F3DE0A0",
    displayName: " Main Site ",
    domainName: " EXAMPLE.COM ",
  });
  assert.equal(calls[8].url, "/manage/websites");
  assert.deepEqual(payload(calls[8]), {
    projectId: "6f0b3f3f-a8ec-4c23-a511-55985f3de0a0",
    displayName: "Main Site",
    domainName: "example.com",
  });

  await saveWebsiteDeliverable("web-id", {
    title: " UI Design ",
    category: "UI_UX",
    status: "DONE",
  });
  assert.equal(calls[9].url, "/manage/websites/web-id/deliverables");

  await saveWebsiteMaintenanceLog("web-id", {
    maintenanceType: "SECURITY",
    description: " Patch SSL ",
    cost: "250000.00",
  });
  assert.equal(calls[10].url, "/manage/websites/web-id/maintenance-logs");
  assert.deepEqual(payload(calls[10]), {
    maintenanceType: "SECURITY",
    description: "Patch SSL",
    cost: "250000.00",
  });
});

test("notification APIs normalize recipient IDs, omit userIds on PATCH and call inbox state endpoints", async () => {
  const calls = [];
  apiClient.defaults.adapter = async config => {
    calls.push(config);
    return response(config, { count: 3, affectedCount: 1, id: "n-1" });
  };

  // Create notification uppercases type, deduplicates and lowercases userIds
  await saveAdminNotification({
    type: " system_alert ",
    title: " Bảo trì hệ thống ",
    body: " Hệ thống bảo trì lúc 23:00 ",
    priority: 8,
    actionUrl: "",
    userIds: [
      "00000000-0000-4000-8000-00000000000A",
      "00000000-0000-4000-8000-00000000000a",
    ],
  });
  assert.equal(calls[0].url, "/manage/notifications");
  assert.equal(calls[0].method, "post");
  assert.deepEqual(payload(calls[0]), {
    type: "SYSTEM_ALERT",
    title: "Bảo trì hệ thống",
    body: "Hệ thống bảo trì lúc 23:00",
    priority: 8,
    userIds: ["00000000-0000-4000-8000-00000000000a"],
  });

  // Update notification strips userIds and converts cleared nullable fields to null
  await saveAdminNotification(
    {
      title: " Bảo trì hoàn tất ",
      actionUrl: "",
      userIds: ["00000000-0000-4000-8000-00000000000a"],
    },
    "notif-id",
  );
  assert.equal(calls[1].url, "/manage/notifications/notif-id");
  assert.equal(calls[1].method, "patch");
  assert.deepEqual(payload(calls[1]), {
    title: "Bảo trì hoàn tất",
    actionUrl: null,
  });

  // Personal inbox endpoints
  const unread = await getUnreadNotificationCount();
  assert.equal(unread, 3);
  assert.equal(calls[2].url, "/manage/notifications/me/unread-count");

  await markAllNotificationsRead();
  assert.equal(calls[3].url, "/manage/notifications/me/read-all");
  assert.equal(calls[3].method, "patch");

  await changeMyNotificationState("receipt-uuid", "archive");
  assert.equal(calls[4].url, "/manage/notifications/me/receipt-uuid/archive");
  assert.equal(calls[4].method, "patch");
});
