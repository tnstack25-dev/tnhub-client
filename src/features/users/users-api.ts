import { saveResource } from "@/lib/admin/admin-api";

export async function saveUser(values: Record<string, unknown>, id?: string) {
  const body = Object.fromEntries(Object.entries(values)
    .filter(([key, value]) => value !== undefined && !(key === "password" && value === ""))
    .map(([key, value]) => [key, id && value === "" ? null : value]));
  if (id) delete body.authProvider;
  if (!id && body.authProvider !== "LOCAL") delete body.password;
  await saveResource("users", body, id);
}
