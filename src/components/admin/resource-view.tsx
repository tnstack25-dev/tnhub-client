"use client";
import { useState, type Key } from "react";
import { useQueryStates } from "nuqs";
import { EllipsisOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Dropdown, Flex, Row, Segmented, Select, Space, Statistic, Table, Tag, Typography, type TableColumnsType } from "antd";
import { DebouncedSearch } from "@/components/debounced-search";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { useAdminList, useResourceMutation } from "@/lib/admin/admin-queries";
import type { BulkResult } from "@/lib/contracts/api";
import { resourceParsers, listUrlOptions } from "@/lib/url/list-parsers";
import type { ResourceAction, ResourceConfig, ResourceContext } from "./resource-config";
import { AdminFrame, emptyAdmin, LoadError } from "./admin-ui";

export function ResourceView<T extends { id: string; }>({ config }: { config: ResourceConfig<T>; }) {
  const { resource } = config;
  const profile = useWorkspaceProfile();
  const { modal, message } = App.useApp();
  const [url, setUrl] = useQueryStates(resourceParsers, listUrlOptions);
  const { page, limit, search } = url;
  const trash = config.supportsTrash && url.trash;
  const status = config.states.some(option => option.value === url.status) ? url.status ?? undefined : undefined;
  const filters = {
    category: url.category,
    clientType: url.clientType,
    projectType: url.projectType,
    priority: url.priority,
    clientId: url.clientId,
    projectId: url.projectId,
    tagId: url.tagId,
    expiresBefore: url.expiresBefore,
    source: url.source,
    sort: url.sort,
    status,
  };
  const params = { page, limit, search: search || undefined, status, ...config.params?.(filters) };
  const scope = JSON.stringify([resource, params, trash]);
  const [selection, setSelection] = useState<{ scope: string; keys: Key[]; }>({ scope, keys: [] });
  const selected = selection.scope === scope ? selection.keys : [];
  const setSelected = (keys: Key[]) => setSelection({ scope, keys });
  const [editor, setEditor] = useState<{ id?: string; } | null>(null);
  const [detail, setDetail] = useState<string>();
  const [assignment, setAssignment] = useState<string>();
  const [batch, setBatch] = useState<{ items?: T[]; } | null>(null);
  const [report, setReport] = useState<BulkResult>();
  const query = useAdminList<T>(resource, params, allowed(profile.data, resource + ".read"), trash);
  const mutation = useResourceMutation(resource);

  function confirm(ids: string[], action: ResourceAction) {
    const names = { delete: "Chuyển vào thùng rác", restore: "Khôi phục", permanent: "Xóa vĩnh viễn", activate: "Bật hoạt động", deactivate: "Tạm ngưng" };
    modal.confirm({
      title: names[action] + " " + ids.length + " mục?",
      content: action === "permanent" ? "Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục. Chỉ các mục đủ điều kiện mới được xử lý."
        : action === "delete" ? "Các gán quyền và phiên đăng nhập liên quan có thể bị ảnh hưởng. Có thể khôi phục từ thùng rác."
          : "Thay đổi sẽ được áp dụng cho các mục đã chọn.",
      okText: names[action], cancelText: "Hủy",
      okButtonProps: { danger: action === "delete" || action === "permanent" },
      onOk: async () => {
        const data = await mutation.mutateAsync({ ids, action });
        setSelected([]);
        void setUrl({ page: 1 });
        setReport(data?.skipped ? data : undefined);
        void message.success(data?.affectedCount !== undefined ? "Đã xử lý " + data.affectedCount + " mục." : "Thao tác hoàn tất.");
      },
    });
  }
  const context: ResourceContext = {
    profile: profile.data, trash,
    can: action => allowed(profile.data, resource + "." + action), confirm,
    openDetail: setDetail, openEditor: id => setEditor({ id }), openAssignment: setAssignment,
    openBatch: ids => setBatch({ items: ids ? query.data?.items.filter(item => ids.includes(item.id)) : undefined }),
  };
  const bulkMenu = config.bulkActions(selected.map(String), query.data?.items ?? [], context);
  const columns: TableColumnsType<T> = [...config.columns(context), {
    title: "", key: "actions", fixed: "right", width: 64,
    render: (_, item) => <Dropdown trigger={["click"]} menu={{ items: config.actions(item, context) }}>
      <Button
        type="text"
        aria-label={"Thao tác mục " + item.id}
        icon={<EllipsisOutlined />}
        disabled={mutation.isPending} />
    </Dropdown>,
  }];
  return <AdminFrame permission={resource + ".read"} title={config.title} description={config.description}>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={8}>
        <Card className="admin-metric">
          <Statistic title="Kết quả theo bộ lọc" value={query.data?.meta.total ?? "—"} prefix={config.icon} />
        </Card>
      </Col>
      <Col xs={12} sm={8}>
        <Card className="admin-metric">
          <Statistic title="Đang hiển thị" value={query.data?.items.length ?? "—"} />
        </Card>
      </Col>
      <Col xs={12} sm={8}>
        <Card className="admin-metric"><Statistic title="Đã chọn" value={selected.length} /></Card>
      </Col>
    </Row>
    <Card className="admin-table-card">
      <Flex wrap justify="space-between" align="center" gap={12} className="admin-toolbar">
        <Space>
          {config.supportsTrash && <Segmented
            aria-label="Phạm vi danh sách"
            value={trash ? "trash" : "active"}
            options={[{ value: "active", label: "Đang sử dụng" }, { value: "trash", label: "Thùng rác" }]}
            onChange={value => { void setUrl({ trash: value === "trash", page: 1 }); }} />}
          <Tag>{query.data?.meta.total ?? 0} mục</Tag>
        </Space>
        <Space wrap>
          <Button
            aria-label="Tải lại danh sách"
            icon={<ReloadOutlined />}
            loading={query.isFetching}
            onClick={() => void query.refetch()} />
          {config.renderCreateActions?.(context)}
          {!trash && context.can("create") && <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditor({})}>Tạo mới</Button>}
        </Space>
      </Flex>
      <Flex wrap gap={12} className="admin-filters">
        <DebouncedSearch
          value={search}
          aria-label={"Tìm " + config.title.toLowerCase()}
          placeholder="Tìm kiếm theo tên hoặc mã…"
          allowClear
          maxLength={config.searchMaxLength}
          style={{ maxWidth: 360 }}
          onSearch={value => { void setUrl({ search: value, page: 1 }, { history: "replace" }); }} />
        <Select
          aria-label="Lọc trạng thái"
          allowClear
          placeholder="Tất cả trạng thái"
          value={status}
          style={{ minWidth: 170 }}
          options={config.states}
          onChange={value => { void setUrl({ status: value ?? null, page: 1 }); }} />
        {config.renderFilters?.(filters, value => { void setUrl({ ...value, page: 1 }); })}
      </Flex>
      {selected.length > 0 && <Flex wrap align="center" justify="space-between" gap={12} className="admin-selection">
        <Typography.Text strong>Đã chọn {selected.length} mục trên trang này</Typography.Text>
        <Space>
          <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          <Dropdown
            trigger={["click"]}
            menu={{ items: bulkMenu }}
            disabled={!bulkMenu?.length || mutation.isPending}>
            <Button type="primary" loading={mutation.isPending}>Thao tác hàng loạt</Button>
          </Dropdown>
        </Space>
      </Flex>}
      {report && <Alert
        showIcon
        closable
        onClose={() => setReport(undefined)}
        type={report.skipped.length ? "warning" : "success"}
        title={"Đã xử lý " + report.affectedCount + " mục; bỏ qua " + report.skipped.length + " mục"}
        description={report.skipped.length ? <ul>
          {report.skipped.map(item => <li key={item.id}>{item.id}: {config.formatSkipReason?.(item.reason) ?? item.reason}</li>)}
        </ul> : undefined}
        style={{ marginBottom: 16 }} />}
      {mutation.isError && <Alert
        role="alert"
        type="error"
        showIcon
        title={mutation.error.message}
        style={{ marginBottom: 16 }} />}
      {query.isError ? <LoadError error={query.error} retry={() => void query.refetch()} /> : <Table<T>
        rowKey="id"
        columns={columns}
        dataSource={query.data?.items ?? []}
        loading={query.isFetching}
        scroll={{ x: 900 }}
        rowSelection={bulkMenu?.length ? { selectedRowKeys: selected, onChange: setSelected, getCheckboxProps: item => ({ disabled: mutation.isPending || config.blocked(item, profile.data) }), preserveSelectedRowKeys: false } : undefined}
        locale={{ emptyText: emptyAdmin }}
        pagination={{
          current: page, pageSize: limit, total: query.data?.meta.total ?? 0, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: total => total + " kết quả",
          onChange: (nextPage, nextLimit) => { void setUrl({ page: nextLimit !== limit ? 1 : nextPage, limit: nextLimit }); }
        }} />}
    </Card>
    {editor && config.renderEditor(editor.id, () => setEditor(null))}
    {detail && config.renderDetail(detail, trash, () => setDetail(undefined))}
    {assignment && config.renderAssignment?.(assignment, () => setAssignment(undefined))}
    {batch && config.renderBatch?.(batch.items, () => setBatch(null))}
  </AdminFrame>;
}
