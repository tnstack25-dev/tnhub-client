"use client";
import "../projects.css";
import { useState } from "react";
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  ForkOutlined,
  PlusOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { LoadError, StatusTag } from "@/components/admin/admin-ui";
import { useAdminList } from "@/lib/admin/admin-queries";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { queryKeys } from "@/lib/query-keys";
import {
  addTaskDependency,
  addTaskTags,
  createTaskChecklist,
  createTaskComment,
  createTaskTimeEntry,
  deleteTaskChecklist,
  deleteTaskComment,
  deleteTaskTimeEntry,
  getProjectTask,
  listProjectTasks,
  listTaskChecklists,
  listTaskComments,
  listTaskDependencies,
  listTaskTags,
  listTaskTimeEntries,
  removeTaskDependency,
  removeTaskTag,
  replaceTaskTags,
  updateTaskChecklist,
  updateTaskComment,
  updateTaskStatus,
  updateTaskTimeEntry,
} from "../projects-api";
import {
  PROJECT_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  type ProjectTag,
  type TaskCommentItem,
  type TaskItem,
  type TaskStatus,
  type TimeEntryItem,
} from "../projects-types";

export function TaskDetailDrawer({
  projectId,
  task: initialTask,
  onClose,
  onUpdated,
}: {
  projectId: string;
  task: TaskItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const isTrash = Boolean(initialTask.deletedAt);
  const taskDetailQueryKey = queryKeys.taskDetail(projectId, initialTask.id, isTrash ? "trash" : "root");
  const taskDetailQuery = useQuery({
    queryKey: taskDetailQueryKey,
    queryFn: ({ signal }) => getProjectTask(projectId, initialTask.id, isTrash, signal),
    initialData: initialTask,
  });
  const task = taskDetailQuery.data ?? initialTask;

  const canUpdateTask = !task.deletedAt && allowed(profile.data, "tasks.update");
  const canComment = !task.deletedAt && allowed(profile.data, "tasks.comment");
  const canModerateComments =
    !task.deletedAt && allowed(profile.data, "tasks.moderate_comments");
  const canReadTime = allowed(profile.data, "time_entries.read");
  const canCreateTime = !task.deletedAt && allowed(profile.data, "time_entries.create");
  const canUpdateTime = !task.deletedAt && allowed(profile.data, "time_entries.update");
  const canDeleteTime = !task.deletedAt && allowed(profile.data, "time_entries.delete");

  const statusMutation = useMutation({
    mutationFn: (status: TaskStatus) => updateTaskStatus(projectId, task.id, status),
    onSuccess: async () => {
      void message.success("Đã cập nhật trạng thái công việc.");
      await client.invalidateQueries({ queryKey: taskDetailQueryKey });
      onUpdated();
    },
  });

  const priorityMeta = PROJECT_PRIORITY_OPTIONS.find((p) => p.value === task.priority);

  return (
    <Drawer
      open
      size={760}
      title="Chi tiết công việc (Task)"
      onClose={onClose}
      destroyOnHidden
    >
      <Flex vertical gap={20}>
        <div>
          <Space wrap size={8} style={{ marginBottom: 8 }}>
            <StatusTag status={task.status} />
            <Tag color={priorityMeta?.color}>{priorityMeta?.label ?? task.priority}</Tag>
            {task.estimatedMinutes !== null && (
              <Tag icon={<ClockCircleOutlined />}>Dự kiến: {task.estimatedMinutes} phút</Tag>
            )}
          </Space>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {task.title}
          </Typography.Title>
          {task.description && (
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {task.description}
            </Typography.Paragraph>
          )}
        </div>

        {canUpdateTask && (
          <Flex align="center" gap={12} wrap>
            <Typography.Text strong>Chuyển nhanh trạng thái:</Typography.Text>
            <Select
              value={task.status}
              loading={statusMutation.isPending}
              style={{ width: 180 }}
              options={TASK_STATUS_OPTIONS}
              onChange={(val) => statusMutation.mutate(val)}
            />
          </Flex>
        )}

        <Descriptions
          size="small"
          bordered
          column={2}
          items={[
            {
              key: "start",
              label: "Ngày bắt đầu",
              children: task.startDate?.slice(0, 10) || "—",
            },
            {
              key: "due",
              label: "Hạn hoàn thành",
              children: task.dueDate?.slice(0, 10) || "—",
            },
            {
              key: "assignee",
              label: "Người thực hiện",
              children: task.assigneeId || "Chưa giao",
            },
            {
              key: "completed",
              label: "Hoàn thành lúc",
              children: task.completedAt
                ? new Date(task.completedAt).toLocaleString("vi-VN")
                : "—",
            },
          ]}
        />

        <Tabs
          items={[
            {
              key: "checklists",
              label: (
                <Space size={6}>
                  <CheckSquareOutlined />
                  <span>Checklist</span>
                </Space>
              ),
              children: (
                <TaskChecklistsTab
                  projectId={projectId}
                  taskId={task.id}
                  canUpdate={canUpdateTask}
                />
              ),
            },
            {
              key: "comments",
              label: (
                <Space size={6}>
                  <CommentOutlined />
                  <span>Bình luận</span>
                </Space>
              ),
              children: (
                <TaskCommentsTab
                  projectId={projectId}
                  taskId={task.id}
                  currentUserId={profile.data?.id}
                  canComment={canComment}
                  canModerate={canModerateComments}
                />
              ),
            },
            {
              key: "dependencies",
              label: (
                <Space size={6}>
                  <ForkOutlined />
                  <span>Phụ thuộc</span>
                </Space>
              ),
              children: (
                <TaskDependenciesTab
                  projectId={projectId}
                  taskId={task.id}
                  canUpdate={canUpdateTask}
                />
              ),
            },
            {
              key: "tags",
              label: (
                <Space size={6}>
                  <TagsOutlined />
                  <span>Nhãn (Tags)</span>
                </Space>
              ),
              children: (
                <TaskTagsTab
                  projectId={projectId}
                  taskId={task.id}
                  canUpdate={canUpdateTask}
                />
              ),
            },
            ...(canReadTime
              ? [
                  {
                    key: "time",
                    label: (
                      <Space size={6}>
                        <ClockCircleOutlined />
                        <span>Chấm công</span>
                      </Space>
                    ),
                    children: (
                      <TaskTimeEntriesTab
                        projectId={projectId}
                        taskId={task.id}
                        currentUserId={profile.data?.id}
                        canCreate={canCreateTime}
                        canUpdate={canUpdateTime}
                        canDelete={canDeleteTime}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Flex>
    </Drawer>
  );
}

function TaskChecklistsTab({
  projectId,
  taskId,
  canUpdate,
}: {
  projectId: string;
  taskId: string;
  canUpdate: boolean;
}) {
  const client = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const queryKey = queryKeys.taskDetail(projectId, taskId, "checklists");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listTaskChecklists(projectId, taskId, signal),
  });
  const refresh = () => client.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: () => createTaskChecklist(projectId, taskId, newTitle),
    onSuccess: async () => {
      setNewTitle("");
      await refresh();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; isDone: boolean }) =>
      updateTaskChecklist(projectId, taskId, input.id, { isDone: input.isDone }),
    onSuccess: refresh,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteTaskChecklist(projectId, taskId, id),
    onSuccess: refresh,
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={12}>
      {canUpdate && (
        <Flex gap={8}>
          <Input
            value={newTitle}
            maxLength={300}
            placeholder="Nhập đầu việc nhỏ cần kiểm tra…"
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={() => {
              if (newTitle.trim()) addMutation.mutate();
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={addMutation.isPending}
            disabled={!newTitle.trim()}
            onClick={() => addMutation.mutate()}
          >
            Thêm
          </Button>
        </Flex>
      )}
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có mục checklist nào." />
      ) : (
        items.map((item) => (
          <div key={item.id} className="project-checklist-row">
            <Checkbox
              checked={item.isDone}
              disabled={!canUpdate || toggleMutation.isPending}
              onChange={(e) =>
                toggleMutation.mutate({ id: item.id, isDone: e.target.checked })
              }
            >
              <Typography.Text delete={item.isDone}>{item.title}</Typography.Text>
            </Checkbox>
            {canUpdate && (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                aria-label={`Xóa ${item.title}`}
                onClick={() => removeMutation.mutate(item.id)}
              />
            )}
          </div>
        ))
      )}
    </Flex>
  );
}

function TaskCommentsTab({
  projectId,
  taskId,
  currentUserId,
  canComment,
  canModerate,
}: {
  projectId: string;
  taskId: string;
  currentUserId?: string;
  canComment: boolean;
  canModerate: boolean;
}) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [content, setContent] = useState("");
  const [editingComment, setEditingComment] = useState<TaskCommentItem | null>(null);
  const [editingText, setEditingText] = useState("");
  const queryKey = queryKeys.taskDetail(projectId, taskId, "comments");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listTaskComments(projectId, taskId, signal),
  });
  const refresh = () => client.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: () => createTaskComment(projectId, taskId, content),
    onSuccess: async () => {
      setContent("");
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; content: string }) =>
      updateTaskComment(projectId, taskId, input.id, input.content),
    onSuccess: async () => {
      setEditingComment(null);
      setEditingText("");
      void message.success("Đã cập nhật bình luận.");
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTaskComment(projectId, taskId, id),
    onSuccess: refresh,
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={12}>
      {canComment && (
        <Flex vertical gap={8}>
          <Input.TextArea
            rows={2}
            maxLength={4000}
            value={content}
            placeholder="Viết thảo luận hoặc cập nhật tiến độ…"
            onChange={(e) => setContent(e.target.value)}
          />
          <Flex justify="end">
            <Button
              type="primary"
              size="small"
              loading={createMutation.isPending}
              disabled={!content.trim()}
              onClick={() => createMutation.mutate()}
            >
              Gửi bình luận
            </Button>
          </Flex>
        </Flex>
      )}
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bình luận nào." />
      ) : (
        items.map((comment) => {
          const isAuthor = Boolean(currentUserId && comment.authorId === currentUserId);
          const canEdit = canComment && isAuthor;
          const canDelete = canModerate || (canComment && isAuthor);
          const isEditing = editingComment?.id === comment.id;
          return (
            <div key={comment.id} className="project-comment-box">
              <Flex justify="space-between" align="center">
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Người gửi: {comment.authorId || "Hệ thống"} ·{" "}
                  {new Date(comment.createdAt).toLocaleString("vi-VN")}
                </Typography.Text>
                <Space size={4}>
                  {canEdit && !isEditing && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label="Sửa bình luận"
                      onClick={() => {
                        setEditingComment(comment);
                        setEditingText(comment.content);
                      }}
                    />
                  )}
                  {canDelete && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Xóa bình luận"
                      onClick={() => deleteMutation.mutate(comment.id)}
                    />
                  )}
                </Space>
              </Flex>
              {isEditing ? (
                <Flex vertical gap={8} style={{ marginTop: 8 }}>
                  <Input.TextArea
                    rows={2}
                    maxLength={4000}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <Flex justify="end" gap={8}>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingComment(null);
                        setEditingText("");
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={updateMutation.isPending}
                      disabled={!editingText.trim()}
                      onClick={() =>
                        updateMutation.mutate({
                          id: comment.id,
                          content: editingText,
                        })
                      }
                    >
                      Lưu bình luận
                    </Button>
                  </Flex>
                </Flex>
              ) : (
                <Typography.Paragraph style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </Typography.Paragraph>
              )}
            </div>
          );
        })
      )}
    </Flex>
  );
}

function TaskDependenciesTab({
  projectId,
  taskId,
  canUpdate,
}: {
  projectId: string;
  taskId: string;
  canUpdate: boolean;
}) {
  const client = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const queryKey = queryKeys.taskDetail(projectId, taskId, "dependencies");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listTaskDependencies(projectId, taskId, signal),
  });
  const allTasks = useQuery({
    queryKey: queryKeys.projectSection(projectId, "tasks-options"),
    enabled: canUpdate,
    queryFn: ({ signal }) => listProjectTasks(projectId, { page: 1, limit: 100 }, false, signal),
  });
  const refresh = () => client.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (dependsOnId: string) => addTaskDependency(projectId, taskId, dependsOnId),
    onSuccess: async () => {
      setSelectedTaskId(undefined);
      await refresh();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (dependsOnId: string) =>
      removeTaskDependency(projectId, taskId, dependsOnId),
    onSuccess: refresh,
  });

  const items = query.data?.items ?? [];
  const existingIds = new Set([taskId, ...items.map((d) => d.dependsOnTaskId)]);

  return (
    <Flex vertical gap={12}>
      {addMutation.isError && (
        <Alert type="error" showIcon title={addMutation.error.message} />
      )}
      {canUpdate && (
        <Flex gap={8}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn công việc tiền nhiệm (cần hoàn thành trước)…"
            value={selectedTaskId}
            onChange={setSelectedTaskId}
            style={{ flex: 1 }}
            options={(allTasks.data?.items ?? [])
              .filter((t) => !existingIds.has(t.id))
              .map((t) => ({ value: t.id, label: `${t.title} (${t.status})` }))}
          />
          <Button
            type="primary"
            disabled={!selectedTaskId}
            loading={addMutation.isPending}
            onClick={() => selectedTaskId && addMutation.mutate(selectedTaskId)}
          >
            Thêm tiền nhiệm
          </Button>
        </Flex>
      )}
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Công việc này không phụ thuộc vào công việc nào khác."
        />
      ) : (
        items.map((dep) => (
          <Card key={dep.dependsOnTaskId} size="small">
            <Flex justify="space-between" align="center">
              <Space>
                <Typography.Text strong>{dep.dependsOn.title}</Typography.Text>
                <StatusTag status={dep.dependsOn.status} />
              </Space>
              {canUpdate && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeMutation.mutate(dep.dependsOnTaskId)}
                >
                  Gỡ
                </Button>
              )}
            </Flex>
          </Card>
        ))
      )}
    </Flex>
  );
}

function TaskTagsTab({
  projectId,
  taskId,
  canUpdate,
}: {
  projectId: string;
  taskId: string;
  canUpdate: boolean;
}) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const [quickAddTagId, setQuickAddTagId] = useState<string>();
  const queryKey = queryKeys.taskDetail(projectId, taskId, "tags");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listTaskTags(projectId, taskId, signal),
  });
  const catalog = useAdminList<ProjectTag>(
    "tags",
    { page: 1, limit: 100 },
    canUpdate && allowed(profile.data, "tags.read"),
    false,
  );
  const refresh = () => client.invalidateQueries({ queryKey });

  const replaceMutation = useMutation({
    mutationFn: (tagIds: string[]) => replaceTaskTags(projectId, taskId, tagIds),
    onSuccess: async () => {
      void message.success("Đã đồng bộ nhãn công việc.");
      await refresh();
    },
  });

  const addMutation = useMutation({
    mutationFn: (tagId: string) => addTaskTags(projectId, taskId, [tagId]),
    onSuccess: async () => {
      setQuickAddTagId(undefined);
      void message.success("Đã gắn thêm nhãn cho công việc.");
      await refresh();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (tagId: string) => removeTaskTag(projectId, taskId, tagId),
    onSuccess: async () => {
      void message.success("Đã gỡ nhãn khỏi công việc.");
      await refresh();
    },
  });

  const currentTags = query.data?.items ?? [];
  const currentIds = new Set(currentTags.map((t) => t.id));
  const availableToAdd = (catalog.data?.items ?? []).filter((t) => !currentIds.has(t.id));

  return (
    <Flex vertical gap={12}>
      <Space wrap>
        {currentTags.length ? (
          currentTags.map((t) => (
            <Tag
              key={t.id}
              color={t.color || "blue"}
              closable={canUpdate && !removeMutation.isPending}
              onClose={(e) => {
                e.preventDefault();
                removeMutation.mutate(t.id);
              }}
            >
              {t.name}
            </Tag>
          ))
        ) : (
          <Typography.Text type="secondary">Chưa gắn nhãn nào.</Typography.Text>
        )}
      </Space>
      {canUpdate && catalog.data && (
        <Flex vertical gap={8}>
          <Flex gap={8} align="center">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ flex: 1 }}
              placeholder="Gắn thêm nhanh 1 nhãn…"
              value={quickAddTagId}
              onChange={setQuickAddTagId}
              options={availableToAdd.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!quickAddTagId}
              loading={addMutation.isPending}
              onClick={() => quickAddTagId && addMutation.mutate(quickAddTagId)}
            >
              Gắn nhãn
            </Button>
          </Flex>
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Hoặc chọn/thay thế toàn bộ bộ nhãn cho công việc…"
            value={currentTags.map((t) => t.id)}
            loading={replaceMutation.isPending}
            options={catalog.data.items.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            onChange={(nextIds) => replaceMutation.mutate(nextIds)}
          />
        </Flex>
      )}
    </Flex>
  );
}

function TaskTimeEntriesTab({
  projectId,
  taskId,
  currentUserId,
  canCreate,
  canUpdate,
  canDelete,
}: {
  projectId: string;
  taskId: string;
  currentUserId?: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [editingEntry, setEditingEntry] = useState<TimeEntryItem | null>(null);
  const queryKey = queryKeys.taskDetail(projectId, taskId, "time-entries");
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => listTaskTimeEntries(projectId, taskId, signal),
  });
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey }),
      client.invalidateQueries({ queryKey: queryKeys.projectSection(projectId, "time-entries") }),
    ]);

  const createMutation = useMutation({
    mutationFn: (values: {
      workDate?: string;
      durationMinutes: number;
      isBillable?: boolean;
      notes?: string;
    }) => createTaskTimeEntry(projectId, taskId, values),
    onSuccess: async () => {
      void message.success("Đã ghi nhận chấm công.");
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      entryId: string;
      values: {
        workDate?: string;
        durationMinutes?: number;
        isBillable?: boolean;
        notes?: string | null;
      };
    }) => updateTaskTimeEntry(projectId, taskId, input.entryId, input.values),
    onSuccess: async () => {
      setEditingEntry(null);
      void message.success("Đã cập nhật bản ghi chấm công.");
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTaskTimeEntry(projectId, taskId, id),
    onSuccess: async () => {
      void message.success("Đã xóa bản ghi chấm công.");
      await refresh();
    },
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={14}>
      {(canCreate || editingEntry) && (
        <Card
          size="small"
          title={editingEntry ? "Chỉnh sửa bản ghi chấm công" : "Ghi chấm công mới"}
        >
          <Form
            key={editingEntry?.id ?? "new"}
            layout="vertical"
            initialValues={
              editingEntry
                ? {
                    durationMinutes: editingEntry.durationMinutes,
                    workDate: editingEntry.workDate.slice(0, 10),
                    isBillable: editingEntry.isBillable,
                    notes: editingEntry.notes ?? "",
                  }
                : { durationMinutes: 60, isBillable: true }
            }
            disabled={createMutation.isPending || updateMutation.isPending}
            onFinish={(values) => {
              if (editingEntry) {
                updateMutation.mutate({ entryId: editingEntry.id, values });
              } else {
                createMutation.mutate(values);
              }
            }}
          >
            <Row gutter={12}>
              <Col xs={12} sm={8}>
                <Form.Item
                  name="durationMinutes"
                  label="Số phút làm việc"
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={1440} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={8}>
                <Form.Item name="workDate" label="Ngày làm việc">
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="isBillable"
                  label="Tính phí (Billable)"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label="Ghi chú công việc đã làm">
              <Input maxLength={400} placeholder="Mô tả ngắn kết quả thực hiện…" />
            </Form.Item>
            <Space>
              {editingEntry && (
                <Button size="small" onClick={() => setEditingEntry(null)}>
                  Hủy sửa
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                size="small"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingEntry ? "Lưu cập nhật" : "Ghi chấm công"}
              </Button>
            </Space>
          </Form>
        </Card>
      )}
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bản ghi chấm công." />
      ) : (
        items.map((entry) => {
          const canEditEntry =
            canUpdate && (!currentUserId || entry.userId === currentUserId);
          return (
            <Card key={entry.id} size="small">
              <Flex justify="space-between" align="center">
                <div>
                  <Space wrap size={6}>
                    <Tag color="blue">{entry.durationMinutes} phút</Tag>
                    <Tag color={entry.isBillable ? "green" : "default"}>
                      {entry.isBillable ? "Billable" : "Non-billable"}
                    </Tag>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Ngày: {entry.workDate.slice(0, 10)}
                    </Typography.Text>
                  </Space>
                  {entry.notes && (
                    <div style={{ marginTop: 4, fontSize: 13 }}>{entry.notes}</div>
                  )}
                </div>
                <Space size={4}>
                  {canEditEntry && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label="Sửa bản ghi chấm công"
                      onClick={() => setEditingEntry(entry)}
                    />
                  )}
                  {canDelete && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      aria-label="Xóa bản ghi chấm công"
                      onClick={() => deleteMutation.mutate(entry.id)}
                    />
                  )}
                </Space>
              </Flex>
            </Card>
          );
        })
      )}
    </Flex>
  );
}
