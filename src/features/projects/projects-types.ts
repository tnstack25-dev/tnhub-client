import type { ProjectTag } from "@/features/tags/tags-types";

export type ProjectType = "WEB" | "SEO" | "MAINTENANCE" | "MIXED" | "OTHER";
export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "CANCELLED";

export type Project = {
  id: string;
  code: string;
  slug: string | null;
  name: string;
  clientId: string;
  projectType: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  description: string | null;
  ownerId: string | null;
  createdById: string | null;
  budget: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
};

export type ProjectMember = {
  projectId: string;
  userId: string;
  joinedAt: string;
};

export type ProjectServiceLink = {
  projectId: string;
  serviceId: string;
  quantity: string;
  unitPrice: string;
  notes: string | null;
  service: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskItem = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: ProjectPriority;
  assigneeId: string | null;
  reporterId: string | null;
  estimatedMinutes: number | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TaskDependencyItem = {
  taskId: string;
  dependsOnTaskId: string;
  dependsOn: {
    id: string;
    title: string;
    status: TaskStatus;
    deletedAt: string | null;
  };
};

export type TaskChecklistItem = {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
};

export type TaskCommentItem = {
  id: string;
  taskId: string;
  authorId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeEntryItem = {
  id: string;
  taskId: string;
  userId: string;
  workDate: string;
  durationMinutes: number;
  isBillable: boolean;
  notes: string | null;
  createdAt: string;
};

export type ProjectActivityItem = {
  id: string;
  projectId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown>;
  createdAt: string;
};

export type { ProjectTag };

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "WEB", label: "Thiết kế Website" },
  { value: "SEO", label: "Dự án SEO" },
  { value: "MAINTENANCE", label: "Bảo trì & Vận hành" },
  { value: "MIXED", label: "Tích hợp (Mixed)" },
  { value: "OTHER", label: "Khác" },
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNING", label: "Lập kế hoạch" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "ON_HOLD", label: "Tạm hoãn" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export const PROJECT_PRIORITY_OPTIONS: {
  value: ProjectPriority;
  label: string;
  color: string;
}[] = [
  { value: "LOW", label: "Thấp", color: "default" },
  { value: "MEDIUM", label: "Trung bình", color: "blue" },
  { value: "HIGH", label: "Cao", color: "orange" },
  { value: "URGENT", label: "Khẩn cấp", color: "red" },
];

export const MILESTONE_STATUS_OPTIONS: {
  value: MilestoneStatus;
  label: string;
}[] = [
  { value: "PENDING", label: "Chờ thực hiện" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "REVIEW", label: "Đang duyệt" },
  { value: "DONE", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
];
