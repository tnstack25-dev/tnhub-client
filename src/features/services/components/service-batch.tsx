"use client";
import "../services.css";
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
  Space,
  Switch,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { saveServiceBatch } from "../services-api";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { type Service } from "@/features/services/services-types";
import { useDrawerGuard } from "@/components/admin/admin-ui";
export function ServiceBatch({
  items,
  onClose,
}: {
  items?: Service[];
  onClose: () => void;
}) {
  const guard = useDrawerGuard(onClose);
  const refresh = useRefreshAdmin("services");
  const { message } = App.useApp();
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: (values: { items: Record<string, unknown>[] }) => saveServiceBatch(values, items),
    onSuccess: async () => {
      onClose();
      void message.success("Đã lưu danh sách dịch vụ.");
      await refresh();
    },
  });
  return (
    <Drawer
      open
      size={900}
      title={items ? "Cập nhật dịch vụ hàng loạt" : "Tạo nhiều dịch vụ"}
      onClose={guard.requestClose}
    >
      <Form
        layout="vertical"
        initialValues={{
          items: items ?? [{ category: "WEB", defaultPrice: "0", isActive: true }],
        }}
        disabled={mutation.isPending}
        onValuesChange={guard.markDirty}
        onFinish={(v) => mutation.mutate(v)}
      >
        {mutation.isError && (
          <Alert role="alert" type="error" showIcon title={mutation.error.message} />
        )}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              {fields.map((field, index) => (
                <div key={field.key} className="admin-batch-row">
                  <Flex justify="space-between" align="center">
                    <strong>Dịch vụ {index + 1}</strong>
                    {!items && fields.length > 1 && (
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        Bỏ dòng
                      </Button>
                    )}
                  </Flex>
                  <Flex wrap gap={16}>
                    <Form.Item
                      name={[field.name, "code"]}
                      label="Mã dịch vụ"
                      rules={[
                        { required: true },
                        {
                          pattern: /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
                          message: "Mã không hợp lệ.",
                        },
                      ]}
                      style={{ flex: "1 1 180px" }}
                    >
                      <Input maxLength={40} disabled={!!items} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "name"]}
                      label="Tên dịch vụ"
                      rules={[{ required: true, whitespace: true }]}
                      style={{ flex: "2 1 250px" }}
                    >
                      <Input maxLength={150} />
                    </Form.Item>
                  </Flex>
                  <Flex wrap gap={16}>
                    <Form.Item
                      name={[field.name, "category"]}
                      label="Danh mục"
                      rules={[{ required: true }]}
                      style={{ flex: 1 }}
                    >
                      <Select
                        options={["WEB", "SEO", "OTHER"].map((value) => ({
                          value,
                          label: value,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "defaultPrice"]}
                      label="Giá (VND)"
                      rules={[{ required: true }]}
                      style={{ flex: 1 }}
                    >
                      <InputNumber<string>
                        stringMode
                        min="0"
                        max="9999999999999999.99"
                        precision={2}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                    {!items && (
                      <Form.Item
                        name={[field.name, "isActive"]}
                        label="Hoạt động"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    )}
                  </Flex>
                  <Form.Item name={[field.name, "description"]} label="Mô tả">
                    <Input.TextArea rows={2} maxLength={2000} />
                  </Form.Item>
                </div>
              ))}
              {!items && (
                <Button
                  icon={<PlusOutlined />}
                  disabled={fields.length >= 100}
                  onClick={() =>
                    add({ category: "WEB", defaultPrice: "0", isActive: true })
                  }
                >
                  Thêm dịch vụ ({fields.length}/100)
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
