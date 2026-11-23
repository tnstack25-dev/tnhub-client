import { z } from "zod";

const httpUrl = z.url().refine(value => ["http:", "https:"].includes(new URL(value).protocol));
const serverEnvSchema = z.object({
  API_URL: httpUrl,
  NEXTAUTH_URL: httpUrl,
  NEXTAUTH_SECRET: z.string().min(1),
  AUTH_INTERNAL_SECRET: z.string().min(1),
  AUTH_COOKIE_NAME: z.string().regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/).default("refresh_token"),
});

export function parseServerEnv(input: Record<string, string | undefined>) {
  const result = serverEnvSchema.safeParse(input);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map(issue => issue.path[0]))];
    throw new Error("Missing or invalid server environment: " + fields.join(", "));
  }
  return result.data;
}
