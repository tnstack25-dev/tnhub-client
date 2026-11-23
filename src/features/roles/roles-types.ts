import type { State } from "@/lib/contracts/state";

export type Role = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  priority: number;
  isSystem: boolean;
  status: State;
  userCount: number;
  permissions: { id: string; slug: string }[];
};
