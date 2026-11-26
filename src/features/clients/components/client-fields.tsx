"use client";
import { Col, Form, Input, Row, Select } from "antd";
import { CLIENT_STATUS_OPTIONS } from "../clients-types";

export function ClientFields() {
  return (
    <>
      <Form.Item
        name="name"
        label="Tên khách hàng / Công ty"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập tên khách hàng." },
          { max: 255 },
        ]}
      >
        <Input maxLength={255} placeholder="Ví dụ: Công ty TNHH TN Agency" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="clientType"
            label="Phân loại"
            rules={[{ required: true, message: "Vui lòng chọn phân loại." }]}
          >
            <Select
              options={[
                { value: "BUSINESS", label: "Doanh nghiệp" },
                { value: "INDIVIDUAL", label: "Cá nhân" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái." }]}
          >
            <Select options={CLIENT_STATUS_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: "email", message: "Email không hợp lệ." },
              { max: 255 },
            ]}
          >
            <Input maxLength={255} placeholder="contact@company.vn" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ max: 30, message: "Số điện thoại tối đa 30 ký tự." }]}
          >
            <Input maxLength={30} placeholder="0901 234 567" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="taxCode"
            label="Mã số thuế"
            rules={[{ max: 50, message: "Mã số thuế tối đa 50 ký tự." }]}
          >
            <Input maxLength={50} placeholder="0101234567" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="source"
            label="Nguồn khách hàng"
            rules={[{ max: 100, message: "Nguồn tối đa 100 ký tự." }]}
          >
            <Input maxLength={100} placeholder="Ví dụ: referral, website, facebook" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="websiteUrl"
        label="Website"
        rules={[
          {
            pattern: /^https?:\/\/.+/i,
            message: "Website phải bắt đầu bằng http:// hoặc https://",
          },
        ]}
      >
        <Input placeholder="https://example.com" />
      </Form.Item>
      <Form.Item name="address" label="Địa chỉ">
        <Input.TextArea rows={2} placeholder="Địa chỉ trụ sở hoặc nơi liên hệ…" />
      </Form.Item>
      <Form.Item name="notes" label="Ghi chú nội bộ">
        <Input.TextArea rows={3} placeholder="Ghi chú thêm về nhu cầu, đặc điểm khách hàng…" />
      </Form.Item>
    </>
  );
}
