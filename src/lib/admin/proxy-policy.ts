const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ResourcePolicy = {
  collection?: readonly string[];
  item?: readonly string[];
  trash?: boolean;
  staticActions?: Readonly<Record<string, readonly string[]>>;
  bulk?: {
    root?: readonly string[];
    actions?: Readonly<Record<string, readonly string[]>>;
  };
  itemActions?: Readonly<Record<string, readonly string[]>>;
  nested?: Readonly<
    Record<
      string,
      {
        collection?: readonly string[];
        item?: readonly string[];
        trash?: boolean;
        bulk?: readonly string[];
        bulkActions?: Readonly<Record<string, readonly string[]>>;
        itemActions?: Readonly<Record<string, readonly string[]>>;
        nested?: Readonly<
          Record<
            string,
            {
              collection?: readonly string[];
              item?: readonly string[];
            }
          >
        >;
      }
    >
  >;
};

const softDeleteActions = {
  restore: ["PATCH"],
  permanent: ["DELETE"],
} as const;

export const ADMIN_RESOURCE_POLICIES: Readonly<Record<string, ResourcePolicy>> = {
  "audit-logs": {
    collection: ["GET"],
    item: ["GET"],
    staticActions: { export: ["GET"] },
  },
  health: {
    staticActions: { live: ["GET"], ready: ["GET"] },
  },
  media: {
    collection: ["GET"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    staticActions: { upload: ["POST"] },
    bulk: { root: ["DELETE"], actions: softDeleteActions },
    itemActions: softDeleteActions,
  },
  roles: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: { root: ["DELETE"], actions: softDeleteActions },
    itemActions: { ...softDeleteActions, permissions: ["PUT"] },
  },
  permissions: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: { root: ["DELETE"], actions: softDeleteActions },
    itemActions: softDeleteActions,
  },
  users: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: { root: ["DELETE"], actions: softDeleteActions },
    itemActions: { ...softDeleteActions, roles: ["PUT"] },
  },
  services: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    bulk: { root: ["DELETE", "POST", "PATCH"], actions: { status: ["PATCH"] } },
    itemActions: { status: ["PATCH"] },
  },
  clients: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: {
      root: ["DELETE", "POST", "PATCH"],
      actions: { ...softDeleteActions, status: ["PATCH"] },
    },
    itemActions: softDeleteActions,
    nested: {
      contacts: {
        collection: ["GET", "POST"],
        item: ["GET", "PATCH", "DELETE"],
        bulk: ["POST", "PATCH", "DELETE"],
        itemActions: { primary: ["PATCH"] },
      },
    },
  },
  tags: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    bulk: { root: ["POST", "PATCH", "DELETE"] },
  },
  notifications: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
  },
  websites: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: {
      root: ["DELETE", "POST", "PATCH"],
      actions: { ...softDeleteActions, status: ["PATCH"] },
    },
    itemActions: { ...softDeleteActions, status: ["PATCH"] },
    nested: {
      deliverables: {
        collection: ["GET", "POST"],
        item: ["GET", "PATCH", "DELETE"],
      },
      "maintenance-logs": {
        collection: ["GET", "POST"],
        item: ["GET", "PATCH", "DELETE"],
      },
    },
  },
  projects: {
    collection: ["GET", "POST"],
    item: ["GET", "PATCH", "DELETE"],
    trash: true,
    bulk: {
      root: ["DELETE", "POST", "PATCH"],
      actions: { ...softDeleteActions, status: ["PATCH"] },
    },
    itemActions: { ...softDeleteActions, status: ["PATCH"] },
    nested: {
      members: {
        collection: ["GET", "POST"],
        item: ["DELETE"],
      },
      services: {
        collection: ["GET", "POST"],
        item: ["PATCH", "DELETE"],
      },
      tags: {
        collection: ["GET", "POST", "PUT"],
        item: ["DELETE"],
      },
      milestones: {
        collection: ["GET", "POST"],
        item: ["GET", "PATCH", "DELETE"],
        itemActions: { status: ["PATCH"] },
      },
      "time-entries": {
        collection: ["GET"],
      },
      activities: {
        collection: ["GET"],
      },
      tasks: {
        collection: ["GET", "POST"],
        item: ["GET", "PATCH", "DELETE"],
        trash: true,
        bulk: ["POST", "DELETE"],
        bulkActions: { status: ["PATCH"], restore: ["PATCH"] },
        itemActions: { ...softDeleteActions, status: ["PATCH"] },
        nested: {
          dependencies: {
            collection: ["GET", "POST"],
            item: ["DELETE"],
          },
          checklists: {
            collection: ["GET", "POST"],
            item: ["PATCH", "DELETE"],
          },
          comments: {
            collection: ["GET", "POST"],
            item: ["PATCH", "DELETE"],
          },
          tags: {
            collection: ["GET", "POST", "PUT"],
            item: ["DELETE"],
          },
          "time-entries": {
            collection: ["GET", "POST"],
            item: ["PATCH", "DELETE"],
          },
        },
      },
    },
  },
};

export function adminEndpoint(method: string, parts: string[]): string | null {
  if (parts.length === 0 || parts.length > 6) return null;
  const [resource, second, third, fourth, fifth, sixth] = parts;
  const policy = Object.hasOwn(ADMIN_RESOURCE_POLICIES, resource)
    ? ADMIN_RESOURCE_POLICIES[resource]
    : undefined;
  if (!policy) return null;

  const endpoint = "/" + parts.join("/");

  if (parts.length === 1) {
    return policy.collection?.includes(method) ? endpoint : null;
  }

  if (resource === "notifications" && second === "me") {
    if (parts.length === 2) return method === "GET" ? endpoint : null;
    if (parts.length === 3) {
      if (third === "unread-count" && method === "GET") return endpoint;
      if (third === "read-all" && method === "PATCH") return endpoint;
      return null;
    }
    if (
      parts.length === 4 &&
      uuid.test(third) &&
      ["read", "unread", "archive", "unarchive"].includes(fourth) &&
      method === "PATCH"
    ) {
      return endpoint;
    }
    return null;
  }

  if (second === "trash") {
    if (!policy.trash || method !== "GET") return null;
    return parts.length === 2 || (parts.length === 3 && uuid.test(third))
      ? endpoint
      : null;
  }

  if (second === "bulk") {
    if (!policy.bulk || parts.length > 3) return null;
    if (parts.length === 2) {
      return policy.bulk.root?.includes(method) ? endpoint : null;
    }
    const allowed = Object.hasOwn(policy.bulk.actions ?? {}, third)
      ? policy.bulk.actions?.[third]
      : undefined;
    return allowed?.includes(method) ? endpoint : null;
  }

  if (parts.length === 2 && policy.staticActions && Object.hasOwn(policy.staticActions, second)) {
    return policy.staticActions[second].includes(method) ? endpoint : null;
  }

  if (!uuid.test(second)) return null;

  if (parts.length === 2) {
    return policy.item?.includes(method) ? endpoint : null;
  }

  if (policy.nested && Object.hasOwn(policy.nested, third)) {
    const sub = policy.nested[third];
    if (parts.length === 3) {
      return sub.collection?.includes(method) ? endpoint : null;
    }
    if (fourth === "trash") {
      if (!sub.trash || method !== "GET") return null;
      return parts.length === 4 || (parts.length === 5 && uuid.test(fifth))
        ? endpoint
        : null;
    }
    if (fourth === "bulk") {
      if (parts.length === 4) {
        return sub.bulk?.includes(method) ? endpoint : null;
      }
      if (parts.length === 5) {
        const bulkAct = Object.hasOwn(sub.bulkActions ?? {}, fifth)
          ? sub.bulkActions?.[fifth]
          : undefined;
        return bulkAct?.includes(method) ? endpoint : null;
      }
      return null;
    }
    if (!uuid.test(fourth)) return null;
    if (parts.length === 4) {
      return sub.item?.includes(method) ? endpoint : null;
    }
    if (parts.length === 5 && sub.itemActions && Object.hasOwn(sub.itemActions, fifth)) {
      return sub.itemActions[fifth].includes(method) ? endpoint : null;
    }
    if (sub.nested && Object.hasOwn(sub.nested, fifth)) {
      const deep = sub.nested[fifth];
      if (parts.length === 5) {
        return deep.collection?.includes(method) ? endpoint : null;
      }
      if (parts.length === 6 && uuid.test(sixth)) {
        return deep.item?.includes(method) ? endpoint : null;
      }
    }
    return null;
  }

  if (parts.length > 3) return null;

  const allowed = Object.hasOwn(policy.itemActions ?? {}, third)
    ? policy.itemActions?.[third]
    : undefined;
  return allowed?.includes(method) ? endpoint : null;
}

export function sameOrigin(origin: string | null, configuredUrl: string | undefined) {
  if (!origin || !configuredUrl) return false;
  try {
    return origin === new URL(configuredUrl).origin;
  } catch {
    return false;
  }
}
