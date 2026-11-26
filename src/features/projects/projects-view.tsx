"use client";
import "./projects.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FolderOpenOutlined, ProjectOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { App, Button, Select, Space, Tag, Typography, type MenuProps } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { EntityDetail } from "@/features/admin/components/entity-detail";
import { accessRowActions } from "@/features/admin/access-actions";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { formatPrice } from "@/lib/admin/format";
import { updateProjectsStatusBulk } from "./projects-api";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type Project,
  type ProjectStatus,
} from "./projects-types";

const ProjectEditor = dynamic(() =>
  import("./components/project-editor").then((m) => m.ProjectEditor),
);

export function ProjectsView() {
  const { modal, message } = App.useApp();
  const refresh = useRefreshAdmin("projects");
  const statusMutation = useMutation({
    mutationFn: (input: { ids: string[]; status: ProjectStatus }) =>
      updateProjectsStatusBulk(input.ids, input.status),
    onSuccess: async (res) => {
      void message.success(
        res?.affectedCount !== undefined
          ? `Đã cập nhật trạng thái ${res.affectedCount} dự án.`
          : "Đã cập nhật trạng thái dự án.",
      );
      await refresh();
    },
  });

  function confirmStatus(ids: string[], status: ProjectStatus, label: string) {
    modal.confirm({
      title: `Chuyển ${ids.length} dự án sang trạng thái "${label}"?`,
      okText: "Cập nhật",
      cancelText: "Hủy",
      onOk: () => statusMutation.mutateAsync({ ids, status }),
    });
  }

  const config: ResourceConfig<Project> = {
    resource: "projects",
    title: "Dự án",
    description:
      "Quản lý vòng đời dự án, ngân sách, cột mốc tiến độ, phân công công việc và chấm công.",
    icon: <ProjectOutlined />,
    supportsTrash: true,
    searchMaxLength: 150,
    states: PROJECT_STATUS_OPTIONS,
    blocked: () => false,
    formatSkipReason: (reason) =>
      ({
        NOT_FOUND: "Dự án không tồn tại",
        ALREADY_DELETED: "Dự án đã trong thùng rác",
        NOT_DELETED: "Dự án chưa ở trong thùng rác",
        ALREADY_IN_STATE: "Đã ở trạng thái yêu cầu",
        CLIENT_UNAVAILABLE: "Khách hàng của dự án đang ở trong thùng rác",
      } as Record<string, string>)[reason] ?? reason,
    params: ({ projectType, priority, sort, status }) => {
      const [rawSortBy, sortOrder] = sort.split(":");
      const sortBy = ["createdAt", "updatedAt", "name", "deadline", "code"].includes(
        rawSortBy,
      )
        ? rawSortBy
        : "createdAt";
      return {
        projectType: projectType ?? undefined,
        priority: priority ?? undefined,
        sortBy,
        sortOrder: sortOrder || "desc",
        status,
      };
    },
    renderFilters: ({ projectType, priority, sort }, update) => (
      <>
        <Select
          aria-label="Lọc loại dự án"
          allowClear
          placeholder="Tất cả loại dự án"
          value={projectType ?? undefined}
          style={{ minWidth: 175 }}
          options={PROJECT_TYPE_OPTIONS}
          onChange={(value) => update({ projectType: value ?? null })}
        />
        <Select
          aria-label="Lọc độ ưu tiên"
          allowClear
          placeholder="Tất cả độ ưu tiên"
          value={priority ?? undefined}
          style={{ minWidth: 160 }}
          options={PROJECT_PRIORITY_OPTIONS}
          onChange={(value) => update({ priority: value ?? null })}
        />
        <Select
          aria-label="Sắp xếp dự án"
          value={
            [
              "createdAt:desc",
              "updatedAt:desc",
              "deadline:asc",
              "name:asc",
              "code:asc",
            ].includes(sort)
              ? sort
              : "createdAt:desc"
          }
          style={{ minWidth: 185 }}
          options={[
            { value: "createdAt:desc", label: "Mới tạo nhất" },
            { value: "updatedAt:desc", label: "Mới cập nhật" },
            { value: "deadline:asc", label: "Hạn chót gần nhất" },
            { value: "name:asc", label: "Tên dự án A–Z" },
            { value: "code:asc", label: "Mã dự án A–Z" },
          ]}
          onChange={(value) => update({ sort: value })}
        />
      </>
    ),
    columns: (context) => [
      {
        title: "Dự án",
        key: "name",
        width: 280,
        render: (_, item) => (
          <div className="admin-identity">
            <Button
              type="link"
              className="admin-name"
              onClick={() => context.openDetail(item.id)}
            >
              {item.name}
            </Button>
            <Space size={6} style={{ marginTop: 4 }}>
              <Typography.Text type="secondary" className="admin-code">
                {item.code}
              </Typography.Text>
              <Tag>{PROJECT_TYPE_OPTIONS.find((t) => t.value === item.projectType)?.label ?? item.projectType}</Tag>
            </Space>
          </div>
        ),
      },
      {
        title: "Ưu tiên & Ngân sách",
        key: "budget",
        width: 210,
        render: (_, item) => {
          const prio = PROJECT_PRIORITY_OPTIONS.find((p) => p.value === item.priority);
          return (
            <Space orientation="vertical" size={4}>
              <Tag color={prio?.color}>{prio?.label ?? item.priority}</Tag>
              <Typography.Text strong>
                {formatPrice(item.budget)} {item.currency}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        title: "Tiến độ & Thời hạn",
        key: "dates",
        width: 200,
        render: (_, item) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              Bắt đầu: {item.startDate?.slice(0, 10) || "—"}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              Deadline: <strong>{item.deadline?.slice(0, 10) || "—"}</strong>
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái & Công việc",
        key: "status",
        width: 190,
        render: (_, item) => (
          <Space orientation="vertical" size={6}>
            <StatusTag status={item.status} />
            {!context.trash && (
              <Link href={`/projects/${item.id}`}>
                <Button type="primary" ghost size="small" icon={<FolderOpenOutlined />}>
                  Không gian công việc
                </Button>
              </Link>
            )}
          </Space>
        ),
      },
    ],
    actions: (item, context) => {
      const base = accessRowActions(item.id, context, { blocked: false }) ?? [];
      if (!context.trash && context.can("update")) {
        base.push(
          { type: "divider" },
          ...PROJECT_STATUS_OPTIONS.filter((opt) => opt.value !== item.status).map(
            (opt) => ({
              key: `status-${opt.value}`,
              label: `Chuyển sang: ${opt.label}`,
              onClick: () => confirmStatus([item.id], opt.value, opt.label),
            }),
          ),
        );
      }
      return base;
    },
    bulkActions: (ids, _items, context) => {
      const items: NonNullable<MenuProps["items"]> = [];
      if (!context.trash && context.can("update")) {
        items.push(
          ...PROJECT_STATUS_OPTIONS.map((opt) => ({
            key: `bulk-${opt.value}`,
            label: `Chuyển trạng thái: ${opt.label}`,
            onClick: () => confirmStatus(ids, opt.value, opt.label),
          })),
        );
      }
      if (context.trash && context.can("restore")) {
        items.push({
          key: "restore",
          label: "Khôi phục dự án",
          onClick: () => context.confirm(ids, "restore"),
        });
      }
      if (context.can(context.trash ? "hard_delete" : "delete")) {
        items.push({
          key: "delete",
          label: context.trash ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác",
          danger: true,
          onClick: () =>
            context.confirm(ids, context.trash ? "permanent" : "delete"),
        });
      }
      return items;
    },
    renderEditor: (id, close) => <ProjectEditor id={id} onClose={close} />,
    renderDetail: (id, trash, close) => (
      <EntityDetail<Project>
        resource="projects"
        id={id}
        trash={trash}
        onClose={close}
        labels={{
          code: "Mã dự án",
          slug: "Slug",
          projectType: "Loại dự án",
          priority: "Độ ưu tiên",
          budget: "Ngân sách",
          currency: "Tiền tệ",
          startDate: "Ngày bắt đầu",
          deadline: "Hạn chót",
          endDate: "Ngày kết thúc",
          description: "Mô tả",
          createdAt: "Ngày tạo",
          updatedAt: "Cập nhật lần cuối",
        }}
        getTitle={(item) => item.name}
        renderStatus={(item) => (
          <Space wrap>
            <StatusTag status={item.status} />
            <Tag>{item.code}</Tag>
            {!trash && (
              <Link href={`/projects/${item.id}`}>
                <Button type="primary" size="small" icon={<FolderOpenOutlined />}>
                  Mở không gian công việc & Tasks
                </Button>
              </Link>
            )}
          </Space>
        )}
      />
    ),
  };

  return <ResourceView config={config} />;
}
