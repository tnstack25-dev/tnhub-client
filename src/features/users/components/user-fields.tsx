"use client";
import { Flex, Form, Input, Select, Switch } from "antd";

export function UserFields({ id }: { id?: string }) {
  return (<>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: "email", message: "Email không hợp lệ." },
              { max: 255 },
            ]}
          >
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item name="fullName" label="Họ và tên">
            <Input maxLength={150} />
          </Form.Item>
          <Flex gap={16}>
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                {
                  pattern: /^[a-zA-Z0-9._-]{3,50}$/,
                  message: "3–50 ký tự: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.",
                },
              ]}
              style={{ flex: 1 }}
            >
              <Input maxLength={50} />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { pattern: /^\+?[0-9]{8,20}$/, message: "Số điện thoại không hợp lệ." },
              ]}
              style={{ flex: 1 }}
            >
              <Input maxLength={20} />
            </Form.Item>
          </Flex>
          {!id && (
            <Form.Item name="authProvider" label="Phương thức đăng nhập">
              <Select
                options={[
                  { value: "LOCAL", label: "Email và mật khẩu" },
                  { value: "GOOGLE", label: "Google" },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item noStyle shouldUpdate={(a, b) => a.authProvider !== b.authProvider}>
            {({ getFieldValue }) =>
              (id || getFieldValue("authProvider") === "LOCAL") && (
                <Form.Item
                  name="password"
                  label={id ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu khởi tạo"}
                  rules={[
                    { required: !id, message: "Vui lòng nhập mật khẩu." },
                    {
                      pattern:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/,
                      message:
                        "12–72 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
                    },
                  ]}
                  extra={
                    id
                      ? "Để trống nếu không đổi mật khẩu. Thay đổi sẽ đóng các phiên đăng nhập của người dùng."
                      : undefined
                  }
                >
                  <Input.Password autoComplete="new-password" maxLength={72} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Flex gap={16}>
            <Form.Item name="dateOfBirth" label="Ngày sinh" style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="gender" label="Giới tính" style={{ flex: 1 }}>
              <Select
                allowClear
                options={[
                  { value: "MALE", label: "Nam" },
                  { value: "FEMALE", label: "Nữ" },
                  { value: "OTHER", label: "Khác" },
                ]}
              />
            </Form.Item>
          </Flex>
          <Form.Item
            name="avatarUrl"
            label="URL ảnh đại diện"
            rules={[{ type: "url", message: "URL không hợp lệ." }]}
          >
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                "ACTIVE",
                "INACTIVE",
                "BLOCKED",
                "SUSPENDED",
                "PENDING_VERIFICATION",
              ].map((value, i) => ({
                value,
                label: ["Hoạt động", "Tạm ngưng", "Bị chặn", "Đình chỉ", "Chờ xác minh"][
                  i
                ],
              }))}
            />
          </Form.Item>
          <Form.Item name="isVerified" label="Đã xác minh email" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>);
}
