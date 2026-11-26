"use client";
import {
  AutoComplete,
  Button,
  Col,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Space,
  Typography,
  Alert,
  App,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { LoadError, useDrawerGuard } from "@/components/admin/admin-ui";
import { useAdminList } from "@/lib/admin/admin-queries";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { queryKeys } from "@/lib/query-keys";
import type { Member } from "@/features/users/users-types";
import { getAdminNotification } from "../notifications-api";
import { useSaveNotificationMutation } from "../notifications-queries";
import {
  NOTIFICATION_TYPE_SUGGESTIONS,
  type NotificationContent,
} from "../notifications-types";

export function NotificationEditor({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) {
  const guard = useDrawerGuard(onClose);
  const detail = useQuery({
    queryKey: queryKeys.adminDetail("notifications", id ?? "", false),
    enabled: Boolean(id),
    staleTime: 0,
    queryFn: ({ signal }) => getAdminNotification(id!, signal),
  });

  return (
    <Drawer
      open
      size={640}
      title={id ? "Chỉnh sửa thông báo đã phát" : "Tạo & Phát thông báo mới"}
      onClose={guard.requestClose}
      destroyOnHidden
    >
      {id && detail.isError ? (
        <LoadError error={detail.error} retry={() => void detail.refetch()} />
      ) : id && !detail.data ? (
        <Skeleton active />
      ) : (
        <NotificationEditorForm
          key={id ?? "new"}
          id={id}
          item={detail.data}
          guard={guard}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}

function NotificationEditorForm({
  id,
  item,
  guard,
  onClose,
}: {
  id?: string;
  item?: NotificationContent;
  guard: ReturnType<typeof useDrawerGuard>;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const mutation = useSaveNotificationMutation();

  const users = useAdminList<Member>(
    "users",
    { page: 1, limit: 100, status: "ACTIVE" },
    !id && allowed(profile.data, "users.read"),
    false,
  );

  const toDatetimeLocal = (iso: string | null | undefined) => {
    if (!iso || Number.isNaN(Date.parse(iso))) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  };

  const activeUserIds = (users.data?.items ?? []).map((u) => u.id);

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={guard.markDirty}
      disabled={mutation.isPending}
      initialValues={
        item
          ? {
              type: item.type,
              title: item.title,
              body: item.body,
              priority: item.priority,
              actionUrl: item.actionUrl ?? "",
              imageUrl: item.imageUrl ?? "",
              scheduledAt: toDatetimeLocal(item.scheduledAt),
              expiresAt: toDatetimeLocal(item.expiresAt),
            }
          : {
              type: "SYSTEM",
              priority: 5,
              userIds: profile.data?.id ? [profile.data.id] : [],
            }
      }
      onFinish={async (values) => {
        guard.markSaving(true);
        try {
          await mutation.mutateAsync({ values, id });
          void message.success(
            id ? "Đã cập nhật nội dung thông báo." : "Đã phát thông báo tới người nhận.",
          );
          onClose();
        } finally {
          guard.markSaving(false);
        }
      }}
    >
      {mutation.isError && (
        <Alert
          role="alert"
          type="error"
          showIcon
          title={mutation.error.message}
          style={{ marginBottom: 16 }}
        />
      )}

      {!id && (
        <Form.Item
          name="userIds"
          label={
            <Space size={8}>
              <span>Người nhận thông báo (Tối đa 500 tài khoản đang hoạt động)</span>
              {activeUserIds.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto" }}
                  onClick={() => {
                    guard.markDirty();
                    form.setFieldValue("userIds", activeUserIds);
                  }}
                >
                  Chọn tất cả ({activeUserIds.length})
                </Button>
              )}
            </Space>
          }
          rules={[
            {
              required: true,
              type: "array",
              min: 1,
              message: "Vui lòng chọn ít nhất một người nhận.",
            },
          ]}
        >
          {users.data?.items.length ? (
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Chọn người dùng nhận thông báo…"
              options={users.data.items.map((u) => ({
                value: u.id,
                label: `${u.fullName || u.email} (${u.email})`,
              }))}
            />
          ) : (
            <Select
              mode="tags"
              placeholder="Nhập UUID người nhận (nhấn Enter sau mỗi ID)…"
              options={
                profile.data?.id
                  ? [
                      {
                        value: profile.data.id,
                        label: `Chính tôi (${profile.data.email})`,
                      },
                    ]
                  : []
              }
            />
          )}
        </Form.Item>
      )}

      {id && (
        <Alert
          type="info"
          showIcon
          title="Cập nhật nội dung hoặc lịch hiển thị sẽ áp dụng cho tất cả người nhận hiện tại và giữ nguyên trạng thái đã đọc/lưu trữ."
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} sm={14}>
          <Form.Item
            name="type"
            label="Phân loại thông báo (Mã IN_HOA)"
            rules={[
              { required: true, message: "Vui lòng nhập mã loại thông báo." },
              {
                pattern: /^[A-Z][A-Z0-9_]*$/,
                message: "Bắt đầu bằng chữ hoa; chỉ dùng chữ hoa, số và dấu gạch dưới (_).",
              },
            ]}
          >
            <AutoComplete
              options={[...NOTIFICATION_TYPE_SUGGESTIONS]}
              placeholder="SYSTEM, PROJECT_UPDATE…"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item
            name="priority"
            label="Độ ưu tiên (0 – 10)"
            rules={[{ required: true }]}
            extra="Số lớn hơn được ưu tiên hiển thị lên đầu hộp thư."
          >
            <InputNumber min={0} max={10} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="title"
        label="Tiêu đề thông báo"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập tiêu đề." },
          { max: 255 },
        ]}
      >
        <Input maxLength={255} placeholder="Ví dụ: Bảo trì định kỳ hệ thống tối thứ Bảy" />
      </Form.Item>

      <Form.Item
        name="body"
        label="Nội dung chi tiết"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập nội dung." },
          { max: 10000 },
        ]}
      >
        <Input.TextArea
          rows={4}
          maxLength={10000}
          showCount
          placeholder="Nhập nội dung thông báo gửi đến hộp thư người dùng…"
        />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="actionUrl"
            label="Đường dẫn điều hướng (Tùy chọn)"
            rules={[
              {
                pattern: /^(\/[^/\\]|\/$|https:\/\/)/,
                message: "Dùng đường dẫn nội bộ (/projects) hoặc https://...",
              },
            ]}
          >
            <Input placeholder="/projects hoặc https://example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="imageUrl"
            label="Ảnh minh họa HTTPS (Tùy chọn)"
            rules={[
              {
                pattern: /^https:\/\/.+/,
                message: "Ảnh minh họa phải bắt đầu bằng https://",
              },
            ]}
          >
            <Input placeholder="https://res.cloudinary.com/..." />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="scheduledAt"
            label="Hẹn giờ hiển thị (Tùy chọn)"
            extra="Để trống nếu muốn gửi ngay lập tức."
          >
            <Input type="datetime-local" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="expiresAt"
            label="Thời điểm hết hạn (Tùy chọn)"
            extra="Phải sau thời điểm gửi/hẹn giờ."
          >
            <Input type="datetime-local" />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
        Mọi thao tác tạo và chỉnh sửa thông báo đều được ghi nhận vào nhật ký Audit hệ thống.
      </Typography.Paragraph>

      <Flex justify="end" gap={8} className="access-drawer-footer">
        <Button onClick={guard.requestClose}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {id ? "Lưu thay đổi" : "Phát thông báo"}
        </Button>
      </Flex>
    </Form>
  );
}
