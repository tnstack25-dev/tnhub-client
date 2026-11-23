"use client";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Typography,
} from "antd";
import { saveCatalog } from "../catalog-api";
import { useAdminDetail, useRefreshAdmin } from "@/lib/admin/admin-queries";
import { type Role } from "@/features/roles/roles-types";
import { type Permission } from "@/features/permissions/permissions-types";
import { LoadError, useDrawerGuard } from "@/components/admin/admin-ui";
export type CatalogResource = "roles" | "permissions";
type Props = { resource: CatalogResource; id?: string; onClose: () => void };
export function CatalogEditor(props: Props) {
  const guard = useDrawerGuard(props.onClose);
  const detail = useAdminDetail<Role | Permission>(
    props.resource,
    props.id ?? "",
    Boolean(props.id),
  );
  return (
    <Drawer
      open
      size={560}
      title={
        (props.id ? "Chỉnh sửa " : "Tạo ") +
        (props.resource === "roles" ? "vai trò" : "quyền")
      }
      onClose={guard.requestClose}
      destroyOnHidden
    >
      {props.id && detail.isError ? (
        <LoadError error={detail.error} retry={() => void detail.refetch()} />
      ) : props.id && !detail.data ? (
        <Skeleton active />
      ) : (
        <EditorForm key={props.id ?? "new"} {...props} item={detail.data} guard={guard} />
      )}
    </Drawer>
  );
}
function EditorForm({
  resource,
  id,
  item,
  onClose,
  guard,
}: Props & { item?: Role | Permission; guard: ReturnType<typeof useDrawerGuard> }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const refresh = useRefreshAdmin(resource);
  const role = resource === "roles";
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: (values: Record<string, unknown>) => saveCatalog(resource, values, id),
    onSuccess: async () => {
      onClose();
      void message.success(id ? "Đã lưu thay đổi." : "Đã tạo thành công.");
      await refresh();
    },
  });
  const identifier = [
    { required: true, message: "Vui lòng nhập mã." },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: "Bắt đầu bằng chữ thường; chỉ dùng chữ thường, số và dấu gạch dưới.",
    },
  ];
  function close() {
    if (!mutation.isPending) guard.requestClose();
  }
  return (
    <Form
      form={form}
      onValuesChange={guard.markDirty}
      layout="vertical"
      initialValues={item ?? { status: "ACTIVE", priority: 100 }}
      onFinish={(values) => mutation.mutate(values)}
      disabled={mutation.isPending}
    >
      {item?.isSystem && (
        <Alert
          type="info"
          showIcon
          title="Mã định danh hệ thống được bảo vệ."
          style={{ marginBottom: 20 }}
        />
      )}
      {mutation.isError && (
        <Alert
          role="alert"
          type="error"
          showIcon
          title={mutation.error.message}
          style={{ marginBottom: 20 }}
        />
      )}
      {role ? (
        <>
          <Form.Item
            name="displayName"
            label="Tên vai trò"
            rules={[
              { required: true, whitespace: true, message: "Vui lòng nhập tên vai trò." },
              { max: 150 },
            ]}
          >
            <Input maxLength={150} placeholder="Ví dụ: Biên tập viên" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Mã vai trò"
            rules={identifier}
            extra="Mã duy nhất, ví dụ: content_editor"
          >
            <Input
              maxLength={100}
              disabled={item?.isSystem}
              placeholder="content_editor"
            />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Mức ưu tiên"
            rules={[{ required: true }, { type: "number", min: 0, max: 10000 }]}
            extra="Số càng nhỏ, cấp bậc càng cao. Bạn chỉ có thể quản lý vai trò thấp hơn mình."
          >
            <InputNumber min={0} max={10000} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name="module"
            label="Module"
            rules={identifier}
            extra="Ví dụ: orders, reports"
          >
            <Input maxLength={100} disabled={item?.isSystem} placeholder="reports" />
          </Form.Item>
          <Form.Item
            name="action"
            label="Hành động"
            rules={identifier}
            extra="Mã quyền được tạo từ module.action, ví dụ: reports.read"
          >
            <Input maxLength={100} disabled={item?.isSystem} placeholder="read" />
          </Form.Item>
          <Form.Item name="group" label="Nhóm hiển thị">
            <Input maxLength={100} placeholder="Ví dụ: Quản lý báo cáo" />
          </Form.Item>
        </>
      )}
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea
          rows={3}
          maxLength={2000}
          showCount
          placeholder="Mô tả phạm vi và mục đích sử dụng…"
        />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
        <Select
          options={[
            { value: "ACTIVE", label: "Hoạt động" },
            { value: "INACTIVE", label: "Tạm ngưng" },
          ]}
        />
      </Form.Item>
      {role && !id && (
        <Typography.Paragraph type="secondary">
          Sau khi tạo, chọn “Thiết lập quyền” để cấp quyền cho vai trò.
        </Typography.Paragraph>
      )}
      <Flex justify="end" gap={8} className="access-drawer-footer">
        <Button onClick={close}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          {id ? "Lưu thay đổi" : "Tạo mới"}
        </Button>
      </Flex>
    </Form>
  );
}
