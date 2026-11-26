"use client";
import "../clients.css";
import { useState, type Key } from "react";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { LoadError } from "@/components/admin/admin-ui";
import {
  useClientContactDetail,
  useClientContacts,
  useDeleteContactMutation,
  useSaveContactBatchMutation,
  useSaveContactMutation,
  useSetPrimaryContactMutation,
} from "../clients-queries";
import type { ClientContact } from "../clients-types";

export function ClientContactsManager({
  clientId,
  trash,
  canUpdate,
}: {
  clientId: string;
  trash: boolean;
  canUpdate: boolean;
}) {
  const { modal, message } = App.useApp();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ClientContact | "new" | null>(null);
  const [viewingContactId, setViewingContactId] = useState<string>();
  const [batchMode, setBatchMode] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<Key[]>([]);
  const query = useClientContacts(clientId, page, 10, true);
  const saveMutation = useSaveContactMutation(clientId);
  const batchMutation = useSaveContactBatchMutation(clientId);
  const primaryMutation = useSetPrimaryContactMutation(clientId);
  const deleteMutation = useDeleteContactMutation(clientId);
  const editable = canUpdate && !trash;
  const items = query.data?.items ?? [];
  const selectedContacts = items.filter((item) => selected.includes(item.id));
  const busy =
    saveMutation.isPending ||
    batchMutation.isPending ||
    primaryMutation.isPending ||
    deleteMutation.isPending;

  function confirmDelete(ids: string[]) {
    modal.confirm({
      title: `Xóa vĩnh viễn ${ids.length} người liên hệ?`,
      content:
        "Người liên hệ không dùng thùng rác và sẽ bị xóa vĩnh viễn khỏi khách hàng này.",
      okText: "Xóa liên hệ",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await deleteMutation.mutateAsync(ids);
        setSelected([]);
        void message.success(
          res?.affectedCount
            ? `Đã xóa ${res.affectedCount} người liên hệ.`
            : "Đã xóa người liên hệ.",
        );
      },
    });
  }

  async function handleSetPrimary(contact: ClientContact) {
    await primaryMutation.mutateAsync(contact.id);
    void message.success(`Đã đặt ${contact.fullName} làm liên hệ chính.`);
  }

  return (
    <div>
      <div className="client-contacts-header">
        <Space>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Danh bạ người liên hệ
          </Typography.Title>
          <Tag color="blue">{query.data?.meta.total ?? 0}</Tag>
        </Space>
        {editable && (
          <Space wrap>
            {selectedContacts.length > 0 && (
              <>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  disabled={busy}
                  onClick={() => setBatchMode("edit")}
                >
                  Sửa đã chọn ({selectedContacts.length})
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={busy}
                  onClick={() => confirmDelete(selected.map(String))}
                >
                  Xóa đã chọn ({selected.length})
                </Button>
              </>
            )}
            <Button
              size="small"
              icon={<PlusOutlined />}
              disabled={busy}
              onClick={() => setBatchMode("create")}
            >
              Thêm nhiều liên hệ
            </Button>
            {editing === null && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setEditing("new")}
              >
                Thêm liên hệ
              </Button>
            )}
          </Space>
        )}
      </div>

      {trash && (
        <Alert
          type="warning"
          showIcon
          title="Khách hàng đang ở trong thùng rác. Khôi phục khách hàng trước khi chỉnh sửa danh bạ."
          style={{ marginBottom: 16 }}
        />
      )}

      {(saveMutation.isError ||
        batchMutation.isError ||
        primaryMutation.isError ||
        deleteMutation.isError) && (
        <Alert
          role="alert"
          type="error"
          showIcon
          title={
            saveMutation.error?.message ||
            batchMutation.error?.message ||
            primaryMutation.error?.message ||
            deleteMutation.error?.message
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {editing !== null && editable && (
        <ContactInlineForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          saving={saveMutation.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await saveMutation.mutateAsync({
              values,
              contactId: editing === "new" ? undefined : editing.id,
            });
            setEditing(null);
            void message.success(
              editing === "new" ? "Đã thêm người liên hệ." : "Đã cập nhật người liên hệ.",
            );
          }}
        />
      )}

      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có người liên hệ nào cho khách hàng này."
        />
      ) : (
        <Flex vertical gap={10}>
          {items.map((contact) => {
            const checked = selected.includes(contact.id);
            return (
              <div
                key={contact.id}
                className={
                  "client-contact-item" +
                  (contact.isPrimary ? " client-contact-primary" : "")
                }
              >
                <Flex justify="space-between" align="flex-start" gap={12}>
                  <Flex align="flex-start" gap={10} style={{ minWidth: 0, flex: 1 }}>
                    {editable && (
                      <Checkbox
                        aria-label={`Chọn liên hệ ${contact.fullName}`}
                        checked={checked}
                        disabled={busy}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...new Set([...prev, contact.id])]
                              : prev.filter((k) => k !== contact.id),
                          )
                        }
                      />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Space wrap size={6}>
                        <Typography.Text strong>{contact.fullName}</Typography.Text>
                        {contact.title && <Tag>{contact.title}</Tag>}
                        {contact.isPrimary && (
                          <Tag color="gold" icon={<StarFilled />}>
                            Liên hệ chính
                          </Tag>
                        )}
                      </Space>
                      <div className="client-meta-line">
                        {contact.email && (
                          <span>
                            <MailOutlined /> {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span>
                            <PhoneOutlined /> {contact.phone}
                          </span>
                        )}
                        {!contact.email && !contact.phone && (
                          <span>Chưa có email hoặc số điện thoại</span>
                        )}
                      </div>
                      {contact.notes && (
                        <Typography.Paragraph
                          type="secondary"
                          style={{ margin: "6px 0 0", fontSize: 12 }}
                        >
                          {contact.notes}
                        </Typography.Paragraph>
                      )}
                    </div>
                  </Flex>
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      title="Xem chi tiết liên hệ"
                      aria-label={`Xem chi tiết liên hệ ${contact.fullName}`}
                      onClick={() => setViewingContactId(contact.id)}
                    />
                    {editable && (
                      <>
                        {!contact.isPrimary && (
                          <Button
                            type="text"
                            size="small"
                            icon={<StarOutlined />}
                            title="Đặt làm liên hệ chính"
                            aria-label={`Đặt ${contact.fullName} làm liên hệ chính`}
                            disabled={busy}
                            onClick={() => void handleSetPrimary(contact)}
                          />
                        )}
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          aria-label={`Sửa liên hệ ${contact.fullName}`}
                          disabled={busy}
                          onClick={() => setEditing(contact)}
                        />
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={`Xóa liên hệ ${contact.fullName}`}
                          disabled={busy}
                          onClick={() => confirmDelete([contact.id])}
                        />
                      </>
                    )}
                  </Space>
                </Flex>
              </div>
            );
          })}
          {(query.data?.meta.total ?? 0) > 10 && (
            <Flex justify="end" style={{ marginTop: 8 }}>
              <Pagination
                size="small"
                current={page}
                pageSize={10}
                total={query.data?.meta.total ?? 0}
                showSizeChanger={false}
                onChange={(nextPage) => {
                  setPage(nextPage);
                  setSelected([]);
                }}
              />
            </Flex>
          )}
        </Flex>
      )}

      {viewingContactId && (
        <ContactDetailModal
          clientId={clientId}
          contactId={viewingContactId}
          onClose={() => setViewingContactId(undefined)}
        />
      )}

      {batchMode !== null && editable && (
        <ContactBatchModal
          items={batchMode === "edit" ? selectedContacts : undefined}
          saving={batchMutation.isPending}
          onClose={() => setBatchMode(null)}
          onSubmit={async (values) => {
            const res = await batchMutation.mutateAsync({
              values,
              items: batchMode === "edit" ? selectedContacts : undefined,
            });
            setBatchMode(null);
            setSelected([]);
            void message.success(
              batchMode === "edit"
                ? `Đã cập nhật ${res.affectedCount} người liên hệ.`
                : `Đã tạo ${res.affectedCount} người liên hệ.`,
            );
          }}
        />
      )}
    </div>
  );
}

function ContactDetailModal({
  clientId,
  contactId,
  onClose,
}: {
  clientId: string;
  contactId: string;
  onClose: () => void;
}) {
  const detailQuery = useClientContactDetail(clientId, contactId);
  const contact = detailQuery.data;

  return (
    <Modal
      open
      title="Chi tiết người liên hệ"
      onCancel={onClose}
      footer={
        <Button type="primary" onClick={onClose}>
          Đóng
        </Button>
      }
      destroyOnHidden
    >
      {detailQuery.isError ? (
        <LoadError error={detailQuery.error} retry={() => void detailQuery.refetch()} />
      ) : detailQuery.isPending || !contact ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Descriptions
          column={1}
          bordered
          size="small"
          items={[
            { key: "fullName", label: "Họ và tên", children: contact.fullName },
            { key: "title", label: "Chức vụ", children: contact.title || "—" },
            { key: "email", label: "Email", children: contact.email || "—" },
            { key: "phone", label: "Số điện thoại", children: contact.phone || "—" },
            {
              key: "isPrimary",
              label: "Liên hệ chính",
              children: contact.isPrimary ? (
                <Tag color="gold" icon={<StarFilled />}>
                  Liên hệ chính
                </Tag>
              ) : (
                "Không"
              ),
            },
            { key: "notes", label: "Ghi chú", children: contact.notes || "—" },
            {
              key: "createdAt",
              label: "Ngày tạo",
              children: new Date(contact.createdAt).toLocaleString("vi-VN"),
            },
          ]}
        />
      )}
    </Modal>
  );
}

function ContactBatchModal({
  items,
  saving,
  onClose,
  onSubmit,
}: {
  items?: ClientContact[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: { items: Record<string, unknown>[] }) => Promise<void>;
}) {
  const editing = Boolean(items);
  return (
    <Modal
      open
      title={
        editing
          ? `Chỉnh sửa hàng loạt (${items?.length ?? 0} người liên hệ)`
          : "Thêm nhiều người liên hệ"
      }
      width={720}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={{
          items: items?.map((c) => ({
            fullName: c.fullName,
            title: c.title ?? "",
            email: c.email ?? "",
            phone: c.phone ?? "",
            isPrimary: c.isPrimary,
            notes: c.notes ?? "",
          })) ?? [{ isPrimary: false }, { isPrimary: false }],
        }}
        disabled={saving}
        onFinish={(values) => void onSubmit(values)}
      >
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <Flex vertical gap={12}>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={
                    editing
                      ? `Liên hệ #${index + 1}: ${items?.[index]?.fullName ?? ""}`
                      : `Liên hệ mới #${index + 1}`
                  }
                  extra={
                    !editing && fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Bỏ dòng
                      </Button>
                    ) : null
                  }
                >
                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={[field.name, "fullName"]}
                        label="Họ và tên"
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Vui lòng nhập họ tên.",
                          },
                          { max: 150 },
                        ]}
                      >
                        <Input maxLength={150} placeholder="Nguyễn Văn A" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={[field.name, "title"]}
                        label="Chức vụ"
                        rules={[{ max: 100 }]}
                      >
                        <Input maxLength={100} placeholder="Giám đốc, Kế toán…" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={[field.name, "email"]}
                        label="Email"
                        rules={[
                          { type: "email", message: "Email không hợp lệ." },
                          { max: 255 },
                        ]}
                      >
                        <Input maxLength={255} placeholder="an.nguyen@company.vn" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name={[field.name, "phone"]}
                        label="Số điện thoại"
                        rules={[{ max: 30 }]}
                      >
                        <Input maxLength={30} placeholder="0901 234 567" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    name={[field.name, "notes"]}
                    label="Ghi chú"
                    style={{ marginBottom: 8 }}
                  >
                    <Input maxLength={400} placeholder="Ghi chú liên hệ…" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, "isPrimary"]}
                    label="Đặt làm liên hệ chính (tối đa 1 người trong lô)"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </Card>
              ))}
              {!editing && fields.length < 20 && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ isPrimary: false })}
                >
                  Thêm dòng liên hệ
                </Button>
              )}
            </Flex>
          )}
        </Form.List>
        <Flex justify="end" gap={8} style={{ marginTop: 16 }}>
          <Button onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? "Lưu tất cả liên hệ" : "Tạo danh sách liên hệ"}
          </Button>
        </Flex>
      </Form>
    </Modal>
  );
}

function ContactInlineForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: ClientContact;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="client-contact-form-card">
      <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
        {initial ? "Cập nhật người liên hệ" : "Thêm người liên hệ mới"}
      </Typography.Text>
      <Form
        layout="vertical"
        initialValues={
          initial
            ? {
                fullName: initial.fullName,
                title: initial.title ?? "",
                email: initial.email ?? "",
                phone: initial.phone ?? "",
                isPrimary: initial.isPrimary,
                notes: initial.notes ?? "",
              }
            : { isPrimary: false }
        }
        disabled={saving}
        onFinish={(values) => void onSubmit(values)}
      >
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, whitespace: true, message: "Vui lòng nhập họ tên." },
                { max: 150 },
              ]}
            >
              <Input maxLength={150} placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="title" label="Chức vụ" rules={[{ max: 100 }]}>
              <Input maxLength={100} placeholder="Giám đốc, Kế toán…" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", message: "Email không hợp lệ." }, { max: 255 }]}
            >
              <Input maxLength={255} placeholder="an.nguyen@company.vn" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ max: 30 }]}>
              <Input maxLength={30} placeholder="0901 234 567" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Ghi chú liên hệ…" />
        </Form.Item>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Form.Item
            name="isPrimary"
            label="Đặt làm liên hệ chính"
            valuePropName="checked"
            style={{ marginBottom: 0 }}
          >
            <Switch />
          </Form.Item>
          <Space>
            <Button onClick={onCancel} disabled={saving}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {initial ? "Lưu liên hệ" : "Thêm liên hệ"}
            </Button>
          </Space>
        </Flex>
      </Form>
    </div>
  );
}
