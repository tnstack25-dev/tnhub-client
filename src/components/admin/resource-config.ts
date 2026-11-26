import type { inferParserType } from "nuqs/server";
import type { resourceParsers } from "@/lib/url/list-parsers";
import type { ReactNode } from "react";
import type { MenuProps, TableColumnsType } from "antd";
import type { AuthProfile } from "@/lib/auth/contracts";
import type { Resource } from "@/lib/admin/resource-types";

export type ResourceAction = "delete" | "restore" | "permanent" | "activate" | "deactivate";
export type ResourceContext = {
  profile?: AuthProfile;
  trash: boolean;
  can: (action: string) => boolean;
  confirm: (ids: string[], action: ResourceAction) => void;
  openDetail: (id: string) => void;
  openEditor: (id?: string) => void;
  openAssignment: (id: string) => void;
  openBatch: (ids?: string[]) => void;
};
export type ResourceFilters = Pick<
  inferParserType<typeof resourceParsers>,
  | "category"
  | "clientType"
  | "projectType"
  | "priority"
  | "clientId"
  | "projectId"
  | "tagId"
  | "expiresBefore"
  | "source"
  | "sort"
> & {
  status?: NonNullable<inferParserType<typeof resourceParsers>["status"]>;
};
export type ResourceConfig<T extends { id: string; }> = {
  resource: Resource;
  title: string;
  description: string;
  icon: ReactNode;
  supportsTrash: boolean;
  formatSkipReason?: (reason: string) => string;
  searchMaxLength: number;
  states: { value: string; label: string; }[];
  columns: (context: ResourceContext) => TableColumnsType<T>;
  actions: (item: T, context: ResourceContext) => MenuProps["items"];
  bulkActions: (ids: string[], items: T[], context: ResourceContext) => MenuProps["items"];
  blocked: (item: T, profile?: AuthProfile) => boolean;
  params?: (filters: ResourceFilters) => Record<string, string | undefined>;
  renderFilters?: (filters: ResourceFilters, update: (value: Partial<ResourceFilters>) => void) => ReactNode;
  renderCreateActions?: (context: ResourceContext) => ReactNode;
  renderEditor: (id: string | undefined, close: () => void) => ReactNode;
  renderDetail: (id: string, trash: boolean, close: () => void) => ReactNode;
  renderAssignment?: (id: string, close: () => void) => ReactNode;
  renderBatch?: (items: T[] | undefined, close: () => void) => ReactNode;
};
