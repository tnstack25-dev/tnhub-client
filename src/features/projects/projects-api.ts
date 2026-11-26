import { apiClient } from "@/lib/axios/client";
import { saveResource } from "@/lib/admin/admin-api";
import type { ApiResponse, BulkResult, Page } from "@/lib/contracts/api";
import type {
  Milestone,
  MilestoneStatus,
  Project,
  ProjectActivityItem,
  ProjectMember,
  ProjectServiceLink,
  ProjectStatus,
  ProjectTag,
  TaskChecklistItem,
  TaskCommentItem,
  TaskDependencyItem,
  TaskItem,
  TaskStatus,
  TimeEntryItem,
} from "./projects-types";

const NULLABLE_PROJECT_FIELDS = [
  "slug",
  "description",
  "ownerId",
  "startDate",
  "endDate",
  "deadline",
] as const;

export function sanitizeProjectPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (!isUpdate && typeof values.code === "string" && values.code.trim()) {
    payload.code = values.code.trim().toUpperCase();
  }
  if (!isUpdate && typeof values.currency === "string" && values.currency.trim()) {
    payload.currency = values.currency.trim().toUpperCase();
  }
  if (typeof values.name === "string" && values.name.trim()) {
    payload.name = values.name.trim();
  }
  if (typeof values.clientId === "string" && values.clientId.trim()) {
    payload.clientId = values.clientId.trim().toLowerCase();
  }
  if (typeof values.projectType === "string" && values.projectType) {
    payload.projectType = values.projectType;
  }
  if (typeof values.priority === "string" && values.priority) {
    payload.priority = values.priority;
  }
  if (values.budget !== undefined && values.budget !== null && String(values.budget).trim() !== "") {
    payload.budget = String(values.budget).trim();
  }
  for (const key of NULLABLE_PROJECT_FIELDS) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = values[key];
    if (raw === undefined) continue;
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    if (trimmed === "" || trimmed === null) {
      if (isUpdate) payload[key] = null;
    } else if (typeof trimmed === "string") {
      payload[key] = key === "ownerId" || key === "slug" ? trimmed.toLowerCase() : trimmed;
    }
  }
  return payload;
}

export async function saveProject(values: Record<string, unknown>, id?: string) {
  const body = sanitizeProjectPayload(values, Boolean(id));
  await saveResource("projects", body, id);
}

export async function saveProjectBatch(
  values: { items: Record<string, unknown>[] },
  items?: Project[],
) {
  const isUpdate = Boolean(items);
  const body = {
    items: values.items.map((row, index) => ({
      ...sanitizeProjectPayload(row, isUpdate),
      ...(items ? { id: items[index].id } : {}),
    })),
  };
  if (items) {
    return (await apiClient.patch<ApiResponse<BulkResult>>("/manage/projects/bulk", body)).data.data;
  }
  return (await apiClient.post<ApiResponse<BulkResult>>("/manage/projects/bulk", body)).data.data;
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  return (
    await apiClient.patch<ApiResponse<Project>>(`/manage/projects/${id}/status`, {
      status,
    })
  ).data.data;
}

export async function updateProjectsStatusBulk(ids: string[], status: ProjectStatus) {
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một dự án.");
  return (
    await apiClient.patch<ApiResponse<BulkResult>>("/manage/projects/bulk/status", {
      ids,
      status,
    })
  ).data.data;
}

// --- Project Members, Services & Tags ---

export async function listProjectMembers(projectId: string, signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<Page<ProjectMember>>>(
      `/manage/projects/${projectId}/members`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function addProjectMember(projectId: string, userId: string) {
  return (
    await apiClient.post<ApiResponse<ProjectMember>>(
      `/manage/projects/${projectId}/members`,
      { userId: userId.trim().toLowerCase() },
    )
  ).data.data;
}

export async function removeProjectMember(projectId: string, userId: string) {
  return (
    await apiClient.delete<ApiResponse<ProjectMember>>(
      `/manage/projects/${projectId}/members/${userId}`,
    )
  ).data.data;
}

export async function listProjectServices(projectId: string, signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<Page<ProjectServiceLink>>>(
      `/manage/projects/${projectId}/services`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function addProjectService(
  projectId: string,
  input: { serviceId: string; quantity?: string; unitPrice?: string; notes?: string },
) {
  const body: Record<string, unknown> = {
    serviceId: input.serviceId.trim().toLowerCase(),
  };
  if (input.quantity && String(input.quantity).trim()) body.quantity = String(input.quantity).trim();
  if (input.unitPrice && String(input.unitPrice).trim()) body.unitPrice = String(input.unitPrice).trim();
  if (input.notes && input.notes.trim()) body.notes = input.notes.trim();
  return (
    await apiClient.post<ApiResponse<ProjectServiceLink>>(
      `/manage/projects/${projectId}/services`,
      body,
    )
  ).data.data;
}

export async function updateProjectService(
  projectId: string,
  serviceId: string,
  input: { quantity?: string; unitPrice?: string; notes?: string | null },
) {
  const body: Record<string, unknown> = {};
  if (input.quantity && String(input.quantity).trim()) body.quantity = String(input.quantity).trim();
  if (input.unitPrice && String(input.unitPrice).trim()) body.unitPrice = String(input.unitPrice).trim();
  if (Object.hasOwn(input, "notes")) {
    body.notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  }
  return (
    await apiClient.patch<ApiResponse<ProjectServiceLink>>(
      `/manage/projects/${projectId}/services/${serviceId}`,
      body,
    )
  ).data.data;
}

export async function removeProjectService(projectId: string, serviceId: string) {
  return (
    await apiClient.delete<ApiResponse<ProjectServiceLink>>(
      `/manage/projects/${projectId}/services/${serviceId}`,
    )
  ).data.data;
}

export async function listProjectTags(projectId: string, signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<Page<ProjectTag>>>(
      `/manage/projects/${projectId}/tags`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function addProjectTags(projectId: string, tagIds: string[]) {
  return (
    await apiClient.post<ApiResponse<{ items: ProjectTag[] }>>(
      `/manage/projects/${projectId}/tags`,
      { tagIds: tagIds.map((id) => id.trim().toLowerCase()) },
    )
  ).data.data;
}

export async function replaceProjectTags(projectId: string, tagIds: string[]) {
  return (
    await apiClient.put<ApiResponse<{ items: ProjectTag[] }>>(
      `/manage/projects/${projectId}/tags`,
      { tagIds },
    )
  ).data.data;
}

export async function removeProjectTag(projectId: string, tagId: string) {
  return (
    await apiClient.delete<ApiResponse<ProjectTag>>(
      `/manage/projects/${projectId}/tags/${tagId}`,
    )
  ).data.data;
}

// --- Milestones ---

export async function listProjectMilestones(projectId: string, signal?: AbortSignal) {
  return (
    await apiClient.get<ApiResponse<Page<Milestone>>>(
      `/manage/projects/${projectId}/milestones`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function getProjectMilestone(
  projectId: string,
  milestoneId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Milestone>>(
      `/manage/projects/${projectId}/milestones/${milestoneId}`,
      { signal },
    )
  ).data.data;
}

export async function saveProjectMilestone(
  projectId: string,
  values: Record<string, unknown>,
  milestoneId?: string,
) {
  const isUpdate = Boolean(milestoneId);
  const body: Record<string, unknown> = {};
  if (typeof values.title === "string" && values.title.trim()) {
    body.title = values.title.trim();
  }
  if (typeof values.sortOrder === "number") body.sortOrder = values.sortOrder;
  for (const key of ["description", "dueDate"] as const) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = typeof values[key] === "string" ? values[key].trim() : values[key];
    if (!raw) {
      if (isUpdate) body[key] = null;
    } else {
      body[key] = raw;
    }
  }
  if (milestoneId) {
    return (
      await apiClient.patch<ApiResponse<Milestone>>(
        `/manage/projects/${projectId}/milestones/${milestoneId}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<Milestone>>(
      `/manage/projects/${projectId}/milestones`,
      body,
    )
  ).data.data;
}

export async function updateMilestoneStatus(
  projectId: string,
  milestoneId: string,
  status: MilestoneStatus,
) {
  return (
    await apiClient.patch<ApiResponse<Milestone>>(
      `/manage/projects/${projectId}/milestones/${milestoneId}/status`,
      { status },
    )
  ).data.data;
}

export async function deleteProjectMilestone(projectId: string, milestoneId: string) {
  return (
    await apiClient.delete<ApiResponse<Milestone>>(
      `/manage/projects/${projectId}/milestones/${milestoneId}`,
    )
  ).data.data;
}

// --- Tasks ---

export async function listProjectTasks(
  projectId: string,
  params: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    milestoneId?: string;
    assigneeId?: string;
    search?: string;
  },
  trash = false,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TaskItem>>>(
      `/manage/projects/${projectId}/tasks${trash ? "/trash" : ""}`,
      { params, signal },
    )
  ).data.data;
}

export async function getProjectTask(
  projectId: string,
  taskId: string,
  trash = false,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<TaskItem>>(
      `/manage/projects/${projectId}/tasks${trash ? "/trash" : ""}/${taskId}`,
      { signal },
    )
  ).data.data;
}

export function sanitizeTaskPayload(
  values: Record<string, unknown>,
  isUpdate: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (typeof values.title === "string" && values.title.trim()) {
    body.title = values.title.trim();
  }
  if (typeof values.priority === "string" && values.priority) {
    body.priority = values.priority;
  }
  if (typeof values.sortOrder === "number") body.sortOrder = values.sortOrder;
  if (Object.hasOwn(values, "estimatedMinutes")) {
    const est = values.estimatedMinutes;
    if (est === null || est === "" || est === undefined) {
      if (isUpdate) body.estimatedMinutes = null;
    } else if (typeof est === "number") {
      body.estimatedMinutes = est;
    }
  }
  for (const key of [
    "description",
    "milestoneId",
    "parentTaskId",
    "assigneeId",
    "startDate",
    "dueDate",
  ] as const) {
    if (!Object.hasOwn(values, key)) continue;
    const raw = typeof values[key] === "string" ? values[key].trim() : values[key];
    if (!raw) {
      if (isUpdate) body[key] = null;
    } else if (typeof raw === "string") {
      body[key] = key.endsWith("Id") ? raw.toLowerCase() : raw;
    }
  }
  return body;
}

export async function saveProjectTask(
  projectId: string,
  values: Record<string, unknown>,
  taskId?: string,
) {
  const body = sanitizeTaskPayload(values, Boolean(taskId));
  if (taskId) {
    return (
      await apiClient.patch<ApiResponse<TaskItem>>(
        `/manage/projects/${projectId}/tasks/${taskId}`,
        body,
      )
    ).data.data;
  }
  return (
    await apiClient.post<ApiResponse<TaskItem>>(
      `/manage/projects/${projectId}/tasks`,
      body,
    )
  ).data.data;
}

export async function createProjectTasksBulk(
  projectId: string,
  items: Record<string, unknown>[],
) {
  const body = {
    items: items.map((row) => sanitizeTaskPayload(row, false)),
  };
  return (
    await apiClient.post<ApiResponse<BulkResult>>(
      `/manage/projects/${projectId}/tasks/bulk`,
      body,
    )
  ).data.data;
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus,
) {
  return (
    await apiClient.patch<ApiResponse<TaskItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/status`,
      { status },
    )
  ).data.data;
}

export async function mutateProjectTasks(
  projectId: string,
  input: {
    ids: string[];
    action: "delete" | "restore" | "permanent" | "status";
    status?: TaskStatus;
  },
) {
  const { ids, action, status } = input;
  if (!ids.length) throw new Error("Vui lòng chọn ít nhất một công việc.");
  if (action === "status" && status) {
    return (
      await apiClient.patch<ApiResponse<BulkResult>>(
        `/manage/projects/${projectId}/tasks/bulk/status`,
        { ids, status },
      )
    ).data.data;
  }
  if (action === "permanent") {
    for (const id of ids) {
      await apiClient.delete(`/manage/projects/${projectId}/tasks/${id}/permanent`);
    }
    return { affectedCount: ids.length, skipped: [] };
  }
  if (ids.length === 1) {
    if (action === "restore") {
      await apiClient.patch(`/manage/projects/${projectId}/tasks/${ids[0]}/restore`);
    } else {
      await apiClient.delete(`/manage/projects/${projectId}/tasks/${ids[0]}`);
    }
    return { affectedCount: 1, skipped: [] };
  }
  if (action === "restore") {
    return (
      await apiClient.patch<ApiResponse<BulkResult>>(
        `/manage/projects/${projectId}/tasks/bulk/restore`,
        { ids },
      )
    ).data.data;
  }
  return (
    await apiClient.delete<ApiResponse<BulkResult>>(
      `/manage/projects/${projectId}/tasks/bulk`,
      { data: { ids } },
    )
  ).data.data;
}

// --- Task Sub-resources: Checklists, Comments, Dependencies, Tags, Time Entries ---

export async function listTaskChecklists(
  projectId: string,
  taskId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TaskChecklistItem>>>(
      `/manage/projects/${projectId}/tasks/${taskId}/checklists`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function createTaskChecklist(
  projectId: string,
  taskId: string,
  title: string,
) {
  return (
    await apiClient.post<ApiResponse<TaskChecklistItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/checklists`,
      { title: title.trim() },
    )
  ).data.data;
}

export async function updateTaskChecklist(
  projectId: string,
  taskId: string,
  id: string,
  patch: { title?: string; isDone?: boolean },
) {
  return (
    await apiClient.patch<ApiResponse<TaskChecklistItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/checklists/${id}`,
      patch,
    )
  ).data.data;
}

export async function deleteTaskChecklist(projectId: string, taskId: string, id: string) {
  return (
    await apiClient.delete<ApiResponse<TaskChecklistItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/checklists/${id}`,
    )
  ).data.data;
}

export async function listTaskComments(
  projectId: string,
  taskId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TaskCommentItem>>>(
      `/manage/projects/${projectId}/tasks/${taskId}/comments`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function createTaskComment(
  projectId: string,
  taskId: string,
  content: string,
) {
  return (
    await apiClient.post<ApiResponse<TaskCommentItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/comments`,
      { content: content.trim() },
    )
  ).data.data;
}

export async function updateTaskComment(
  projectId: string,
  taskId: string,
  id: string,
  content: string,
) {
  return (
    await apiClient.patch<ApiResponse<TaskCommentItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/comments/${id}`,
      { content: content.trim() },
    )
  ).data.data;
}

export async function deleteTaskComment(projectId: string, taskId: string, id: string) {
  return (
    await apiClient.delete<ApiResponse<TaskCommentItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/comments/${id}`,
    )
  ).data.data;
}

export async function listTaskDependencies(
  projectId: string,
  taskId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TaskDependencyItem>>>(
      `/manage/projects/${projectId}/tasks/${taskId}/dependencies`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function addTaskDependency(
  projectId: string,
  taskId: string,
  dependsOnTaskId: string,
) {
  return (
    await apiClient.post(
      `/manage/projects/${projectId}/tasks/${taskId}/dependencies`,
      { dependsOnTaskId: dependsOnTaskId.trim().toLowerCase() },
    )
  ).data;
}

export async function removeTaskDependency(
  projectId: string,
  taskId: string,
  dependsOnTaskId: string,
) {
  return (
    await apiClient.delete(
      `/manage/projects/${projectId}/tasks/${taskId}/dependencies/${dependsOnTaskId}`,
    )
  ).data;
}

export async function listTaskTags(
  projectId: string,
  taskId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<ProjectTag>>>(
      `/manage/projects/${projectId}/tasks/${taskId}/tags`,
      { params: { page: 1, limit: 100 }, signal },
    )
  ).data.data;
}

export async function addTaskTags(
  projectId: string,
  taskId: string,
  tagIds: string[],
) {
  return (
    await apiClient.post<ApiResponse<{ items: ProjectTag[] }>>(
      `/manage/projects/${projectId}/tasks/${taskId}/tags`,
      { tagIds: tagIds.map((id) => id.trim().toLowerCase()) },
    )
  ).data.data;
}

export async function replaceTaskTags(
  projectId: string,
  taskId: string,
  tagIds: string[],
) {
  return (
    await apiClient.put<ApiResponse<{ items: ProjectTag[] }>>(
      `/manage/projects/${projectId}/tasks/${taskId}/tags`,
      { tagIds },
    )
  ).data.data;
}

export async function removeTaskTag(
  projectId: string,
  taskId: string,
  tagId: string,
) {
  return (
    await apiClient.delete<ApiResponse<ProjectTag>>(
      `/manage/projects/${projectId}/tasks/${taskId}/tags/${tagId}`,
    )
  ).data.data;
}

// --- Time Entries & Project Activities ---

export async function listProjectTimeEntries(
  projectId: string,
  params: { page?: number; limit?: number; taskId?: string; isBillable?: string },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TimeEntryItem>>>(
      `/manage/projects/${projectId}/time-entries`,
      { params, signal },
    )
  ).data.data;
}

export async function listTaskTimeEntries(
  projectId: string,
  taskId: string,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<TimeEntryItem>>>(
      `/manage/projects/${projectId}/tasks/${taskId}/time-entries`,
      { params: { page: 1, limit: 50 }, signal },
    )
  ).data.data;
}

export async function createTaskTimeEntry(
  projectId: string,
  taskId: string,
  input: { workDate?: string; durationMinutes: number; isBillable?: boolean; notes?: string },
) {
  const body: Record<string, unknown> = {
    durationMinutes: Number(input.durationMinutes),
    isBillable: input.isBillable ?? true,
  };
  if (input.workDate && input.workDate.trim()) body.workDate = input.workDate.trim();
  if (input.notes && input.notes.trim()) body.notes = input.notes.trim();
  return (
    await apiClient.post<ApiResponse<TimeEntryItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/time-entries`,
      body,
    )
  ).data.data;
}

export async function updateTaskTimeEntry(
  projectId: string,
  taskId: string,
  entryId: string,
  input: {
    workDate?: string;
    durationMinutes?: number;
    isBillable?: boolean;
    notes?: string | null;
  },
) {
  const body: Record<string, unknown> = {};
  if (input.durationMinutes !== undefined) {
    body.durationMinutes = Number(input.durationMinutes);
  }
  if (input.isBillable !== undefined) {
    body.isBillable = input.isBillable;
  }
  if (input.workDate && input.workDate.trim()) {
    body.workDate = input.workDate.trim();
  }
  if (Object.hasOwn(input, "notes")) {
    body.notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  }
  return (
    await apiClient.patch<ApiResponse<TimeEntryItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/time-entries/${entryId}`,
      body,
    )
  ).data.data;
}

export async function deleteTaskTimeEntry(
  projectId: string,
  taskId: string,
  entryId: string,
) {
  return (
    await apiClient.delete<ApiResponse<TimeEntryItem>>(
      `/manage/projects/${projectId}/tasks/${taskId}/time-entries/${entryId}`,
    )
  ).data.data;
}

export async function listProjectActivities(
  projectId: string,
  params: { page?: number; limit?: number; entityType?: string },
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<ApiResponse<Page<ProjectActivityItem>>>(
      `/manage/projects/${projectId}/activities`,
      { params, signal },
    )
  ).data.data;
}
