export type WebsiteStatus =
  | "DEVELOPING"
  | "STAGING"
  | "LIVE"
  | "MAINTENANCE"
  | "ARCHIVED";

export type DeliverableCategory =
  | "UI_UX"
  | "FRONTEND"
  | "BACKEND"
  | "CONTENT"
  | "SEO"
  | "TESTING"
  | "OTHER";

export type DeliverableStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export type MaintenanceType =
  | "UPDATE"
  | "BACKUP"
  | "SECURITY"
  | "FIX"
  | "PERFORMANCE"
  | "OTHER";

export type Website = {
  id: string;
  projectId: string;
  displayName: string;
  domainName: string | null;
  productionUrl: string | null;
  stagingUrl: string | null;
  cms: string | null;
  framework: string | null;
  repositoryUrl: string | null;
  hostingProvider: string | null;
  serverIp: string | null;
  notes: string | null;
  status: WebsiteStatus;
  domainExpiresOn: string | null;
  hostingExpiresOn: string | null;
  launchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WebsiteDeliverable = {
  id: string;
  websiteId: string;
  title: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebsiteMaintenanceLog = {
  id: string;
  websiteId: string;
  performedById: string | null;
  maintenanceType: MaintenanceType;
  description: string;
  performedAt: string;
  nextDueDate: string | null;
  cost: string;
};

export const WEBSITE_STATUS_OPTIONS: { value: WebsiteStatus; label: string }[] = [
  { value: "DEVELOPING", label: "Đang phát triển" },
  { value: "STAGING", label: "Staging" },
  { value: "LIVE", label: "Đang chạy (Live)" },
  { value: "MAINTENANCE", label: "Bảo trì" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

export const DELIVERABLE_CATEGORY_OPTIONS: {
  value: DeliverableCategory;
  label: string;
}[] = [
  { value: "UI_UX", label: "UI / UX" },
  { value: "FRONTEND", label: "Frontend" },
  { value: "BACKEND", label: "Backend" },
  { value: "CONTENT", label: "Nội dung" },
  { value: "SEO", label: "SEO" },
  { value: "TESTING", label: "Kiểm thử" },
  { value: "OTHER", label: "Khác" },
];

export const DELIVERABLE_STATUS_OPTIONS: {
  value: DeliverableStatus;
  label: string;
}[] = [
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "REVIEW", label: "Đang duyệt" },
  { value: "DONE", label: "Hoàn tất" },
];

export const MAINTENANCE_TYPE_OPTIONS: {
  value: MaintenanceType;
  label: string;
}[] = [
  { value: "UPDATE", label: "Cập nhật" },
  { value: "BACKUP", label: "Sao lưu" },
  { value: "SECURITY", label: "Bảo mật" },
  { value: "FIX", label: "Sửa lỗi" },
  { value: "PERFORMANCE", label: "Hiệu năng" },
  { value: "OTHER", label: "Khác" },
];
