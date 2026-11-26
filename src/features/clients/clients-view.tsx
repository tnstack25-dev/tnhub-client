"use client";
import "./clients.css";
import dynamic from "next/dynamic";
import {
  ApartmentOutlined,
  BankOutlined,
  ContactsOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Flex, Select, Space, Tag, Typography, type MenuProps } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { DebouncedSearch } from "@/components/debounced-search";
import { accessRowActions } from "@/features/admin/access-actions";
import { useBulkClientStatusMutation } from "./clients-queries";
import {
  CLIENT_STATUS_OPTIONS,
  CLIENT_TYPE_LABELS,
  type Client,
  type ClientStatus,
} from "./clients-types";

const ClientDetail = dynamic(() =>
  import("./components/client-detail").then((m) => m.ClientDetail),
);
const ClientEditor = dynamic(() =>
  import("./components/client-editor").then((m) => m.ClientEditor),
);
const ClientBatch = dynamic(() =>
  import("./components/client-batch").then((m) => m.ClientBatch),
);

export function ClientsView() {
  const { modal, message } = App.useApp();
  const statusMutation = useBulkClientStatusMutation();

  function confirmStatusChange(ids: string[], status: ClientStatus, label: string) {
    modal.confirm({
      title: `Chuyển trạng thái ${ids.length} khách hàng sang "${label}"?`,
      content:
        "Chỉ các khách hàng đang hoạt động (chưa xóa mềm) và chưa ở trạng thái này mới được cập nhật.",
      okText: "Cập nhật trạng thái",
      cancelText: "Hủy",
      onOk: async () => {
        const res = await statusMutation.mutateAsync({ ids, status });
        void message.success(
          res?.affectedCount !== undefined
            ? `Đã cập nhật trạng thái ${res.affectedCount} khách hàng.`
            : "Đã cập nhật trạng thái.",
        );
      },
    });
  }

  const config: ResourceConfig<Client> = {
    resource: "clients",
    title: "Khách hàng",
    description:
      "Quản lý hồ sơ doanh nghiệp và cá nhân, trạng thái hợp tác và danh bạ người liên hệ.",
    icon: <ApartmentOutlined />,
    supportsTrash: true,
    searchMaxLength: 255,
    states: CLIENT_STATUS_OPTIONS,
    blocked: () => false,
    formatSkipReason: (reason) =>
      ({
        NOT_FOUND: "Khách hàng không tồn tại",
        ALREADY_DELETED: "Khách hàng đã ở trong thùng rác",
        NOT_DELETED: "Khách hàng chưa ở trong thùng rác",
        ALREADY_IN_STATE: "Đã ở trạng thái yêu cầu",
        HAS_OPEN_PROJECTS: "Khách hàng còn dự án đang mở",
      } as Record<string, string>)[reason] ?? reason,
    params: ({ clientType, source, sort, status }) => {
      const [sortBy, sortOrder] = sort.split(":");
      return {
        clientType: clientType ?? undefined,
        source: source.trim() || undefined,
        sortBy,
        sortOrder,
        status,
      };
    },
    renderFilters: ({ clientType, source, sort }, update) => (
      <>
        <Select
          aria-label="Lọc phân loại khách hàng"
          allowClear
          placeholder="Tất cả phân loại"
          value={clientType ?? undefined}
          style={{ minWidth: 165 }}
          options={[
            { value: "BUSINESS", label: "Doanh nghiệp" },
            { value: "INDIVIDUAL", label: "Cá nhân" },
          ]}
          onChange={(value) => update({ clientType: value ?? null })}
        />
        <DebouncedSearch
          value={source}
          aria-label="Lọc nguồn khách hàng"
          placeholder="Lọc theo nguồn (referral…)"
          allowClear
          maxLength={100}
          style={{ maxWidth: 210 }}
          onSearch={(value) => update({ source: value })}
        />
        <Select
          aria-label="Sắp xếp khách hàng"
          value={sort}
          style={{ minWidth: 185 }}
          options={[
            { value: "createdAt:desc", label: "Mới tạo nhất" },
            { value: "createdAt:asc", label: "Cũ nhất" },
            { value: "updatedAt:desc", label: "Mới cập nhật" },
            { value: "name:asc", label: "Tên A–Z" },
            { value: "name:desc", label: "Tên Z–A" },
            { value: "status:asc", label: "Theo trạng thái" },
          ]}
          onChange={(value) => update({ sort: value })}
        />
      </>
    ),
    columns: (context) => [
      {
        title: "Khách hàng",
        key: "name",
        width: 280,
        render: (_, item) => (
          <Flex align="center" gap={12}>
            <Avatar
              shape="square"
              style={{
                background: "var(--tn-brand-soft)",
                color: "var(--tn-brand-ink)",
                border: "1px solid var(--tn-brand-border)",
              }}
              icon={
                item.clientType === "BUSINESS" ? <BankOutlined /> : <UserOutlined />
              }
            />
            <div className="admin-identity">
              <Button
                type="link"
                className="admin-name"
                onClick={() => context.openDetail(item.id)}
              >
                {item.name}
              </Button>
              <div className="client-meta-line">
                <Tag color={item.clientType === "BUSINESS" ? "blue" : "cyan"}>
                  {CLIENT_TYPE_LABELS[item.clientType] ?? item.clientType}
                </Tag>
                {item.taxCode && (
                  <Typography.Text type="secondary" className="admin-code">
                    MST: {item.taxCode}
                  </Typography.Text>
                )}
              </div>
            </div>
          </Flex>
        ),
      },
      {
        title: "Thông tin liên lạc",
        key: "contact",
        width: 250,
        render: (_, item) => (
          <Space orientation="vertical" size={4}>
            {item.email ? (
              <Typography.Text ellipsis={{ tooltip: item.email }}>
                <MailOutlined style={{ marginInlineEnd: 6, color: "var(--tn-muted)" }} />
                {item.email}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">Chưa có email</Typography.Text>
            )}
            <div className="client-meta-line">
              {item.phone && (
                <span>
                  <PhoneOutlined /> {item.phone}
                </span>
              )}
              {item.websiteUrl && (
                <a
                  href={item.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GlobalOutlined /> Website
                </a>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: "Danh bạ & Nguồn",
        key: "contactsCount",
        width: 190,
        render: (_, item) => (
          <Space orientation="vertical" size={4}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: "auto" }}
              icon={<ContactsOutlined />}
              onClick={() => context.openDetail(item.id)}
            >
              {item._count?.contacts ?? 0} người liên hệ
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Nguồn: {item.source || "Chưa phân loại"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 140,
        render: (_, item) => <StatusTag status={item.status} />,
      },
    ],
    actions: (item, context) => {
      const base = accessRowActions(item.id, context, { blocked: false }) ?? [];
      if (!context.trash) {
        base.splice(1, 0, {
          key: "contacts",
          label: `Danh bạ liên hệ (${item._count?.contacts ?? 0})`,
          onClick: () => context.openDetail(item.id),
        });
      }
      return base;
    },
    bulkActions: (ids, _items, context) => {
      const items: NonNullable<MenuProps["items"]> = [];
      if (!context.trash && context.can("update")) {
        items.push(
          {
            key: "edit",
            label: "Chỉnh sửa các dòng đã chọn",
            onClick: () => context.openBatch(ids),
          },
          {
            key: "status-active",
            label: "Chuyển sang Hoạt động",
            onClick: () => confirmStatusChange(ids, "ACTIVE", "Hoạt động"),
          },
          {
            key: "status-lead",
            label: "Chuyển sang Tiềm năng",
            onClick: () => confirmStatusChange(ids, "LEAD", "Tiềm năng"),
          },
          {
            key: "status-inactive",
            label: "Chuyển sang Tạm ngưng",
            onClick: () => confirmStatusChange(ids, "INACTIVE", "Tạm ngưng"),
          },
        );
      }
      if (context.trash && context.can("restore")) {
        items.push({
          key: "restore",
          label: "Khôi phục khách hàng",
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
    renderCreateActions: (context) =>
      !context.trash && context.can("create") ? (
        <Button onClick={() => context.openBatch()}>Tạo nhiều khách hàng</Button>
      ) : null,
    renderEditor: (id, close) => <ClientEditor id={id} onClose={close} />,
    renderDetail: (id, trash, close) => (
      <ClientDetail id={id} trash={trash} onClose={close} />
    ),
    renderBatch: (items, close) => <ClientBatch items={items} onClose={close} />,
  };

  return <ResourceView config={config} />;
}
