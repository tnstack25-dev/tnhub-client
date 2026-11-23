"use client";
import { Alert, Button, Col, Form, Input, Row, Select } from "antd";
import type { AuthProfile } from "@/lib/auth/contracts";
export function ProfileForm({ profile, saving, error, onSubmit }: {
  profile: AuthProfile;
  saving: boolean;
  error: Error | null;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  return (
    <Form
      layout="vertical"
      initialValues={{ fullName: profile.fullName, username: profile.username, phone: profile.phone,
        gender: profile.gender, dateOfBirth: profile.dateOfBirth?.slice(0, 10) }}
      onFinish={onSubmit}
      disabled={saving}
    >
      {Boolean(error) && (
        <Alert
          showIcon
          role="alert"
          type="error"
          title={error?.message}
          style={{ marginBottom: 20 }}
        />
      )}
      <Form.Item label="Email">
        <Input value={profile.email} disabled />
      </Form.Item>
      <Form.Item name="fullName" label="Họ và tên">
        <Input maxLength={150} />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              {
                pattern: /^[a-zA-Z0-9._-]{3,50}$/,
                message: "Tên đăng nhập cần 3–50 ký tự hợp lệ.",
              },
            ]}
          >
            <Input maxLength={50} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { pattern: /^\+?[0-9]{8,20}$/, message: "Số điện thoại không hợp lệ." },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <Input type="date" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              options={[
                { value: "MALE", label: "Nam" },
                { value: "FEMALE", label: "Nữ" },
                { value: "OTHER", label: "Khác" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" htmlType="submit" loading={saving}>
        Lưu hồ sơ
      </Button>
    </Form>
  );
}
