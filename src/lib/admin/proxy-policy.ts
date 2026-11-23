const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function adminEndpoint(method: string, parts: string[]): string | null {
  const [resource, id, action] = parts;
  if (resource === "audit-logs")
    return method === "GET" &&
      (parts.length === 1 || (parts.length === 2 && (id === "export" || uuid.test(id))))
      ? "/" + parts.join("/")
      : null;
  if (resource === "media") {
    if (parts.length === 1) return method === "GET" ? "/media" : null;
    if (parts.length === 2 && id === "upload")
      return method === "POST" ? "/media/upload" : null;
    if (id === "bulk")
      return (parts.length === 2 && method === "DELETE") ||
        (parts.length === 3 &&
          ((action === "restore" && method === "PATCH") ||
            (action === "permanent" && method === "DELETE")))
        ? "/" + parts.join("/")
        : null;
    if (id === "trash")
      return method === "GET" &&
        (parts.length === 2 || (parts.length === 3 && uuid.test(action)))
        ? "/" + parts.join("/")
        : null;
    if (!uuid.test(id)) return null;
    return (parts.length === 2 && ["GET", "PATCH", "DELETE"].includes(method)) ||
      (parts.length === 3 &&
        ((action === "restore" && method === "PATCH") ||
          (action === "permanent" && method === "DELETE")))
      ? "/" + parts.join("/")
      : null;
  }
  const service = resource === "services";
  if (
    !["roles", "permissions", "users", "services"].includes(resource) ||
    parts.length > 3
  )
    return null;
  const endpoint = "/" + parts.join("/");
  if (parts.length === 1) return ["GET", "POST"].includes(method) ? endpoint : null;
  if (
    id === "trash" &&
    !service &&
    method === "GET" &&
    (parts.length === 2 || (parts.length === 3 && uuid.test(action)))
  )
    return endpoint;
  if (id === "bulk") {
    if (
      parts.length === 2 &&
      (method === "DELETE" || (service && ["POST", "PATCH"].includes(method)))
    )
      return endpoint;
    if (
      parts.length === 3 &&
      ((service && action === "status" && method === "PATCH") ||
        (!service && action === "restore" && method === "PATCH") ||
        (!service && action === "permanent" && method === "DELETE"))
    )
      return endpoint;
    return null;
  }
  if (!uuid.test(id)) return null;
  if (parts.length === 2 && ["GET", "PATCH", "DELETE"].includes(method)) return endpoint;
  if (
    parts.length === 3 &&
    ((!service &&
      ((action === "restore" && method === "PATCH") ||
        (action === "permanent" && method === "DELETE"))) ||
      (service && action === "status" && method === "PATCH") ||
      (resource === "roles" && action === "permissions" && method === "PUT") ||
      (resource === "users" && action === "roles" && method === "PUT"))
  )
    return endpoint;
  return null;
}
export function sameOrigin(origin: string | null, configuredUrl: string | undefined) {
  if (!origin || !configuredUrl) return false;
  try {
    return origin === new URL(configuredUrl).origin;
  } catch {
    return false;
  }
}
