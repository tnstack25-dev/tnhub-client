import type { State } from "@/lib/contracts/state";

export type Permission = {
  id: string;
  slug: string;
  module: string;
  action: string;
  group: string | null;
  description: string | null;
  isSystem: boolean;
  status: State;
};
