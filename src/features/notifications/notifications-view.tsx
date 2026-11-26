"use client";
import "./notifications.css";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import {
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Pagination,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { DebouncedSearch } from "@/components/debounced-search";
import { LoadError, emptyAdmin } from "@/components/admin/admin-ui";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { listUrlOptions, notificationParsers } from "@/lib/url/list-parsers";
import {
  useAdminNotifications,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMyNotifications,
  useNotificationStateMutation,
  useUnreadNotificationCount,
} from "./notifications-queries";
import type {
  NotificationContent,
  NotificationInboxState,
  UserNotificationItem,
} from "./notifications-types";

const NotificationEditor = dynamic(() =>
  import("./components/notification-editor").then((m) => m.NotificationEditor),
);

export function NotificationsView() {
  const profile = useWorkspaceProfile();
  const unreadQuery = useUnreadNotificationCount(Boolean(profile.data));
  const [url, setUrl] = useQueryStates(notificationParsers, listUrlOptions);
  const canReadAdmin = allowed(profile.data, "notifications.read");
  const canCreateAdmin = allowed(profile.data, "notifications.create");
  const canUpdateAdmin = allowed(profile.data, "notifications.update");
  const canDeleteAdmin = allowed(profile.data, "notifications.delete");
  const showAdminTab = canReadAdmin || canCreateAdmin;
  const activeTab = showAdminTab && url.tab === "manage" ? "manage" : "inbox";

  const [editor, setEditor] = useState<{ id?: string } | null>(null);
  const [detailItem, setDetailItem] = useState<NotificationContent | null>(null);

  return (
    <Flex vertical gap={24} className="admin-page">
      <header className="admin-page-heading">
        <div>
          <Typography.Text className="admin-eyebrow">TRUNG TÂM THÔNG BÁO</Typography.Text>
          <Typography.Title level={1}>Hộp thư & Phát thông báo</Typography.Title>
          <Typography.Paragraph type="secondary">
            Theo dõi thông báo công việc cá nhân, lưu trữ hộp thư và phát thông báo hệ thống tới thành viên.
          </Typography.Paragraph>
        </div>
        <Space wrap>
          {canCreateAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditor({})}
            >
              Phát thông báo mới
            </Button>
          )}
        </Space>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Chưa đọc trong hộp thư"
              value={unreadQuery.data ?? "—"}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Chế độ đang xem"
              value={activeTab === "inbox" ? "Hộp thư cá nhân" : "Quản trị phát tin"}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Quyền phát thông báo"
              value={canCreateAdmin ? "Được cấp" : "Chỉ nhận tin"}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card className="admin-table-card">
        {showAdminTab ? (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              void setUrl({
                tab: key === "manage" ? "manage" : "inbox",
                page: 1,
                search: "",
              });
            }}
            items={[
              {
                key: "inbox",
                label: (
                  <Space size={8}>
                    <InboxOutlined />
                    <span>Hộp thư của tôi</span>
                    {(unreadQuery.data ?? 0) > 0 && (
                      <Badge count={unreadQuery.data} size="small" />
                    )}
                  </Space>
                ),
                children: (
                  <PersonalInboxSection
                    page={url.page}
                    limit={url.limit}
                    state={url.state}
                    search={url.search}
                    unreadCount={unreadQuery.data ?? 0}
                    onUpdateUrl={(patch) => void setUrl(patch)}
                  />
                ),
              },
              {
                key: "manage",
                label: (
                  <Space size={8}>
                    <SendOutlined />
                    <span>Quản trị phát thông báo</span>
                  </Space>
                ),
                children: (
                  <AdminBroadcastSection
                    page={url.page}
                    limit={url.limit}
                    search={url.search}
                    canRead={canReadAdmin}
                    canCreate={canCreateAdmin}
                    canUpdate={canUpdateAdmin}
                    canDelete={canDeleteAdmin}
                    onUpdateUrl={(patch) => void setUrl(patch)}
                    onOpenCreate={() => setEditor({})}
                    onOpenEdit={(id) => setEditor({ id })}
                    onOpenDetail={(item) => setDetailItem(item)}
                  />
                ),
              },
            ]}
          />
        ) : (
          <PersonalInboxSection
            page={url.page}
            limit={url.limit}
            state={url.state}
            search={url.search}
            unreadCount={unreadQuery.data ?? 0}
            onUpdateUrl={(patch) => void setUrl(patch)}
          />
        )}
      </Card>

      {editor && (
        <NotificationEditor id={editor.id} onClose={() => setEditor(null)} />
      )}

      {detailItem && (
        <Drawer
          open
          size={580}
          title="Chi tiết thông báo đã phát"
          onClose={() => setDetailItem(null)}
        >
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="blue">{detailItem.type}</Tag>
              <Tag color={detailItem.priority >= 8 ? "red" : detailItem.priority >= 5 ? "gold" : "default"}>
                Độ ưu tiên: {detailItem.priority}
              </Tag>
              {detailItem.recipientCount !== undefined && (
                <Tag>{detailItem.recipientCount} người nhận</Tag>
              )}
            </Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {detailItem.title}
            </Typography.Title>
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
              {detailItem.body}
            </Typography.Paragraph>
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: "actionUrl",
                  label: "Đường dẫn điều hướng",
                  children: detailItem.actionUrl || "—",
                },
                {
                  key: "scheduledAt",
                  label: "Lịch hiển thị",
                  children: detailItem.scheduledAt
                    ? new Date(detailItem.scheduledAt).toLocaleString("vi-VN")
                    : "Gửi ngay lập tức",
                },
                {
                  key: "expiresAt",
                  label: "Thời điểm hết hạn",
                  children: detailItem.expiresAt
                    ? new Date(detailItem.expiresAt).toLocaleString("vi-VN")
                    : "Không giới hạn",
                },
                {
                  key: "createdAt",
                  label: "Ngày tạo",
                  children: new Date(detailItem.createdAt).toLocaleString("vi-VN"),
                },
              ]}
            />
          </Space>
        </Drawer>
      )}
    </Flex>
  );
}

// ============================================================================
// 1. HỘP THƯ CÁ NHÂN (INBOX)
// ============================================================================

function PersonalInboxSection({
  page,
  limit,
  state,
  search,
  unreadCount,
  onUpdateUrl,
}: {
  page: number;
  limit: number;
  state: NotificationInboxState;
  search: string;
  unreadCount: number;
  onUpdateUrl: (patch: Record<string, unknown>) => void;
}) {
  const { message } = App.useApp();
  const query = useMyNotifications({ page, limit, state, search });
  const stateMutation = useNotificationStateMutation();
  const readAllMutation = useMarkAllNotificationsReadMutation();
  const items = query.data?.items ?? [];

  async function handleReadAll() {
    const res = await readAllMutation.mutateAsync();
    void message.success(
      res.affectedCount
        ? `Đã đánh dấu đọc ${res.affectedCount} thông báo.`
        : "Tất cả thông báo đã được đọc.",
    );
  }

  return (
    <Flex vertical gap={18}>
      <Flex wrap justify="space-between" align="center" gap={12}>
        <Space wrap>
          <Segmented
            aria-label="Bộ lọc trạng thái hộp thư"
            value={state}
            options={[
              { value: "all", label: "Hộp thư đến" },
              {
                value: "unread",
                label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
              },
              { value: "archived", label: "Đã lưu trữ" },
            ]}
            onChange={(val) => onUpdateUrl({ state: val, page: 1 })}
          />
          <Tag>{query.data?.meta.total ?? 0} thông báo</Tag>
        </Space>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            aria-label="Tải lại hộp thư"
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          />
          {state !== "archived" && unreadCount > 0 && (
            <Button
              icon={<CheckCircleOutlined />}
              loading={readAllMutation.isPending}
              onClick={() => void handleReadAll()}
            >
              Đánh dấu đọc tất cả
            </Button>
          )}
        </Space>
      </Flex>

      <DebouncedSearch
        value={search}
        aria-label="Tìm kiếm thông báo trong hộp thư"
        placeholder="Tìm theo tiêu đề thông báo…"
        allowClear
        maxLength={255}
        style={{ maxWidth: 360 }}
        onSearch={(val) => onUpdateUrl({ search: val, page: 1 })}
      />

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            search
              ? "Không tìm thấy thông báo phù hợp."
              : state === "unread"
                ? "Bạn đã đọc hết mọi thông báo mới."
                : state === "archived"
                  ? "Chưa có thông báo nào trong mục lưu trữ."
                  : "Hộp thư của bạn hiện đang trống."
          }
        />
      ) : (
        <Flex vertical gap={12}>
          {items.map((item) => (
            <InboxCard
              key={item.id}
              item={item}
              busy={stateMutation.isPending}
              onAction={async (action) => {
                await stateMutation.mutateAsync({ id: item.id, action });
              }}
            />
          ))}
          {(query.data?.meta.total ?? 0) > limit && (
            <Flex justify="end" style={{ marginTop: 8 }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={query.data?.meta.total ?? 0}
                showSizeChanger
                pageSizeOptions={[10, 20, 50]}
                onChange={(nextPage, nextLimit) =>
                  onUpdateUrl({
                    page: nextLimit !== limit ? 1 : nextPage,
                    limit: nextLimit,
                  })
                }
              />
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  );
}

function InboxCard({
  item,
  busy,
  onAction,
}: {
  item: UserNotificationItem;
  busy: boolean;
  onAction: (action: "read" | "unread" | "archive" | "unarchive") => Promise<void>;
}) {
  const { notification } = item;
  const isInternalLink =
    notification.actionUrl && notification.actionUrl.startsWith("/");

  return (
    <div
      className={
        "notification-inbox-item" +
        (!item.isRead ? " notification-inbox-unread" : "")
      }
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <Space wrap size={8} align="center">
          {!item.isRead && (
            <span className="notification-unread-dot" aria-label="Chưa đọc" />
          )}
          <Typography.Text strong style={{ fontSize: 15 }}>
            {notification.title}
          </Typography.Text>
          <Tag color="blue">{notification.type}</Tag>
          {notification.priority >= 8 && <Tag color="red">Quan trọng</Tag>}
        </Space>
        <p className="notification-body-text">{notification.body}</p>
        <div className="notification-meta-row">
          <span>{new Date(notification.createdAt).toLocaleString("vi-VN")}</span>
          {notification.actionUrl &&
            (isInternalLink ? (
              <Link
                href={notification.actionUrl}
                onClick={() => {
                  if (!item.isRead) void onAction("read");
                }}
              >
                <LinkOutlined /> Xem chi tiết liên kết
              </Link>
            ) : (
              <a
                href={notification.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!item.isRead) void onAction("read");
                }}
              >
                <LinkOutlined /> Mở liên kết
              </a>
            ))}
        </div>
      </div>

      <Space wrap size={6}>
        {item.isRead ? (
          <Button
            size="small"
            type="text"
            disabled={busy}
            onClick={() => void onAction("unread")}
          >
            Đánh dấu chưa đọc
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<CheckOutlined />}
            disabled={busy}
            onClick={() => void onAction("read")}
          >
            Đã đọc
          </Button>
        )}
        {item.isArchived ? (
          <Button
            size="small"
            icon={<FolderOpenOutlined />}
            disabled={busy}
            onClick={() => void onAction("unarchive")}
          >
            Bỏ lưu trữ
          </Button>
        ) : (
          <Button
            size="small"
            type="text"
            icon={<FolderAddOutlined />}
            disabled={busy}
            onClick={() => void onAction("archive")}
          >
            Lưu trữ
          </Button>
        )}
      </Space>
    </div>
  );
}

// ============================================================================
// 2. QUẢN TRỊ PHÁT THÔNG BÁO (ADMIN BROADCAST)
// ============================================================================

function AdminBroadcastSection({
  page,
  limit,
  search,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  onUpdateUrl,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
}: {
  page: number;
  limit: number;
  search: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onUpdateUrl: (patch: Record<string, unknown>) => void;
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onOpenDetail: (item: NotificationContent) => void;
}) {
  const { modal, message } = App.useApp();
  const query = useAdminNotifications({ page, limit, search }, canRead);
  const deleteMutation = useDeleteNotificationMutation();

  if (!canRead) {
    return (
      <Alert
        type="info"
        showIcon
        title="Bạn có quyền tạo thông báo mới nhưng chưa có quyền xem danh sách lịch sử thông báo đã phát (`notifications.read`)."
        action={
          canCreate ? (
            <Button type="primary" size="small" onClick={onOpenCreate}>
              Phát thông báo
            </Button>
          ) : undefined
        }
      />
    );
  }

  function confirmDelete(item: NotificationContent) {
    modal.confirm({
      title: `Thu hồi & Xóa vĩnh viễn thông báo "${item.title}"?`,
      content:
        "Thông báo này sẽ bị xóa vĩnh viễn khỏi hệ thống và biến mất khỏi hộp thư của toàn bộ người nhận.",
      okText: "Xóa vĩnh viễn",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteMutation.mutateAsync(item.id);
        void message.success("Đã xóa vĩnh viễn thông báo.");
      },
    });
  }

  const columns: TableColumnsType<NotificationContent> = [
    {
      title: "Thông báo đã phát",
      key: "title",
      width: 300,
      render: (_, item) => (
        <div className="admin-identity">
          <Button
            type="link"
            className="admin-name"
            onClick={() => onOpenDetail(item)}
          >
            {item.title}
          </Button>
          <Typography.Paragraph
            type="secondary"
            ellipsis={{ rows: 1 }}
            style={{ margin: 0, fontSize: 12 }}
          >
            {item.body}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: "Loại & Ưu tiên",
      key: "type",
      width: 180,
      render: (_, item) => (
        <Space wrap size={4}>
          <Tag color="blue">{item.type}</Tag>
          <Tag color={item.priority >= 8 ? "red" : item.priority >= 5 ? "gold" : "default"}>
            Mức {item.priority}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Người nhận",
      key: "recipients",
      width: 140,
      render: (_, item) => (
        <Tag>{item.recipientCount ?? 0} tài khoản</Tag>
      ),
    },
    {
      title: "Lịch gửi / Hết hạn",
      key: "schedule",
      width: 210,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text style={{ fontSize: 12 }}>
            Gửi:{" "}
            {item.scheduledAt
              ? new Date(item.scheduledAt).toLocaleString("vi-VN")
              : "Ngay lập tức"}
          </Typography.Text>
          {item.expiresAt && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Hết hạn: {new Date(item.expiresAt).toLocaleString("vi-VN")}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, item) => (
        <Space size={4}>
          {canUpdate && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label={`Sửa ${item.title}`}
              onClick={() => onOpenEdit(item.id)}
            />
          )}
          {canDelete && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              aria-label={`Xóa ${item.title}`}
              onClick={() => confirmDelete(item)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex wrap justify="space-between" align="center" gap={12}>
        <DebouncedSearch
          value={search}
          aria-label="Tìm thông báo đã phát"
          placeholder="Tìm theo tiêu đề thông báo…"
          allowClear
          maxLength={255}
          style={{ maxWidth: 360 }}
          onSearch={(val) => onUpdateUrl({ search: val, page: 1 })}
        />
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          />
          {canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
              Phát thông báo
            </Button>
          )}
        </Space>
      </Flex>

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Table<NotificationContent>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.items ?? []}
          loading={query.isFetching}
          scroll={{ x: 860 }}
          locale={{ emptyText: emptyAdmin }}
          pagination={{
            current: page,
            pageSize: limit,
            total: query.data?.meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (nextPage, nextLimit) =>
              onUpdateUrl({
                page: nextLimit !== limit ? 1 : nextPage,
                limit: nextLimit,
              }),
          }}
        />
      )}
    </Flex>
  );
}
