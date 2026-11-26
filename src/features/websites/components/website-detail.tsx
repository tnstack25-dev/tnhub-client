"use client";
import { useState } from "react";
import Link from "next/link";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { EntityDetail } from "@/features/admin/components/entity-detail";
import { LoadError, StatusTag } from "@/components/admin/admin-ui";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { formatPrice } from "@/lib/admin/format";
import { queryKeys } from "@/lib/query-keys";
import {
  deleteWebsiteDeliverable,
  deleteWebsiteMaintenanceLog,
  getWebsiteDeliverable,
  getWebsiteMaintenanceLog,
  listWebsiteDeliverables,
  listWebsiteMaintenanceLogs,
  saveWebsiteDeliverable,
  saveWebsiteMaintenanceLog,
} from "../websites-api";
import {
  DELIVERABLE_CATEGORY_OPTIONS,
  DELIVERABLE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  type Website,
  type WebsiteDeliverable,
  type WebsiteMaintenanceLog,
} from "../websites-types";

const websiteDetailLabels: Record<string, string> = {
  domainName: "Tên miền",
  productionUrl: "Production URL",
  stagingUrl: "Staging URL",
  repositoryUrl: "Repository",
  cms: "CMS",
  framework: "Framework",
  hostingProvider: "Hosting Provider",
  serverIp: "IP máy chủ",
  domainExpiresOn: "Hết hạn Domain",
  hostingExpiresOn: "Hết hạn Hosting",
  launchedAt: "Ngày ra mắt (Live)",
  notes: "Ghi chú kỹ thuật",
  createdAt: "Ngày tạo",
  updatedAt: "Cập nhật lần cuối",
};

export function WebsiteDetail({
  id,
  trash,
  onClose,
}: {
  id: string;
  trash: boolean;
  onClose: () => void;
}) {
  const profile = useWorkspaceProfile();
  const canCreate = !trash && allowed(profile.data, "websites.create");
  const canUpdate = !trash && allowed(profile.data, "websites.update");
  const canDelete = !trash && allowed(profile.data, "websites.delete");

  return (
    <EntityDetail<Website>
      resource="websites"
      id={id}
      trash={trash}
      onClose={onClose}
      labels={websiteDetailLabels}
      getTitle={(item) => item.displayName}
      renderStatus={(item) => (
        <Space wrap>
          <StatusTag status={item.status} />
          {item.domainName && <Tag color="blue">{item.domainName}</Tag>}
          <Link href={`/projects/${item.projectId}`}>Mở không gian dự án →</Link>
        </Space>
      )}
      sections={[
        {
          title: "Bàn giao & Nhật ký bảo trì",
          render: (item) =>
            trash ? (
              <Alert
                type="warning"
                showIcon
                title="Website đang ở trong thùng rác. Khôi phục website để xem và quản lý hạng mục bàn giao, bảo trì."
              />
            ) : (
              <Tabs
                items={[
                  {
                    key: "deliverables",
                    label: "Hạng mục bàn giao",
                    children: (
                      <DeliverablesSection
                        websiteId={item.id}
                        canCreate={canCreate}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                      />
                    ),
                  },
                  {
                    key: "maintenance",
                    label: "Nhật ký bảo trì",
                    children: (
                      <MaintenanceLogsSection
                        websiteId={item.id}
                        canCreate={canCreate}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                      />
                    ),
                  },
                ]}
              />
            ),
        },
      ]}
    />
  );
}

function DeliverablesSection({
  websiteId,
  canCreate,
  canUpdate,
  canDelete,
}: {
  websiteId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const [editing, setEditing] = useState<WebsiteDeliverable | "new" | null>(null);
  const [viewingId, setViewingId] = useState<string>();
  const query = useQuery({
    queryKey: queryKeys.websiteSubList(websiteId, "deliverables"),
    queryFn: ({ signal }) => listWebsiteDeliverables(websiteId, { page: 1, limit: 50 }, signal),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.websiteSubList(websiteId, "deliverable-detail", { id: viewingId }),
    enabled: Boolean(viewingId),
    queryFn: ({ signal }) => getWebsiteDeliverable(websiteId, viewingId!, signal),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: queryKeys.websiteSubList(websiteId, "deliverables") });

  const saveMutation = useMutation({
    mutationFn: (input: { values: Record<string, unknown>; id?: string }) =>
      saveWebsiteDeliverable(websiteId, input.values, input.id),
    onSuccess: async () => {
      setEditing(null);
      void message.success("Đã lưu hạng mục bàn giao.");
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteWebsiteDeliverable(websiteId, itemId),
    onSuccess: async () => {
      void message.success("Đã xóa hạng mục bàn giao.");
      await refresh();
    },
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary">
          Tổng số: {query.data?.meta.total ?? 0} hạng mục
        </Typography.Text>
        {canCreate && editing === null && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setEditing("new")}
          >
            Thêm hạng mục
          </Button>
        )}
      </Flex>

      {(saveMutation.isError || deleteMutation.isError) && (
        <Alert
          type="error"
          showIcon
          title={saveMutation.error?.message || deleteMutation.error?.message}
        />
      )}

      {editing !== null && (
        <Card size="small">
          <Form
            layout="vertical"
            initialValues={
              editing === "new"
                ? { category: "OTHER", status: "TODO" }
                : {
                    title: editing.title,
                    category: editing.category,
                    status: editing.status,
                    dueDate: editing.dueDate?.slice(0, 10) ?? "",
                    notes: editing.notes ?? "",
                  }
            }
            disabled={saveMutation.isPending}
            onFinish={(values) =>
              saveMutation.mutate({
                values,
                id: editing === "new" ? undefined : editing.id,
              })
            }
          >
            <Form.Item
              name="title"
              label="Tên hạng mục bàn giao"
              rules={[{ required: true, whitespace: true, message: "Nhập tên hạng mục." }]}
            >
              <Input maxLength={250} placeholder="Ví dụ: Giao diện trang chủ, Tối ưu tốc độ…" />
            </Form.Item>
            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item name="category" label="Nhóm">
                  <Select options={DELIVERABLE_CATEGORY_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="status" label="Trạng thái">
                  <Select options={DELIVERABLE_STATUS_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="dueDate" label="Hạn bàn giao">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={2} maxLength={4000} />
            </Form.Item>
            <Flex justify="end" gap={8}>
              <Button onClick={() => setEditing(null)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                Lưu hạng mục
              </Button>
            </Flex>
          </Form>
        </Card>
      )}

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hạng mục bàn giao." />
      ) : (
        items.map((item) => (
          <Card key={item.id} size="small">
            <Flex justify="space-between" align="flex-start" gap={12}>
              <div>
                <Space wrap size={6}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Tag>{item.category}</Tag>
                  <StatusTag status={item.status} />
                </Space>
                {item.dueDate && (
                  <div style={{ fontSize: 12, color: "var(--tn-muted)", marginTop: 4 }}>
                    Hạn: {item.dueDate.slice(0, 10)}
                  </div>
                )}
                {item.notes && (
                  <Typography.Paragraph
                    type="secondary"
                    style={{ margin: "6px 0 0", fontSize: 12 }}
                  >
                    {item.notes}
                  </Typography.Paragraph>
                )}
              </div>
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  title="Xem chi tiết hạng mục"
                  aria-label={`Xem chi tiết ${item.title}`}
                  onClick={() => setViewingId(item.id)}
                />
                {canUpdate && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    aria-label={`Sửa ${item.title}`}
                    onClick={() => setEditing(item)}
                  />
                )}
                {canDelete && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label={`Xóa ${item.title}`}
                    onClick={() =>
                      modal.confirm({
                        title: `Xóa hạng mục "${item.title}"?`,
                        okText: "Xóa",
                        cancelText: "Hủy",
                        okButtonProps: { danger: true },
                        onOk: () => deleteMutation.mutateAsync(item.id),
                      })
                    }
                  />
                )}
              </Space>
            </Flex>
          </Card>
        ))
      )}

      {viewingId && (
        <Modal
          open
          title="Chi tiết hạng mục bàn giao"
          onCancel={() => setViewingId(undefined)}
          footer={
            <Button type="primary" onClick={() => setViewingId(undefined)}>
              Đóng
            </Button>
          }
          destroyOnHidden
        >
          {detailQuery.isError ? (
            <LoadError error={detailQuery.error} retry={() => void detailQuery.refetch()} />
          ) : detailQuery.isPending || !detailQuery.data ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                { key: "title", label: "Tên hạng mục", children: detailQuery.data.title },
                { key: "category", label: "Nhóm", children: detailQuery.data.category },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: <StatusTag status={detailQuery.data.status} />,
                },
                {
                  key: "dueDate",
                  label: "Hạn bàn giao",
                  children: detailQuery.data.dueDate?.slice(0, 10) || "—",
                },
                { key: "notes", label: "Ghi chú", children: detailQuery.data.notes || "—" },
                {
                  key: "createdAt",
                  label: "Ngày tạo",
                  children: new Date(detailQuery.data.createdAt).toLocaleString("vi-VN"),
                },
                {
                  key: "updatedAt",
                  label: "Cập nhật lần cuối",
                  children: new Date(detailQuery.data.updatedAt).toLocaleString("vi-VN"),
                },
              ]}
            />
          )}
        </Modal>
      )}
    </Flex>
  );
}

function MaintenanceLogsSection({
  websiteId,
  canCreate,
  canUpdate,
  canDelete,
}: {
  websiteId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { message, modal } = App.useApp();
  const client = useQueryClient();
  const [editing, setEditing] = useState<WebsiteMaintenanceLog | "new" | null>(null);
  const [viewingId, setViewingId] = useState<string>();
  const query = useQuery({
    queryKey: queryKeys.websiteSubList(websiteId, "maintenance"),
    queryFn: ({ signal }) =>
      listWebsiteMaintenanceLogs(websiteId, { page: 1, limit: 50 }, signal),
  });
  const detailQuery = useQuery({
    queryKey: queryKeys.websiteSubList(websiteId, "maintenance-detail", { id: viewingId }),
    enabled: Boolean(viewingId),
    queryFn: ({ signal }) => getWebsiteMaintenanceLog(websiteId, viewingId!, signal),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: queryKeys.websiteSubList(websiteId, "maintenance") });

  const saveMutation = useMutation({
    mutationFn: (input: { values: Record<string, unknown>; id?: string }) =>
      saveWebsiteMaintenanceLog(websiteId, input.values, input.id),
    onSuccess: async () => {
      setEditing(null);
      void message.success("Đã lưu nhật ký bảo trì.");
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteWebsiteMaintenanceLog(websiteId, itemId),
    onSuccess: async () => {
      void message.success("Đã xóa nhật ký bảo trì.");
      await refresh();
    },
  });

  const items = query.data?.items ?? [];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary">
          Tổng số: {query.data?.meta.total ?? 0} bản ghi bảo trì
        </Typography.Text>
        {canCreate && editing === null && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setEditing("new")}
          >
            Ghi nhật ký bảo trì
          </Button>
        )}
      </Flex>

      {(saveMutation.isError || deleteMutation.isError) && (
        <Alert
          type="error"
          showIcon
          title={saveMutation.error?.message || deleteMutation.error?.message}
        />
      )}

      {editing !== null && (
        <Card size="small">
          <Form
            layout="vertical"
            initialValues={
              editing === "new"
                ? { maintenanceType: "UPDATE", cost: "0.00" }
                : {
                    maintenanceType: editing.maintenanceType,
                    description: editing.description,
                    nextDueDate: editing.nextDueDate?.slice(0, 10) ?? "",
                    cost: editing.cost,
                  }
            }
            disabled={saveMutation.isPending}
            onFinish={(values) =>
              saveMutation.mutate({
                values,
                id: editing === "new" ? undefined : editing.id,
              })
            }
          >
            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item name="maintenanceType" label="Loại bảo trì" rules={[{ required: true }]}>
                  <Select options={MAINTENANCE_TYPE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="cost" label="Chi phí">
                  <InputNumber<string>
                    stringMode
                    min="0"
                    max="9999999999999999.99"
                    precision={2}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="nextDueDate" label="Kỳ bảo trì tiếp theo">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="Nội dung thực hiện"
              rules={[{ required: true, whitespace: true, message: "Nhập mô tả công việc bảo trì." }]}
            >
              <Input.TextArea rows={3} maxLength={4000} />
            </Form.Item>
            <Flex justify="end" gap={8}>
              <Button onClick={() => setEditing(null)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                Lưu nhật ký
              </Button>
            </Flex>
          </Form>
        </Card>
      )}

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !items.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nhật ký bảo trì." />
      ) : (
        items.map((item) => (
          <Card key={item.id} size="small">
            <Flex justify="space-between" align="flex-start" gap={12}>
              <div>
                <Space wrap size={6}>
                  <Tag color="blue">{item.maintenanceType}</Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.performedAt).toLocaleString("vi-VN")}
                  </Typography.Text>
                  {Number(item.cost) > 0 && (
                    <Tag color="gold">Chi phí: {formatPrice(item.cost)}</Tag>
                  )}
                </Space>
                <Typography.Paragraph style={{ margin: "6px 0 0" }}>
                  {item.description}
                </Typography.Paragraph>
                {item.nextDueDate && (
                  <div style={{ fontSize: 12, color: "var(--tn-muted)", marginTop: 4 }}>
                    Kỳ tiếp theo: {item.nextDueDate.slice(0, 10)}
                  </div>
                )}
              </div>
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  title="Xem chi tiết nhật ký bảo trì"
                  aria-label="Xem chi tiết nhật ký bảo trì"
                  onClick={() => setViewingId(item.id)}
                />
                {canUpdate && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    aria-label="Sửa nhật ký bảo trì"
                    onClick={() => setEditing(item)}
                  />
                )}
                {canDelete && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label="Xóa nhật ký bảo trì"
                    onClick={() =>
                      modal.confirm({
                        title: "Xóa bản ghi bảo trì này?",
                        okText: "Xóa",
                        cancelText: "Hủy",
                        okButtonProps: { danger: true },
                        onOk: () => deleteMutation.mutateAsync(item.id),
                      })
                    }
                  />
                )}
              </Space>
            </Flex>
          </Card>
        ))
      )}

      {viewingId && (
        <Modal
          open
          title="Chi tiết nhật ký bảo trì"
          onCancel={() => setViewingId(undefined)}
          footer={
            <Button type="primary" onClick={() => setViewingId(undefined)}>
              Đóng
            </Button>
          }
          destroyOnHidden
        >
          {detailQuery.isError ? (
            <LoadError error={detailQuery.error} retry={() => void detailQuery.refetch()} />
          ) : detailQuery.isPending || !detailQuery.data ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: "maintenanceType",
                  label: "Loại bảo trì",
                  children: <Tag color="blue">{detailQuery.data.maintenanceType}</Tag>,
                },
                {
                  key: "performedAt",
                  label: "Thời điểm thực hiện",
                  children: new Date(detailQuery.data.performedAt).toLocaleString("vi-VN"),
                },
                {
                  key: "cost",
                  label: "Chi phí",
                  children: `${formatPrice(detailQuery.data.cost)} ₫`,
                },
                {
                  key: "nextDueDate",
                  label: "Kỳ bảo trì tiếp theo",
                  children: detailQuery.data.nextDueDate?.slice(0, 10) || "—",
                },
                {
                  key: "description",
                  label: "Nội dung thực hiện",
                  children: detailQuery.data.description,
                },
                {
                  key: "performedBy",
                  label: "Người thực hiện",
                  children: detailQuery.data.performedById || "Hệ thống",
                },
              ]}
            />
          )}
        </Modal>
      )}
    </Flex>
  );
}
