import type { Page } from "@/lib/contracts/api";

export type Service = {
  id: string;
  code: string;
  name: string;
  category: "WEB" | "SEO" | "OTHER";
  defaultPrice: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServicePage = Page<Pick<Service, "id" | "code" | "name" | "isActive">>;
