"use client";
import "../clients.css";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { saveClientBatch } from "../clients-api";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { CLIENT_STATUS_OPTIONS, type Client } from "../clients-types";
import { useDrawerGuard } from "@/components/admin/admin-ui";

export function ClientBatch({
  items,
  onClose,
}: {
  items?: Client[];
  onClose: () => void;
}) {
  const guard = useDrawerGuard(onClose);
  const refresh = useRefreshAdmin("clients");
  const { message } = App.useApp();
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: (values: { items: Record<string, unknown>[] }) =>
      saveClientBatch(values, items),
    onSuccess: async (data) => {
      onClose();
      void message.success(
        data?.affectedCount !== undefined
          ? `Đã lưu ${data.affectedCount} khách hàng.`
          : "Đã lưu danh sách khách hàng.",
      );
      await refresh();
    },
  });

  return (
    <Drawer
      open
      size={920}
      title={items ? "Cập nhật khách hàng hàng loạt" : "Tạo nhiều khách hàng"}
      onClose={guard.requestClose}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={{
          items: items
            ? items.map((item) => ({
                name: item.name,
                clientType: item.clientType,
                status: item.status,
                email: item.email ?? "",
                phone: item.phone ?? "",
                taxCode: item.taxCode ?? "",
                source: item.source ?? "",
                websiteUrl: item.websiteUrl ?? "",
              }))
            : [{ clientType: "BUSINESS", status: "ACTIVE" }],
        }}
        disabled={mutation.isPending}
        onValuesChange={guard.markDirty}
        onFinish={(values) => mutation.mutate(values)}
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
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              {fields.map((field, index) => (
                <div key={field.key} className="admin-batch-row">
                  <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                    <strong>Khách hàng {index + 1}</strong>
                    {!items && fields.length > 1 && (
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        Bỏ dòng
                      </Button>
                    )}
                  </Flex>
                  <Flex wrap gap={16}>
                    <Form.Item
                      name={[field.name, "name"]}
                      label="Tên khách hàng"
                      rules={[{ required: true, whitespace: true, message: "Nhập tên." }]}
                      style={{ flex: "2 1 240px" }}
                    >
                      <Input maxLength={255} placeholder="Tên doanh nghiệp / cá nhân" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "clientType"]}
                      label="Phân loại"
                      rules={[{ required: true }]}
                      style={{ flex: "1 1 150px" }}
                    >
                      <Select
                        options={[
                          { value: "BUSINESS", label: "Doanh nghiệp" },
                          { value: "INDIVIDUAL", label: "Cá nhân" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "status"]}
                      label="Trạng thái"
                      rules={[{ required: true }]}
                      style={{ flex: "1 1 150px" }}
                    >
                      <Select options={CLIENT_STATUS_OPTIONS} />
                    </Form.Item>
                  </Flex>
                  <Flex wrap gap={16}>
                    <Form.Item
                      name={[field.name, "email"]}
                      label="Email"
                      rules={[{ type: "email", message: "Email không hợp lệ." }]}
                      style={{ flex: "1 1 200px", marginBottom: 0 }}
                    >
                      <Input maxLength={255} placeholder="contact@company.vn" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "phone"]}
                      label="Điện thoại"
                      style={{ flex: "1 1 150px", marginBottom: 0 }}
                    >
                      <Input maxLength={30} placeholder="0901 234 567" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "taxCode"]}
                      label="Mã số thuế"
                      style={{ flex: "1 1 140px", marginBottom: 0 }}
                    >
                      <Input maxLength={50} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "source"]}
                      label="Nguồn"
                      style={{ flex: "1 1 140px", marginBottom: 0 }}
                    >
                      <Input maxLength={100} placeholder="referral, web…" />
                    </Form.Item>
                  </Flex>
                </div>
              ))}
              {!items && (
                <Button
                  icon={<PlusOutlined />}
                  disabled={fields.length >= 100}
                  onClick={() => add({ clientType: "BUSINESS", status: "ACTIVE" })}
                >
                  Thêm khách hàng ({fields.length}/100)
                </Button>
              )}
            </Space>
          )}
        </Form.List>
        <Flex justify="end" gap={8} className="access-drawer-footer">
          <Button onClick={guard.requestClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Lưu danh sách
          </Button>
        </Flex>
      </Form>
    </Drawer>
  );
}
