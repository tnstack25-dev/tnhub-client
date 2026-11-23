import { saveResource } from "@/lib/admin/admin-api";

export async function saveCatalog(resource: "roles" | "permissions", values: Record<string, unknown>, id?: string) {
  const payload = { ...values, ...(resource === "roles"
    ? { slug: String(values.slug).trim().toLowerCase(), displayName: String(values.displayName).trim() }
    : { module: String(values.module).trim().toLowerCase(), action: String(values.action).trim().toLowerCase() }) };
  await saveResource(resource, payload, id);
}
