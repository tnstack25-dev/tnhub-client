import type { Page } from "@/lib/contracts/api";

export type ClientType = "BUSINESS" | "INDIVIDUAL";
export type ClientStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export type ClientContact = {
  id: string;
  clientId: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  clientType: ClientType;
  status: ClientStatus;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  taxCode: string | null;
  address: string | null;
  source: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    contacts: number;
  };
};

export type ClientPage = Page<Client>;
export type ContactPage = Page<ClientContact>;

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  BUSINESS: "Doanh nghiệp",
  INDIVIDUAL: "Cá nhân",
};

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "LEAD", label: "Tiềm năng" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Tạm ngưng" },
];
