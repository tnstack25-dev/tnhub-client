"use client";
import { Form, Input, InputNumber, Select, Switch } from "antd";

export function ServiceFields({ id }: { id?: string }) {
  return (<>
          <Form.Item
            name="code"
            label="Mã dịch vụ"
            rules={[
              { required: true },
              {
                pattern: /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
                message: "Chỉ dùng chữ hoa, số và gạch dưới.",
              },
            ]}
          >
            <Input maxLength={40} disabled={!!id} />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
            <Select
              options={["WEB", "SEO", "OTHER"].map((value) => ({
                value,
                label: value === "OTHER" ? "Khác" : value,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="defaultPrice"
            label="Giá mặc định (VND)"
            rules={[{ required: true }]}
          >
            <InputNumber<string>
              stringMode
              min="0"
              max="9999999999999999.99"
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea maxLength={2000} rows={4} showCount />
          </Form.Item>
          {!id && (
            <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </>);
}
