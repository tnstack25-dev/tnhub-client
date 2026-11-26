"use client";
import "../projects.css";
import { useState, type Key } from "react";
import Link from "next/link";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FlagOutlined,
  HistoryOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { LoadError, StatusTag } from "@/components/admin/admin-ui";
import { DebouncedSearch } from "@/components/debounced-search";
import { useAdminDetail, useAdminList } from "@/lib/admin/admin-queries";
import { formatPrice } from "@/lib/admin/format";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { queryKeys } from "@/lib/query-keys";
import type { Member } from "@/features/users/users-types";
import type { Service } from "@/features/services/services-types";
import {
  addProjectMember,
  addProjectService,
  addProjectTags,
  createProjectTasksBulk,
  deleteProjectMilestone,
  getProjectMilestone,
  listProjectActivities,
  listProjectMembers,
  listProjectMilestones,
  listProjectServices,
  listProjectTags,
  listProjectTasks,
  listProjectTimeEntries,
  mutateProjectTasks,
  removeProjectMember,
  removeProjectService,
  removeProjectTag,
  replaceProjectTags,
  saveProjectMilestone,
  saveProjectTask,
  updateMilestoneStatus,
  updateProjectStatus,
} from "../projects-api";
import {
  MILESTONE_STATUS_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  TASK_STATUS_OPTIONS,
  type Milestone,
  type MilestoneStatus,
  type Project,
  type ProjectStatus,
  type ProjectTag,
  type TaskItem,
  type TaskStatus,
} from "../projects-types";
import { ProjectEditor } from "./project-editor";
import { TaskDetailDrawer } from "./task-detail-drawer";

export function ProjectWorkspaceView({ projectId }: { projectId: string }) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const [editingProject, setEditingProject] = useState(false);

  const projectQuery = useAdminDetail<Project>(
    "projects",
    projectId,
    allowed(profile.data, "projects.read"),
    false,
  );
  const project = projectQuery.data;
  const canUpdateProject = allowed(profile.data, "projects.update");

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => updateProjectStatus(projectId, status),
    onSuccess: async () => {
      void message.success("Đã cập nhật trạng thái dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.adminDetail("projects", projectId, false),
      });
    },
  });

  if (projectQuery.isPending) return <Skeleton active />;
  if (projectQuery.isError) {
    return <LoadError error={projectQuery.error} retry={() => void projectQuery.refetch()} />;
  }
  if (!project) return null;

  const priorityMeta = PROJECT_PRIORITY_OPTIONS.find((p) => p.value === project.priority);
  const typeMeta = PROJECT_TYPE_OPTIONS.find((t) => t.value === project.projectType);

  return (
    <Flex vertical gap={24}>
      <div>
        <Link
          href="/projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          <ArrowLeftOutlined /> Danh sách dự án
        </Link>
        <div className="project-workspace-header">
          <div>
            <Space wrap size={8} style={{ marginBottom: 8 }}>
              <Tag color="blue" className="admin-code" style={{ margin: 0 }}>
                {project.code}
              </Tag>
              <StatusTag status={project.status} />
              <Tag color={priorityMeta?.color}>
                Ưu tiên: {priorityMeta?.label ?? project.priority}
              </Tag>
              <Tag>{typeMeta?.label ?? project.projectType}</Tag>
            </Space>
            <Typography.Title level={2} style={{ margin: "4px 0 6px" }}>
              {project.name}
            </Typography.Title>
            {project.description && (
              <Typography.Paragraph
                type="secondary"
                style={{ marginBottom: 0, maxWidth: 820 }}
              >
                {project.description}
              </Typography.Paragraph>
            )}
          </div>
          <Space wrap>
            {canUpdateProject && (
              <>
                <Select
                  aria-label="Đổi trạng thái dự án"
                  value={project.status}
                  loading={statusMutation.isPending}
                  style={{ width: 170 }}
                  options={PROJECT_STATUS_OPTIONS}
                  onChange={(status) => statusMutation.mutate(status)}
                />
                <Button icon={<EditOutlined />} onClick={() => setEditingProject(true)}>
                  Sửa thông tin
                </Button>
              </>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void projectQuery.refetch()}
              loading={projectQuery.isFetching}
            />
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title={`Ngân sách (${project.currency})`}
              value={`${formatPrice(project.budget)} ${project.currency}`}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Ngày bắt đầu"
              value={project.startDate?.slice(0, 10) || "Chưa đặt"}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Hạn chót (Deadline)"
              value={project.deadline?.slice(0, 10) || "Chưa đặt"}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="admin-table-card">
        <Tabs
          defaultActiveKey="tasks"
          items={[
            {
              key: "tasks",
              label: (
                <Space size={6}>
                  <CheckSquareOutlined />
                  <span>Công việc (Tasks)</span>
                </Space>
              ),
              children: <ProjectTasksTab projectId={projectId} />,
            },
            {
              key: "milestones",
              label: (
                <Space size={6}>
                  <FlagOutlined />
                  <span>Cột mốc (Milestones)</span>
                </Space>
              ),
              children: <ProjectMilestonesTab projectId={projectId} />,
            },
            {
              key: "resources",
              label: (
                <Space size={6}>
                  <TeamOutlined />
                  <span>Thành viên, Dịch vụ & Nhãn</span>
                </Space>
              ),
              children: (
                <ProjectResourcesTab
                  project={project}
                  canUpdate={canUpdateProject}
                />
              ),
            },
            ...(allowed(profile.data, "time_entries.read")
              ? [
                  {
                    key: "time-entries",
                    label: (
                      <Space size={6}>
                        <ClockCircleOutlined />
                        <span>Bảng chấm công</span>
                      </Space>
                    ),
                    children: <ProjectTimeEntriesTab projectId={projectId} />,
                  },
                ]
              : []),
            ...(allowed(profile.data, "project_activities.read")
              ? [
                  {
                    key: "activities",
                    label: (
                      <Space size={6}>
                        <HistoryOutlined />
                        <span>Lịch sử hoạt động</span>
                      </Space>
                    ),
                    children: <ProjectActivitiesTab projectId={projectId} />,
                  },
                ]
              : []),
          ]}
        />
      </Card>

      {editingProject && (
        <ProjectEditor id={project.id} onClose={() => setEditingProject(false)} />
      )}
    </Flex>
  );
}

// ============================================================================
// 1. TAB CÔNG VIỆC (TASKS)
// ============================================================================

function ProjectTasksTab({ projectId }: { projectId: string }) {
  const { message, modal } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [trash, setTrash] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [priority, setPriority] = useState<string>();
  const [milestoneId, setMilestoneId] = useState<string>();
  const [selected, setSelected] = useState<Key[]>([]);
  const [editingTask, setEditingTask] = useState<TaskItem | "new" | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);

  const canRead = allowed(profile.data, "tasks.read");
  const canCreate = allowed(profile.data, "tasks.create");
  const canUpdate = allowed(profile.data, "tasks.update");
  const canDelete = allowed(profile.data, "tasks.delete");
  const canRestore = allowed(profile.data, "tasks.restore");
  const canHardDelete = allowed(profile.data, "tasks.hard_delete");

  const milestonesQuery = useQuery({
    queryKey: queryKeys.projectSection(projectId, "milestones"),
    enabled: allowed(profile.data, "milestones.read"),
    queryFn: ({ signal }) => listProjectMilestones(projectId, signal),
  });

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    status,
    priority,
    milestoneId,
  };
  const queryKey = queryKeys.projectSection(projectId, "tasks", { ...params, trash });
  const query = useQuery({
    queryKey,
    enabled: canRead,
    queryFn: ({ signal }) => listProjectTasks(projectId, params, trash, signal),
  });

  const refreshTasks = () =>
    client.invalidateQueries({ queryKey: queryKeys.projectWork(projectId) });

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof mutateProjectTasks>[1]) =>
      mutateProjectTasks(projectId, input),
    onSuccess: async (res) => {
      setSelected([]);
      void message.success(
        res?.affectedCount !== undefined
          ? `Đã xử lý ${res.affectedCount} công việc.`
          : "Thao tác hoàn tất.",
      );
      await refreshTasks();
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: (input: { taskId: string; status: TaskStatus }) =>
      mutateProjectTasks(projectId, {
        ids: [input.taskId],
        action: "status",
        status: input.status,
      }),
    onSuccess: async () => {
      void message.success("Đã cập nhật trạng thái.");
      await refreshTasks();
    },
  });

  function confirmTaskAction(
    ids: string[],
    action: "delete" | "restore" | "permanent" | "status",
    nextStatus?: TaskStatus,
  ) {
    const title =
      action === "delete"
        ? `Chuyển ${ids.length} công việc vào thùng rác?`
        : action === "restore"
          ? `Khôi phục ${ids.length} công việc?`
          : action === "permanent"
            ? `Xóa vĩnh viễn ${ids.length} công việc?`
            : `Đổi trạng thái ${ids.length} công việc?`;
    modal.confirm({
      title,
      okText: "Xác nhận",
      cancelText: "Hủy",
      okButtonProps: { danger: action === "delete" || action === "permanent" },
      onOk: () => mutation.mutateAsync({ ids, action, status: nextStatus }),
    });
  }

  if (!canRead) {
    return <Alert type="info" showIcon title="Bạn chưa có quyền xem danh sách công việc." />;
  }

  const columns: TableColumnsType<TaskItem> = [
    {
      title: "Công việc",
      key: "title",
      width: 280,
      render: (_, item) => (
        <div className="admin-identity">
          <Button
            type="link"
            className="admin-name"
            onClick={() => setDetailTask(item)}
          >
            {item.title}
          </Button>
          {item.description && (
            <Typography.Paragraph
              type="secondary"
              ellipsis={{ rows: 1 }}
              style={{ margin: 0, fontSize: 12 }}
            >
              {item.description}
            </Typography.Paragraph>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 170,
      render: (_, item) =>
        !trash && canUpdate ? (
          <Select
            size="small"
            value={item.status}
            style={{ width: 145 }}
            options={TASK_STATUS_OPTIONS}
            onChange={(val) =>
              quickStatusMutation.mutate({ taskId: item.id, status: val })
            }
          />
        ) : (
          <StatusTag status={item.status} />
        ),
    },
    {
      title: "Ưu tiên",
      key: "priority",
      width: 120,
      render: (_, item) => {
        const meta = PROJECT_PRIORITY_OPTIONS.find((p) => p.value === item.priority);
        return <Tag color={meta?.color}>{meta?.label ?? item.priority}</Tag>;
      },
    },
    {
      title: "Hạn & Ước lượng",
      key: "schedule",
      width: 180,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text style={{ fontSize: 12 }}>
            Hạn: <strong>{item.dueDate?.slice(0, 10) || "—"}</strong>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Ước lượng: {item.estimatedMinutes ? `${item.estimatedMinutes} phút` : "—"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 130,
      fixed: "right",
      render: (_, item) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => setDetailTask(item)}>
            Chi tiết
          </Button>
          {!trash && canUpdate && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label={`Sửa ${item.title}`}
              onClick={() => setEditingTask(item)}
            />
          )}
          {!trash && canDelete && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              aria-label={`Xóa ${item.title}`}
              onClick={() => confirmTaskAction([item.id], "delete")}
            />
          )}
          {trash && canRestore && (
            <Button
              type="link"
              size="small"
              onClick={() => confirmTaskAction([item.id], "restore")}
            >
              Khôi phục
            </Button>
          )}
          {trash && canHardDelete && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => confirmTaskAction([item.id], "permanent")}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex wrap justify="space-between" align="center" gap={12}>
        <Space wrap>
          <Segmented
            value={trash ? "trash" : "active"}
            options={[
              { value: "active", label: "Đang thực hiện" },
              { value: "trash", label: "Thùng rác" },
            ]}
            onChange={(val) => {
              setTrash(val === "trash");
              setPage(1);
              setSelected([]);
            }}
          />
          <Tag>{query.data?.meta.total ?? 0} công việc</Tag>
        </Space>
        <Space wrap>
          {!trash && canCreate && (
            <>
              <Button icon={<PlusOutlined />} onClick={() => setCreatingBatch(true)}>
                Tạo nhiều công việc
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setEditingTask("new")}
              >
                Tạo công việc
              </Button>
            </>
          )}
        </Space>
      </Flex>

      <Flex wrap gap={12}>
        <DebouncedSearch
          value={search}
          placeholder="Tìm tiêu đề công việc…"
          allowClear
          maxLength={150}
          style={{ maxWidth: 280 }}
          onSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          value={status}
          style={{ width: 155 }}
          options={TASK_STATUS_OPTIONS}
          onChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Độ ưu tiên"
          value={priority}
          style={{ width: 150 }}
          options={PROJECT_PRIORITY_OPTIONS}
          onChange={(val) => {
            setPriority(val);
            setPage(1);
          }}
        />
        {(milestonesQuery.data?.items.length ?? 0) > 0 && (
          <Select
            allowClear
            placeholder="Lọc theo cột mốc"
            value={milestoneId}
            style={{ minWidth: 180 }}
            options={milestonesQuery.data?.items.map((m) => ({
              value: m.id,
              label: m.title,
            }))}
            onChange={(val) => {
              setMilestoneId(val);
              setPage(1);
            }}
          />
        )}
      </Flex>

      {selected.length > 0 && (
        <Flex
          wrap
          justify="space-between"
          align="center"
          gap={12}
          className="admin-selection"
        >
          <Typography.Text strong>Đã chọn {selected.length} công việc</Typography.Text>
          <Space wrap>
            <Button type="text" onClick={() => setSelected([])}>
              Bỏ chọn
            </Button>
            {!trash && canUpdate && (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: TASK_STATUS_OPTIONS.map((opt) => ({
                    key: opt.value,
                    label: `Chuyển sang: ${opt.label}`,
                    onClick: () =>
                      confirmTaskAction(selected.map(String), "status", opt.value),
                  })),
                }}
              >
                <Button>Đổi trạng thái hàng loạt</Button>
              </Dropdown>
            )}
            {trash && canRestore && (
              <Button
                onClick={() => confirmTaskAction(selected.map(String), "restore")}
              >
                Khôi phục đã chọn
              </Button>
            )}
            {((!trash && canDelete) || (trash && canHardDelete)) && (
              <Button
                danger
                onClick={() =>
                  confirmTaskAction(
                    selected.map(String),
                    trash ? "permanent" : "delete",
                  )
                }
              >
                {trash ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác"}
              </Button>
            )}
          </Space>
        </Flex>
      )}

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Table<TaskItem>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.items ?? []}
          loading={query.isFetching}
          scroll={{ x: 840 }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: setSelected,
          }}
          pagination={{
            current: page,
            pageSize: 20,
            total: query.data?.meta.total ?? 0,
            onChange: setPage,
          }}
        />
      )}

      {editingTask !== null && (
        <TaskFormModal
          projectId={projectId}
          initial={editingTask === "new" ? undefined : editingTask}
          milestones={milestonesQuery.data?.items ?? []}
          onClose={() => setEditingTask(null)}
          onSaved={async () => {
            setEditingTask(null);
            await refreshTasks();
          }}
        />
      )}

      {creatingBatch && (
        <TaskBatchModal
          projectId={projectId}
          milestones={milestonesQuery.data?.items ?? []}
          onClose={() => setCreatingBatch(false)}
          onSaved={async () => {
            setCreatingBatch(false);
            await refreshTasks();
          }}
        />
      )}

      {detailTask && (
        <TaskDetailDrawer
          projectId={projectId}
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdated={() => void refreshTasks()}
        />
      )}
    </Flex>
  );
}

function TaskBatchModal({
  projectId,
  milestones,
  onClose,
  onSaved,
}: {
  projectId: string;
  milestones: Milestone[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const mutation = useMutation({
    mutationFn: (values: { items: Record<string, unknown>[] }) =>
      createProjectTasksBulk(projectId, values.items),
    onSuccess: async (res) => {
      void message.success(`Đã tạo nhanh ${res.affectedCount} công việc.`);
      await onSaved();
    },
  });

  return (
    <Modal
      open
      title="Tạo nhiều công việc cùng lúc (Bulk Create)"
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={720}
    >
      <Form
        layout="vertical"
        initialValues={{
          items: [{ priority: "MEDIUM" }, { priority: "MEDIUM" }],
        }}
        disabled={mutation.isPending}
        onFinish={(values) => mutation.mutate(values)}
      >
        {mutation.isError && (
          <Alert
            type="error"
            showIcon
            title={mutation.error.message}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <Flex vertical gap={12}>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={`Công việc #${index + 1}`}
                  extra={
                    fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Bỏ dòng
                      </Button>
                    ) : null
                  }
                >
                  <Form.Item
                    name={[field.name, "title"]}
                    label="Tiêu đề công việc"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Nhập tiêu đề công việc.",
                      },
                    ]}
                  >
                    <Input maxLength={300} placeholder="Ví dụ: Lập trình API, Kiểm thử UAT…" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col xs={24} sm={8}>
                      <Form.Item name={[field.name, "priority"]} label="Độ ưu tiên">
                        <Select options={PROJECT_PRIORITY_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name={[field.name, "milestoneId"]} label="Thuộc cột mốc">
                        <Select
                          allowClear
                          placeholder="Chọn cột mốc…"
                          options={milestones.map((m) => ({
                            value: m.id,
                            label: m.title,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item name={[field.name, "dueDate"]} label="Hạn hoàn thành">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              {fields.length < 30 && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ priority: "MEDIUM" })}
                >
                  Thêm dòng công việc
                </Button>
              )}
            </Flex>
          )}
        </Form.List>
        <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Tạo tất cả công việc
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
}

function TaskFormModal({
  projectId,
  initial,
  milestones,
  onClose,
  onSaved,
}: {
  projectId: string;
  initial?: TaskItem;
  milestones: Milestone[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const users = useAdminList<Member>(
    "users",
    { page: 1, limit: 100, status: "ACTIVE" },
    allowed(profile.data, "users.read"),
    false,
  );
  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      saveProjectTask(projectId, values, initial?.id),
    onSuccess: async () => {
      void message.success(initial ? "Đã cập nhật công việc." : "Đã tạo công việc mới.");
      await onSaved();
    },
  });

  return (
    <Modal
      open
      title={initial ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={620}
    >
      <Form
        layout="vertical"
        initialValues={
          initial
            ? {
                title: initial.title,
                description: initial.description ?? "",
                priority: initial.priority,
                milestoneId: initial.milestoneId ?? undefined,
                assigneeId: initial.assigneeId ?? undefined,
                estimatedMinutes: initial.estimatedMinutes,
                startDate: initial.startDate?.slice(0, 10) ?? "",
                dueDate: initial.dueDate?.slice(0, 10) ?? "",
              }
            : { priority: "MEDIUM" }
        }
        disabled={mutation.isPending}
        onFinish={(values) => mutation.mutate(values)}
      >
        {mutation.isError && (
          <Alert
            type="error"
            showIcon
            title={mutation.error.message}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form.Item
          name="title"
          label="Tiêu đề công việc"
          rules={[{ required: true, whitespace: true, message: "Nhập tiêu đề công việc." }]}
        >
          <Input maxLength={300} placeholder="Ví dụ: Thiết kế wireframe trang chủ" />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="priority" label="Độ ưu tiên">
              <Select options={PROJECT_PRIORITY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="milestoneId" label="Thuộc cột mốc (Milestone)">
              <Select
                allowClear
                placeholder="Chọn cột mốc…"
                options={milestones.map((m) => ({ value: m.id, label: m.title }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="assigneeId" label="Giao cho thành viên">
              {users.data?.items.length ? (
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn người thực hiện…"
                  options={users.data.items.map((u) => ({
                    value: u.id,
                    label: u.fullName || u.email,
                  }))}
                />
              ) : (
                <Input placeholder="UUID thành viên (tùy chọn)" />
              )}
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="estimatedMinutes" label="Thời lượng ước tính (phút)">
              <InputNumber min={0} max={100000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="startDate" label="Ngày bắt đầu">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="dueDate" label="Hạn hoàn thành">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Mô tả chi tiết">
          <Input.TextArea rows={3} maxLength={4000} showCount />
        </Form.Item>
        <Flex justify="end" gap={8}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {initial ? "Lưu thay đổi" : "Tạo công việc"}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
}

// ============================================================================
// 2. TAB CỘT MỐC (MILESTONES)
// ============================================================================

function ProjectMilestonesTab({ projectId }: { projectId: string }) {
  const { message, modal } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const [editing, setEditing] = useState<Milestone | "new" | null>(null);
  const [viewingId, setViewingId] = useState<string>();

  const canRead = allowed(profile.data, "milestones.read");
  const canCreate = allowed(profile.data, "milestones.create");
  const canUpdate = allowed(profile.data, "milestones.update");
  const canDelete = allowed(profile.data, "milestones.delete");

  const queryKey = queryKeys.projectSection(projectId, "milestones");
  const query = useQuery({
    queryKey,
    enabled: canRead,
    queryFn: ({ signal }) => listProjectMilestones(projectId, signal),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.projectSection(projectId, "milestone-detail", { id: viewingId }),
    enabled: Boolean(viewingId && canRead),
    queryFn: ({ signal }) => getProjectMilestone(projectId, viewingId!, signal),
  });
  const refresh = () => client.invalidateQueries({ queryKey });

  const saveMutation = useMutation({
    mutationFn: (input: { values: Record<string, unknown>; id?: string }) =>
      saveProjectMilestone(projectId, input.values, input.id),
    onSuccess: async () => {
      setEditing(null);
      void message.success("Đã lưu cột mốc dự án.");
      await refresh();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: MilestoneStatus }) =>
      updateMilestoneStatus(projectId, input.id, input.status),
    onSuccess: async () => {
      void message.success("Đã đổi trạng thái cột mốc.");
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProjectMilestone(projectId, id),
    onSuccess: async () => {
      void message.success("Đã xóa cột mốc.");
      await refresh();
    },
  });

  if (!canRead) {
    return <Alert type="info" showIcon title="Bạn chưa có quyền xem cột mốc dự án." />;
  }

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary">
          Tổng số: {query.data?.meta.total ?? 0} cột mốc
        </Typography.Text>
        {canCreate && editing === null && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditing("new")}
          >
            Thêm cột mốc
          </Button>
        )}
      </Flex>

      {editing !== null && (
        <Card size="small">
          <Form
            layout="vertical"
            initialValues={
              editing === "new"
                ? { sortOrder: items.length + 1 }
                : {
                    title: editing.title,
                    description: editing.description ?? "",
                    dueDate: editing.dueDate?.slice(0, 10) ?? "",
                    sortOrder: editing.sortOrder,
                  }
            }
            disabled={saveMutation.isPending}
            onFinish={(values) =>
              saveMutation.mutate({
                values,
                id: editing === "new" ? undefined : editing.id,
              })
            }
          >
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="title"
                  label="Tên cột mốc"
                  rules={[{ required: true, whitespace: true, message: "Nhập tên cột mốc." }]}
                >
                  <Input maxLength={250} placeholder="Ví dụ: Bàn giao UI/UX, Go-Live…" />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="dueDate" label="Hạn dự kiến">
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="sortOrder" label="Thứ tự">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={2} maxLength={4000} />
            </Form.Item>
            <Flex justify="end" gap={8}>
              <Button onClick={() => setEditing(null)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                Lưu cột mốc
              </Button>
            </Flex>
          </Form>
        </Card>
      )}

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cột mốc nào." />
      ) : (
        items.map((m) => (
          <div key={m.id} className="project-milestone-card">
            <Flex justify="space-between" align="flex-start" wrap gap={12}>
              <div>
                <Space wrap size={8}>
                  <Tag>#{m.sortOrder}</Tag>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {m.title}
                  </Typography.Text>
                  <StatusTag status={m.status} />
                </Space>
                {m.dueDate && (
                  <div style={{ fontSize: 12, color: "var(--tn-muted)", marginTop: 4 }}>
                    Hạn mục tiêu: {m.dueDate.slice(0, 10)}
                  </div>
                )}
                {m.description && (
                  <Typography.Paragraph
                    type="secondary"
                    style={{ margin: "6px 0 0" }}
                  >
                    {m.description}
                  </Typography.Paragraph>
                )}
              </div>
              <Space wrap>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  title="Xem chi tiết cột mốc"
                  aria-label={`Xem chi tiết ${m.title}`}
                  onClick={() => setViewingId(m.id)}
                />
                {canUpdate && (
                  <>
                    <Select
                      size="small"
                      value={m.status}
                      style={{ width: 150 }}
                      options={MILESTONE_STATUS_OPTIONS}
                      onChange={(val) =>
                        statusMutation.mutate({ id: m.id, status: val })
                      }
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setEditing(m)}
                    />
                  </>
                )}
                {canDelete && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      modal.confirm({
                        title: `Xóa cột mốc "${m.title}"?`,
                        okText: "Xóa",
                        cancelText: "Hủy",
                        okButtonProps: { danger: true },
                        onOk: () => deleteMutation.mutateAsync(m.id),
                      })
                    }
                  />
                )}
              </Space>
            </Flex>
          </div>
        ))
      )}

      {viewingId && (
        <Modal
          open
          title="Chi tiết cột mốc dự án"
          onCancel={() => setViewingId(undefined)}
          footer={
            <Button type="primary" onClick={() => setViewingId(undefined)}>
              Đóng
            </Button>
          }
          destroyOnHidden
        >
          {detailQuery.isError ? (
            <LoadError error={detailQuery.error} retry={() => void detailQuery.refetch()} />
          ) : detailQuery.isPending || !detailQuery.data ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                { key: "title", label: "Tên cột mốc", children: detailQuery.data.title },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: <StatusTag status={detailQuery.data.status} />,
                },
                {
                  key: "sortOrder",
                  label: "Thứ tự ưu tiên",
                  children: `#${detailQuery.data.sortOrder}`,
                },
                {
                  key: "dueDate",
                  label: "Hạn mục tiêu",
                  children: detailQuery.data.dueDate?.slice(0, 10) || "—",
                },
                {
                  key: "completedAt",
                  label: "Hoàn thành lúc",
                  children: detailQuery.data.completedAt
                    ? new Date(detailQuery.data.completedAt).toLocaleString("vi-VN")
                    : "—",
                },
                {
                  key: "description",
                  label: "Mô tả",
                  children: detailQuery.data.description || "—",
                },
                {
                  key: "createdAt",
                  label: "Ngày tạo",
                  children: new Date(detailQuery.data.createdAt).toLocaleString("vi-VN"),
                },
              ]}
            />
          )}
        </Modal>
      )}
    </Flex>
  );
}

// ============================================================================
// 3. TAB THÀNH VIÊN, DỊCH VỤ & NHÃN DỰ ÁN
// ============================================================================

function ProjectResourcesTab({
  project,
  canUpdate,
}: {
  project: Project;
  canUpdate: boolean;
}) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const client = useQueryClient();
  const projectId = project.id;

  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [selectedServiceId, setSelectedServiceId] = useState<string>();
  const [quantity, setQuantity] = useState("1.00");
  const [unitPrice, setUnitPrice] = useState("");
  const [quickAddTagId, setQuickAddTagId] = useState<string>();

  const membersQuery = useQuery({
    queryKey: queryKeys.projectSection(projectId, "members"),
    queryFn: ({ signal }) => listProjectMembers(projectId, signal),
  });
  const servicesQuery = useQuery({
    queryKey: queryKeys.projectSection(projectId, "services"),
    queryFn: ({ signal }) => listProjectServices(projectId, signal),
  });
  const tagsQuery = useQuery({
    queryKey: queryKeys.projectSection(projectId, "tags"),
    queryFn: ({ signal }) => listProjectTags(projectId, signal),
  });

  const userCatalog = useAdminList<Member>(
    "users",
    { page: 1, limit: 100, status: "ACTIVE" },
    canUpdate && allowed(profile.data, "users.read"),
    false,
  );
  const serviceCatalog = useAdminList<Service>(
    "services",
    { page: 1, limit: 100 },
    canUpdate && allowed(profile.data, "services.read"),
    false,
  );
  const tagCatalog = useAdminList<ProjectTag>(
    "tags",
    { page: 1, limit: 100 },
    canUpdate && allowed(profile.data, "tags.read"),
    false,
  );

  const addMemberMut = useMutation({
    mutationFn: (uid: string) => addProjectMember(projectId, uid),
    onSuccess: async () => {
      setSelectedUserId(undefined);
      void message.success("Đã thêm thành viên vào dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "members"),
      });
    },
  });

  const removeMemberMut = useMutation({
    mutationFn: (uid: string) => removeProjectMember(projectId, uid),
    onSuccess: async () => {
      void message.success("Đã gỡ thành viên khỏi dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "members"),
      });
    },
  });

  const addServiceMut = useMutation({
    mutationFn: () =>
      addProjectService(projectId, {
        serviceId: selectedServiceId!,
        quantity,
        unitPrice: unitPrice || undefined,
      }),
    onSuccess: async () => {
      setSelectedServiceId(undefined);
      setQuantity("1.00");
      setUnitPrice("");
      void message.success("Đã gắn dịch vụ vào dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "services"),
      });
    },
  });

  const removeServiceMut = useMutation({
    mutationFn: (sid: string) => removeProjectService(projectId, sid),
    onSuccess: async () => {
      void message.success("Đã gỡ dịch vụ khỏi dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "services"),
      });
    },
  });

  const tagsMut = useMutation({
    mutationFn: (tagIds: string[]) => replaceProjectTags(projectId, tagIds),
    onSuccess: async () => {
      void message.success("Đã đồng bộ bộ nhãn dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "tags"),
      });
    },
  });

  const addTagMut = useMutation({
    mutationFn: (tagId: string) => addProjectTags(projectId, [tagId]),
    onSuccess: async () => {
      setQuickAddTagId(undefined);
      void message.success("Đã gắn thêm nhãn vào dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "tags"),
      });
    },
  });

  const removeTagMut = useMutation({
    mutationFn: (tagId: string) => removeProjectTag(projectId, tagId),
    onSuccess: async () => {
      void message.success("Đã gỡ nhãn khỏi dự án.");
      await client.invalidateQueries({
        queryKey: queryKeys.projectSection(projectId, "tags"),
      });
    },
  });

  const userMap = new Map(
    (userCatalog.data?.items ?? []).map((u) => [u.id, u.fullName || u.email]),
  );

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <Card title="Thành viên tham gia dự án" size="small">
          <Flex vertical gap={12}>
            {canUpdate && (
              <Flex gap={8}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn người dùng…"
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  style={{ flex: 1 }}
                  options={(userCatalog.data?.items ?? []).map((u) => ({
                    value: u.id,
                    label: `${u.fullName || u.email} (${u.email})`,
                  }))}
                />
                <Button
                  type="primary"
                  disabled={!selectedUserId}
                  loading={addMemberMut.isPending}
                  onClick={() => selectedUserId && addMemberMut.mutate(selectedUserId)}
                >
                  Thêm
                </Button>
              </Flex>
            )}
            {(membersQuery.data?.items ?? []).length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thành viên." />
            ) : (
              (membersQuery.data?.items ?? []).map((m) => (
                <Flex
                  key={m.userId}
                  justify="space-between"
                  align="center"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid var(--tn-line)",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <Typography.Text strong>
                      {userMap.get(m.userId) ?? m.userId}
                    </Typography.Text>
                    <div style={{ fontSize: 12, color: "var(--tn-muted)" }}>
                      Tham gia: {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  {canUpdate && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeMemberMut.mutate(m.userId)}
                    />
                  )}
                </Flex>
              ))
            )}
          </Flex>
        </Card>

        <Card title="Nhãn phân loại dự án" size="small" style={{ marginTop: 20 }}>
          <Flex vertical gap={12}>
            <Space wrap>
              {(tagsQuery.data?.items ?? []).map((t) => (
                <Tag
                  key={t.id}
                  color={t.color || "blue"}
                  closable={canUpdate && !removeTagMut.isPending}
                  onClose={(e) => {
                    e.preventDefault();
                    removeTagMut.mutate(t.id);
                  }}
                >
                  {t.name}
                </Tag>
              ))}
              {!(tagsQuery.data?.items ?? []).length && (
                <Typography.Text type="secondary">Chưa gắn nhãn.</Typography.Text>
              )}
            </Space>
            {canUpdate && tagCatalog.data && (
              <Flex vertical gap={8}>
                <Flex gap={8} align="center">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ flex: 1 }}
                    placeholder="Gắn thêm nhanh 1 nhãn vào dự án…"
                    value={quickAddTagId}
                    onChange={setQuickAddTagId}
                    options={tagCatalog.data.items
                      .filter(
                        (t) =>
                          !(tagsQuery.data?.items ?? []).some((cur) => cur.id === t.id),
                      )
                      .map((t) => ({
                        value: t.id,
                        label: t.name,
                      }))}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    disabled={!quickAddTagId}
                    loading={addTagMut.isPending}
                    onClick={() => quickAddTagId && addTagMut.mutate(quickAddTagId)}
                  >
                    Gắn nhãn
                  </Button>
                </Flex>
                <Select
                  mode="multiple"
                  placeholder="Hoặc chọn/thay thế toàn bộ bộ nhãn dự án…"
                  value={(tagsQuery.data?.items ?? []).map((t) => t.id)}
                  loading={tagsMut.isPending}
                  options={tagCatalog.data.items.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  onChange={(ids) => tagsMut.mutate(ids)}
                />
              </Flex>
            )}
          </Flex>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title={`Hạng mục Dịch vụ đăng ký (${project.currency})`} size="small">
          <Flex vertical gap={12}>
            {addServiceMut.isError && (
              <Alert type="error" showIcon title={addServiceMut.error.message} />
            )}
            {canUpdate && (
              <Flex vertical gap={8}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn dịch vụ…"
                  value={selectedServiceId}
                  onChange={setSelectedServiceId}
                  options={(serviceCatalog.data?.items ?? [])
                    .filter((s) => s.isActive)
                    .map((s) => ({
                      value: s.id,
                      label: `${s.code} — ${s.name} (${formatPrice(s.defaultPrice)} ₫)`,
                    }))}
                />
                <Flex gap={8}>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Số lượng (1.00)"
                    style={{ width: 130 }}
                  />
                  <Input
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="Đơn giá riêng (tùy chọn)"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    disabled={!selectedServiceId}
                    loading={addServiceMut.isPending}
                    onClick={() => addServiceMut.mutate()}
                  >
                    Gắn dịch vụ
                  </Button>
                </Flex>
              </Flex>
            )}
            {(servicesQuery.data?.items ?? []).length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa gắn dịch vụ nào." />
            ) : (
              (servicesQuery.data?.items ?? []).map((link) => (
                <Card key={link.serviceId} size="small">
                  <Flex justify="space-between" align="center">
                    <div>
                      <Typography.Text strong>{link.service.name}</Typography.Text>
                      <div style={{ fontSize: 12, color: "var(--tn-muted)" }}>
                        Mã: {link.service.code} · SL: {link.quantity} · Đơn giá:{" "}
                        <strong>
                          {formatPrice(link.unitPrice)} {project.currency}
                        </strong>
                      </div>
                    </div>
                    {canUpdate && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeServiceMut.mutate(link.serviceId)}
                      />
                    )}
                  </Flex>
                </Card>
              ))
            )}
          </Flex>
        </Card>
      </Col>
    </Row>
  );
}

// ============================================================================
// 4. TAB CHẤM CÔNG DỰ ÁN (TIME ENTRIES) & 5. TAB LỊCH SỬ HOẠT ĐỘNG (ACTIVITIES)
// ============================================================================

function ProjectTimeEntriesTab({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: queryKeys.projectSection(projectId, "time-entries", { page }),
    queryFn: ({ signal }) => listProjectTimeEntries(projectId, { page, limit: 20 }, signal),
  });

  const items = query.data?.items ?? [];
  const totalMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary">
          Tổng thời gian trang này: <strong>{totalMinutes} phút</strong> (
          {(totalMinutes / 60).toFixed(1)} giờ)
        </Typography.Text>
      </Flex>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Table
          rowKey="id"
          dataSource={items}
          loading={query.isFetching}
          columns={[
            {
              title: "Ngày làm việc",
              dataIndex: "workDate",
              width: 140,
              render: (v) => String(v).slice(0, 10),
            },
            {
              title: "Thời lượng",
              dataIndex: "durationMinutes",
              width: 130,
              render: (v) => <Tag color="blue">{v} phút</Tag>,
            },
            {
              title: "Tính phí",
              dataIndex: "isBillable",
              width: 130,
              render: (v) => (
                <Tag color={v ? "green" : "default"}>
                  {v ? "Billable" : "Non-billable"}
                </Tag>
              ),
            },
            {
              title: "Người chấm công",
              dataIndex: "userId",
              width: 220,
              render: (v) => <span className="admin-code">{v}</span>,
            },
            {
              title: "Ghi chú",
              dataIndex: "notes",
              render: (v) => v || "—",
            },
          ]}
          pagination={{
            current: page,
            pageSize: 20,
            total: query.data?.meta.total ?? 0,
            onChange: setPage,
          }}
        />
      )}
    </Flex>
  );
}

function ProjectActivitiesTab({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: queryKeys.projectSection(projectId, "activities", { page }),
    queryFn: ({ signal }) => listProjectActivities(projectId, { page, limit: 20 }, signal),
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={12}>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử hoạt động." />
      ) : (
        items.map((act) => (
          <div key={act.id} className="project-activity-row">
            <Flex justify="space-between" align="center" wrap gap={8}>
              <Space wrap size={6}>
                <Tag color="blue">{act.entityType}</Tag>
                <Typography.Text strong>{act.action}</Typography.Text>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(act.createdAt).toLocaleString("vi-VN")}
              </Typography.Text>
            </Flex>
            <div style={{ fontSize: 12, color: "var(--tn-muted)", marginTop: 4 }}>
              Người thực hiện: {act.actorId || "Hệ thống"}
            </div>
          </div>
        ))
      )}
      {(query.data?.meta.total ?? 0) > 20 && (
        <Flex justify="end">
          <Pagination
            size="small"
            current={page}
            pageSize={20}
            total={query.data?.meta.total ?? 0}
            showSizeChanger={false}
            onChange={setPage}
          />
        </Flex>
      )}
    </Flex>
  );
}
