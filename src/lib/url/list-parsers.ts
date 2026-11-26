import { createParser, parseAsBoolean, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const pageParser = createParser({
  parse: value => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null,
  serialize: String,
}).withDefault(1);

export function pageSizeParser(defaultValue: number, allowed: readonly number[] = [10, 20, 50, 100]) {
  return createParser({
    parse: value => /^\d+$/.test(value) && allowed.includes(Number(value)) ? Number(value) : null,
    serialize: String,
  }).withDefault(defaultValue);
}

export const resourceParsers = {
  page: pageParser,
  limit: pageSizeParser(20),
  search: parseAsString.withDefault(""),
  status: parseAsStringLiteral([
    "ACTIVE",
    "INACTIVE",
    "LEAD",
    "BLOCKED",
    "SUSPENDED",
    "PENDING_VERIFICATION",
    "PLANNING",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
    "DEVELOPING",
    "STAGING",
    "LIVE",
    "MAINTENANCE",
    "ARCHIVED",
  ] as const),
  category: parseAsStringLiteral(["WEB", "SEO", "OTHER"] as const),
  clientType: parseAsStringLiteral(["BUSINESS", "INDIVIDUAL"] as const),
  projectType: parseAsStringLiteral(["WEB", "SEO", "MAINTENANCE", "MIXED", "OTHER"] as const),
  priority: parseAsStringLiteral(["LOW", "MEDIUM", "HIGH", "URGENT"] as const),
  clientId: parseAsString.withDefault(""),
  projectId: parseAsString.withDefault(""),
  tagId: parseAsString.withDefault(""),
  expiresBefore: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  sort: parseAsStringLiteral([
    "createdAt:desc",
    "createdAt:asc",
    "updatedAt:desc",
    "name:asc",
    "name:desc",
    "status:asc",
    "deadline:asc",
    "deadline:desc",
    "code:asc",
    "displayName:asc",
    "domainExpiresOn:asc",
    "hostingExpiresOn:asc",
    "defaultPrice:asc",
    "defaultPrice:desc",
  ] as const).withDefault("createdAt:desc"),
  trash: parseAsBoolean.withDefault(false),
};

export const mediaParsers = {
  page: pageParser,
  limit: pageSizeParser(24, [12, 24, 48]),
  search: parseAsString.withDefault(""),
  format: parseAsStringLiteral(["jpg", "jpeg", "png", "gif", "webp", "avif"] as const),
  trash: parseAsBoolean.withDefault(false),
  mine: parseAsBoolean.withDefault(false),
  layout: parseAsStringLiteral(["grid", "table"] as const).withDefault("grid"),
};

export const auditParsers = {
  page: pageParser,
  limit: pageSizeParser(20),
  eventType: parseAsString.withDefault(""),
  severity: parseAsStringLiteral(["INFO", "WARNING", "ERROR", "CRITICAL"] as const),
  userId: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
};

export const notificationParsers = {
  tab: parseAsStringLiteral(["inbox", "manage"] as const).withDefault("inbox"),
  state: parseAsStringLiteral(["all", "unread", "archived"] as const).withDefault("all"),
  page: pageParser,
  limit: pageSizeParser(20),
  search: parseAsString.withDefault(""),
};

export const listUrlOptions = { history: "push", shallow: true, scroll: false } as const;
