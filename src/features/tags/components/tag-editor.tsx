"use client";
import { PlusOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Alert, App, Button, Drawer, Flex, Form, Input, Space, Tag } from "antd";
import { useDrawerGuard } from "@/components/admin/admin-ui";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { useRefreshAdmin } from "@/lib/admin/admin-queries";
import { saveTag, saveTagBatch } from "../tags-api";
import { PRESET_TAG_COLORS, type ProjectTag } from "../tags-types";

function TagFields() {
  const form = Form.useFormInstance();
  const currentColor = Form.useWatch("color", form);
  return (
    <>
      <Form.Item
        name="name"
        label="Tên nhãn"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập tên nhãn." },
          { max: 100 },
        ]}
      >
        <Input maxLength={100} placeholder="Ví dụ: Ưu tiên cao, Sprint 1, Giao diện…" />
      </Form.Item>
      <Form.Item
        name="color"
        label="Mã màu (#RRGGBB)"
        rules={[
          {
            pattern: /^#[0-9A-Fa-f]{6}$/,
            message: "Mã màu cần đúng định dạng #RRGGBB (ví dụ: #2563EB).",
          },
        ]}
      >
        <Input maxLength={7} placeholder="#2563EB (Có thể để trống)" />
      </Form.Item>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--tn-muted)", marginBottom: 8 }}>
          Chọn nhanh màu sắc:
        </div>
        <Space wrap size={8}>
          {PRESET_TAG_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`Chọn màu ${hex}`}
              onClick={() => {
                form.setFieldValue("color", hex);
              }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border:
                  currentColor?.toUpperCase() === hex
                    ? "2px solid var(--tn-foreground)"
                    : "1px solid var(--tn-line)",
                background: hex,
                cursor: "pointer",
              }}
            />
          ))}
          <Button
            size="small"
            type="text"
            onClick={() => form.setFieldValue("color", "")}
          >
            Bỏ màu
          </Button>
        </Space>
      </div>
    </>
  );
}

export function TagEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  return (
    <ResourceEditor<ProjectTag>
      resource="tags"
      id={id}
      title={id ? "Chỉnh sửa nhãn dự án" : "Tạo nhãn dự án"}
      save={saveTag}
      onClose={onClose}
      initialValues={(item) =>
        item
          ? { name: item.name, color: item.color ?? "" }
          : { color: "#2563EB" }
      }
    >
      <TagFields />
    </ResourceEditor>
  );
}

export function TagBatch({
  items,
  onClose,
}: {
  items?: ProjectTag[];
  onClose: () => void;
}) {
  const guard = useDrawerGuard(onClose);
  const refresh = useRefreshAdmin("tags");
  const { message } = App.useApp();
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: (values: { items: Record<string, unknown>[] }) =>
      saveTagBatch(values, items),
    onSuccess: async (data) => {
      onClose();
      void message.success(
        data?.affectedCount !== undefined
          ? `Đã lưu ${data.affectedCount} nhãn.`
          : "Đã lưu danh sách nhãn.",
      );
      await refresh();
    },
  });

  return (
    <Drawer
      open
      size={720}
      title={items ? "Cập nhật nhãn hàng loạt" : "Tạo nhiều nhãn dự án"}
      onClose={guard.requestClose}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={{
          items: items
            ? items.map((item) => ({ name: item.name, color: item.color ?? "" }))
            : [{ color: "#2563EB" }],
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
            <Space orientation="vertical" size={14} style={{ width: "100%" }}>
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  style={{
                    padding: 16,
                    border: "1px solid var(--tn-line)",
                    borderRadius: 12,
                    background: "var(--tn-surface-muted)",
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Tag color="blue">Nhãn {index + 1}</Tag>
                    {!items && fields.length > 1 && (
                      <Button danger type="text" size="small" onClick={() => remove(field.name)}>
                        Bỏ dòng
                      </Button>
                    )}
                  </Flex>
                  <Flex wrap gap={12}>
                    <Form.Item
                      name={[field.name, "name"]}
                      label="Tên nhãn"
                      rules={[{ required: true, whitespace: true, message: "Nhập tên nhãn." }]}
                      style={{ flex: "2 1 220px", marginBottom: 0 }}
                    >
                      <Input maxLength={100} placeholder="Tên nhãn" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "color"]}
                      label="Mã màu (#RRGGBB)"
                      rules={[
                        {
                          pattern: /^#[0-9A-Fa-f]{6}$/,
                          message: "Mã màu #RRGGBB.",
                        },
                      ]}
                      style={{ flex: "1 1 140px", marginBottom: 0 }}
                    >
                      <Input maxLength={7} placeholder="#2563EB" />
                    </Form.Item>
                  </Flex>
                </div>
              ))}
              {!items && (
                <Button
                  icon={<PlusOutlined />}
                  disabled={fields.length >= 100}
                  onClick={() => add({ color: "#2563EB" })}
                >
                  Thêm nhãn ({fields.length}/100)
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
