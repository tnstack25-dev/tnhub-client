"use client";
import { Col, Form, Input, Row, Select } from "antd";
import { useAdminList } from "@/lib/admin/admin-queries";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { saveWebsite } from "../websites-api";
import type { Website } from "../websites-types";

type ProjectOptionItem = { id: string; code: string; name: string };

function WebsiteFields({ id }: { id?: string }) {
  const profile = useWorkspaceProfile();
  const projects = useAdminList<ProjectOptionItem>(
    "projects",
    { page: 1, limit: 100 },
    !id && allowed(profile.data, "projects.read"),
    false,
  );
  return (
    <>
      {!id && (
        <Form.Item
          name="projectId"
          label="Dự án liên kết"
          rules={[{ required: true, message: "Vui lòng chọn hoặc nhập UUID dự án." }]}
        >
          {projects.data?.items.length ? (
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn dự án…"
              options={projects.data.items.map((p) => ({
                value: p.id,
                label: `${p.code} — ${p.name}`,
              }))}
            />
          ) : (
            <Input placeholder="UUID dự án (ví dụ: 6f0b3f3f-a8ec-4c23-a511-55985f3de0a0)" />
          )}
        </Form.Item>
      )}
      <Form.Item
        name="displayName"
        label="Tên hiển thị website"
        rules={[
          { required: true, whitespace: true, message: "Vui lòng nhập tên hiển thị." },
          { max: 200 },
        ]}
      >
        <Input maxLength={200} placeholder="Ví dụ: Website giới thiệu doanh nghiệp" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item name="domainName" label="Tên miền (Domain)" rules={[{ max: 255 }]}>
            <Input maxLength={255} placeholder="example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="serverIp" label="IP máy chủ">
            <Input maxLength={45} placeholder="192.0.2.10" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="productionUrl"
            label="Production URL"
            rules={[{ pattern: /^https?:\/\/.+/i, message: "Cần bắt đầu bằng http(s)://" }]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="stagingUrl"
            label="Staging URL"
            rules={[{ pattern: /^https?:\/\/.+/i, message: "Cần bắt đầu bằng http(s)://" }]}
          >
            <Input placeholder="https://staging.example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="cms" label="CMS" rules={[{ max: 80 }]}>
            <Input maxLength={80} placeholder="WordPress, Strapi…" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="framework" label="Framework" rules={[{ max: 100 }]}>
            <Input maxLength={100} placeholder="Next.js, NestJS…" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="hostingProvider" label="Nhà cung cấp Hosting" rules={[{ max: 150 }]}>
            <Input maxLength={150} placeholder="Cloudflare, AWS, Viettel…" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="domainExpiresOn" label="Ngày hết hạn Domain">
            <Input type="date" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="hostingExpiresOn" label="Ngày hết hạn Hosting">
            <Input type="date" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="repositoryUrl"
        label="Repository URL"
        rules={[{ pattern: /^https?:\/\/.+/i, message: "Cần bắt đầu bằng http(s)://" }]}
      >
        <Input placeholder="https://github.com/org/repo" />
      </Form.Item>
      <Form.Item name="notes" label="Ghi chú kỹ thuật">
        <Input.TextArea rows={3} maxLength={4000} showCount placeholder="Thông tin cấu hình, lưu ý triển khai…" />
      </Form.Item>
    </>
  );
}

export function WebsiteEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  return (
    <ResourceEditor<Website>
      resource="websites"
      id={id}
      title={id ? "Chỉnh sửa thông tin website" : "Thêm website dự án"}
      save={saveWebsite}
      onClose={onClose}
      initialValues={(item) =>
        item
          ? {
              displayName: item.displayName,
              domainName: item.domainName ?? "",
              productionUrl: item.productionUrl ?? "",
              stagingUrl: item.stagingUrl ?? "",
              repositoryUrl: item.repositoryUrl ?? "",
              cms: item.cms ?? "",
              framework: item.framework ?? "",
              hostingProvider: item.hostingProvider ?? "",
              serverIp: item.serverIp ?? "",
              domainExpiresOn: item.domainExpiresOn?.slice(0, 10) ?? "",
              hostingExpiresOn: item.hostingExpiresOn?.slice(0, 10) ?? "",
              notes: item.notes ?? "",
            }
          : {}
      }
    >
      <WebsiteFields id={id} />
    </ResourceEditor>
  );
}
