import { z } from "zod";

export const profileSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  avatarMediaId: z.uuidv4().nullable().optional(),
  authProvider: z.string(),
  username: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type AuthProfile = z.infer<typeof profileSchema>;
