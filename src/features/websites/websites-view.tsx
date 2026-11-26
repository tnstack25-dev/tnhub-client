"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GlobalOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { App, Button, Input, Select, Space, Tag, Typography, type MenuProps } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { accessRowActions } from "@/features/admin/access-actions";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { updateWebsitesStatusBulk } from "./websites-api";
import { WEBSITE_STATUS_OPTIONS, type Website, type WebsiteStatus } from "./websites-types";

const WebsiteDetail = dynamic(() =>
  import("./components/website-detail").then((m) => m.WebsiteDetail),
);
const WebsiteEditor = dynamic(() =>
  import("./components/website-editor").then((m) => m.WebsiteEditor),
);

export function WebsitesView() {
  const { modal, message } = App.useApp();
  const refresh = useRefreshAdmin("websites");
  const statusMutation = useMutation({
    mutationFn: (input: { ids: string[]; status: WebsiteStatus }) =>
      updateWebsitesStatusBulk(input.ids, input.status),
    onSuccess: async (data) => {
      void message.success(
        data?.affectedCount !== undefined
          ? `Đã cập nhật trạng thái ${data.affectedCount} website.`
          : "Đã cập nhật trạng thái website.",
      );
      await refresh();
    },
  });

  function confirmStatus(ids: string[], status: WebsiteStatus, label: string) {
    modal.confirm({
      title: `Chuyển ${ids.length} website sang trạng thái "${label}"?`,
      okText: "Cập nhật",
      cancelText: "Hủy",
      onOk: () => statusMutation.mutateAsync({ ids, status }),
    });
  }

  const config: ResourceConfig<Website> = {
    resource: "websites",
    title: "Website & Vận hành",
    description:
      "Quản lý tên miền, máy chủ, hạn gia hạn, hạng mục bàn giao và lịch sử bảo trì website của dự án.",
    icon: <GlobalOutlined />,
    supportsTrash: true,
    searchMaxLength: 150,
    states: WEBSITE_STATUS_OPTIONS,
    blocked: () => false,
    formatSkipReason: (reason) =>
      ({
        NOT_FOUND: "Website không tồn tại",
        ALREADY_DELETED: "Website đã trong thùng rác",
        NOT_DELETED: "Website chưa ở trong thùng rác",
        ALREADY_IN_STATE: "Đã ở trạng thái yêu cầu",
        PROJECT_UNAVAILABLE: "Dự án liên kết không khả dụng hoặc đang trong thùng rác",
      } as Record<string, string>)[reason] ?? reason,
    params: ({ projectId, expiresBefore, sort, status }) => {
      const [rawSortBy, sortOrder] = sort.split(":");
      const sortBy = [
        "createdAt",
        "updatedAt",
        "displayName",
        "domainExpiresOn",
        "hostingExpiresOn",
      ].includes(rawSortBy)
        ? rawSortBy
        : "createdAt";
      return {
        projectId: projectId.trim() || undefined,
        expiresBefore: expiresBefore.trim() || undefined,
        sortBy,
        sortOrder: sortOrder || "desc",
        status,
      };
    },
    renderFilters: ({ expiresBefore, sort }, update) => (
      <>
        <Input
          type="date"
          aria-label="Lọc hạn hết hạn trước ngày"
          value={expiresBefore}
          style={{ width: 175 }}
          onChange={(e) => update({ expiresBefore: e.target.value })}
        />
        <Select
          aria-label="Sắp xếp website"
          value={
            [
              "createdAt:desc",
              "updatedAt:desc",
              "displayName:asc",
              "domainExpiresOn:asc",
              "hostingExpiresOn:asc",
            ].includes(sort)
              ? sort
              : "createdAt:desc"
          }
          style={{ minWidth: 200 }}
          options={[
            { value: "createdAt:desc", label: "Mới tạo nhất" },
            { value: "updatedAt:desc", label: "Mới cập nhật" },
            { value: "displayName:asc", label: "Tên hiển thị A–Z" },
            { value: "domainExpiresOn:asc", label: "Hạn Domain gần nhất" },
            { value: "hostingExpiresOn:asc", label: "Hạn Hosting gần nhất" },
          ]}
          onChange={(value) => update({ sort: value })}
        />
      </>
    ),
    columns: (context) => [
      {
        title: "Website",
        key: "displayName",
        width: 260,
        render: (_, item) => (
          <div className="admin-identity">
            <Button
              type="link"
              className="admin-name"
              onClick={() => context.openDetail(item.id)}
            >
              {item.displayName}
            </Button>
            <div style={{ marginTop: 4 }}>
              {item.domainName ? (
                <Typography.Text type="secondary" className="admin-code">
                  {item.domainName}
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Chưa gắn tên miền
                </Typography.Text>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Hạ tầng kỹ thuật",
        key: "tech",
        width: 230,
        render: (_, item) => (
          <Space orientation="vertical" size={4}>
            <Space wrap size={4}>
              {item.cms && <Tag>{item.cms}</Tag>}
              {item.framework && <Tag color="blue">{item.framework}</Tag>}
              {!item.cms && !item.framework && (
                <Typography.Text type="secondary">Chưa khai báo stack</Typography.Text>
              )}
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Hosting: {item.hostingProvider || "—"} {item.serverIp ? `(${item.serverIp})` : ""}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Hạn Domain / Hosting",
        key: "expiry",
        width: 200,
        render: (_, item) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text style={{ fontSize: 12 }}>
              Domain: <strong>{item.domainExpiresOn?.slice(0, 10) || "—"}</strong>
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              Hosting: <strong>{item.hostingExpiresOn?.slice(0, 10) || "—"}</strong>
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 160,
        render: (_, item) => (
          <Space orientation="vertical" size={4}>
            <StatusTag status={item.status} />
            <Link href={`/projects/${item.projectId}`} style={{ fontSize: 12 }}>
              Xem dự án →
            </Link>
          </Space>
        ),
      },
    ],
    actions: (item, context) => {
      const base = accessRowActions(item.id, context, { blocked: false }) ?? [];
      if (!context.trash && context.can("update")) {
        base.push(
          { type: "divider" },
          ...WEBSITE_STATUS_OPTIONS.filter((opt) => opt.value !== item.status).map((opt) => ({
            key: `status-${opt.value}`,
            label: `Chuyển sang: ${opt.label}`,
            onClick: () => confirmStatus([item.id], opt.value, opt.label),
          })),
        );
      }
      return base;
    },
    bulkActions: (ids, _items, context) => {
      const items: NonNullable<MenuProps["items"]> = [];
      if (!context.trash && context.can("update")) {
        items.push(
          ...WEBSITE_STATUS_OPTIONS.map((opt) => ({
            key: `bulk-${opt.value}`,
            label: `Chuyển trạng thái: ${opt.label}`,
            onClick: () => confirmStatus(ids, opt.value, opt.label),
          })),
        );
      }
      if (context.trash && context.can("restore")) {
        items.push({
          key: "restore",
          label: "Khôi phục website",
          onClick: () => context.confirm(ids, "restore"),
        });
      }
      if (context.can(context.trash ? "hard_delete" : "delete")) {
        items.push({
          key: "delete",
          label: context.trash ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác",
          danger: true,
          onClick: () => context.confirm(ids, context.trash ? "permanent" : "delete"),
        });
      }
      return items;
    },
    renderEditor: (id, close) => <WebsiteEditor id={id} onClose={close} />,
    renderDetail: (id, trash, close) => (
      <WebsiteDetail id={id} trash={trash} onClose={close} />
    ),
  };

  return <ResourceView config={config} />;
}
