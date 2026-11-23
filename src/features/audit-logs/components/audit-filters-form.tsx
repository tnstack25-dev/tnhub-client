"use client";
import "../audit-logs.css";
import { Button, Col, Form, Input, Row, Select, Space } from "antd";
import type { AuditFilterInput } from "@/lib/audit/filters";
export function AuditFiltersForm({ initialValues, onApply, onClear }: {
  initialValues: AuditFilterInput;
  onApply: (values: AuditFilterInput) => void;
  onClear: () => void;
}) {
  return (<Form initialValues={initialValues} layout="vertical" onFinish={onApply} className="audit-filters">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item name="eventType" label="Loại sự kiện">
                <Input
                  placeholder="Ví dụ: media.uploaded, AUTH_LOGIN…"
                  maxLength={100}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item name="severity" label="Mức độ">
                <Select
                  allowClear
                  placeholder="Tất cả mức độ"
                  options={[
                    { value: "INFO", label: "Thông tin" },
                    { value: "WARNING", label: "Cảnh báo" },
                    { value: "ERROR", label: "Lỗi" },
                    { value: "CRITICAL", label: "Nghiêm trọng" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item name="userId" label="ID người thực hiện">
                <Input placeholder="UUID người dùng" allowClear maxLength={36} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item name="fromLocal" label="Từ thời điểm">
                <Input type="datetime-local" step={1} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item name="toLocal" label="Đến thời điểm">
                <Input type="datetime-local" step={1} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Space className="audit-filter-actions">
                <Button type="primary" htmlType="submit">
                  Áp dụng bộ lọc
                </Button>
                <Button
                  onClick={onClear}
                >
                  Xóa bộ lọc
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>);
}
