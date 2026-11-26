"use client";
import { Col, Form, Input, InputNumber, Row, Select } from "antd";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { useAdminList } from "@/lib/admin/admin-queries";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import type { Client } from "@/features/clients/clients-types";
import type { Member } from "@/features/users/users-types";
import { saveProject } from "../projects-api";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type Project,
} from "../projects-types";

function ProjectFields({ id }: { id?: string }) {
  const profile = useWorkspaceProfile();
  const clients = useAdminList<Client>(
    "clients",
    { page: 1, limit: 100 },
    allowed(profile.data, "clients.read"),
    false,
  );
  const users = useAdminList<Member>(
    "users",
    { page: 1, limit: 100, status: "ACTIVE" },
    allowed(profile.data, "users.read"),
    false,
  );

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={10}>
          <Form.Item
            name="code"
            label="Mã dự án"
            rules={[
              { required: true, message: "Vui lòng nhập mã dự án." },
              {
                pattern: /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/,
                message: "Chỉ dùng chữ, số, gạch ngang (-) hoặc gạch dưới (_).",
              },
            ]}
          >
            <Input maxLength={40} disabled={Boolean(id)} placeholder="WEB-2026-001" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={14}>
          <Form.Item
            name="slug"
            label="Slug đường dẫn (Tùy chọn)"
            rules={[
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: "Chỉ dùng chữ thường, số và dấu gạch ngang (-).",
              },
            ]}
          >
            <Input maxLength={200} placeholder="website-gioi-thieu-doanh-nghiep" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="name"
        label="Tên dự án"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập tên dự án." },
          { max: 250 },
        ]}
      >
        <Input maxLength={250} placeholder="Ví dụ: Website giới thiệu doanh nghiệp TN Agency" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="clientId"
            label="Khách hàng"
            rules={[{ required: true, message: "Vui lòng chọn khách hàng." }]}
          >
            {clients.data?.items.length ? (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn khách hàng…"
                options={clients.data.items.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.taxCode ? ` (${c.taxCode})` : ""}`,
                }))}
              />
            ) : (
              <Input placeholder="UUID khách hàng" />
            )}
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="ownerId" label="Người phụ trách (PM / Owner)">
            {users.data?.items.length ? (
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Chọn người phụ trách…"
                options={users.data.items.map((u) => ({
                  value: u.id,
                  label: `${u.fullName || u.email} (${u.email})`,
                }))}
              />
            ) : (
              <Input placeholder="UUID người phụ trách (tùy chọn)" />
            )}
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="projectType"
            label="Loại dự án"
            rules={[{ required: true, message: "Vui lòng chọn loại dự án." }]}
          >
            <Select options={PROJECT_TYPE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true }]}>
            <Select options={PROJECT_PRIORITY_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={14}>
          <Form.Item name="budget" label="Ngân sách dự kiến">
            <InputNumber<string>
              stringMode
              min="0"
              max="9999999999999999.99"
              precision={2}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={10}>
          <Form.Item
            name="currency"
            label="Tiền tệ"
            rules={[{ pattern: /^[A-Z]{3}$/, message: "3 chữ cái in hoa (VND, USD)." }]}
          >
            <Select
              disabled={Boolean(id)}
              options={[
                { value: "VND", label: "VND (₫)" },
                { value: "USD", label: "USD ($)" },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="startDate" label="Ngày bắt đầu">
            <Input type="date" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="deadline" label="Hạn chót (Deadline)">
            <Input type="date" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="endDate" label="Ngày kết thúc">
            <Input type="date" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Mô tả phạm vi dự án">
        <Input.TextArea rows={3} maxLength={4000} showCount placeholder="Mục tiêu, phạm vi bàn giao và yêu cầu chính…" />
      </Form.Item>
    </>
  );
}

export function ProjectEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  return (
    <ResourceEditor<Project>
      resource="projects"
      id={id}
      title={id ? "Chỉnh sửa thông tin dự án" : "Khởi tạo dự án mới"}
      save={saveProject}
      onClose={onClose}
      initialValues={(item) =>
        item
          ? {
              code: item.code,
              slug: item.slug ?? "",
              name: item.name,
              clientId: item.clientId,
              ownerId: item.ownerId ?? undefined,
              projectType: item.projectType,
              priority: item.priority,
              budget: item.budget,
              currency: item.currency,
              startDate: item.startDate?.slice(0, 10) ?? "",
              deadline: item.deadline?.slice(0, 10) ?? "",
              endDate: item.endDate?.slice(0, 10) ?? "",
              description: item.description ?? "",
            }
          : {
              projectType: "WEB",
              priority: "MEDIUM",
              budget: "0.00",
              currency: "VND",
            }
      }
    >
      <ProjectFields id={id} />
    </ResourceEditor>
  );
}
