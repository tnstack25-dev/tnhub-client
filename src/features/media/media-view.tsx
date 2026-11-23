"use client";
import "./media.css";
import { useState, type Key } from "react";
import { useQueryStates } from "nuqs";
import { listUrlOptions, mediaParsers } from "@/lib/url/list-parsers";
import { useMutation } from "@tanstack/react-query";
import {
  AppstoreOutlined,
  BarsOutlined,
  EllipsisOutlined,
  PictureOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Empty,
  Flex,
  Image,
  Pagination,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  type MenuProps,
  type TableColumnsType,
} from "antd";
import { AdminFrame, LoadError } from "@/components/admin/admin-ui";
import { DebouncedSearch } from "@/components/debounced-search";
import { allowed } from "@/lib/auth/permissions";
import { type BulkResult } from "@/lib/contracts/api";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { mutateMedia } from "./media-api";
import { fileSize, safeImageUrl } from "@/lib/media/validation";
import { useMedia, useRefreshMedia } from "./media-queries";
import { type MediaItem } from "./media-types";
import { MediaUpload } from "./media-upload";
import { MediaDetail } from "./media-detail";
export function MediaView() {
  const profile = useWorkspaceProfile();
  const { modal, message } = App.useApp();
  const refresh = useRefreshMedia();
  const [url, setUrl] = useQueryStates(mediaParsers, listUrlOptions);
  const { page, limit, trash, layout, search, mine } = url;
  const format = url.format ?? undefined;
  const setPage = (page: number) => { void setUrl({ page }); };
  const setLimit = (limit: number) => { void setUrl({ limit }); };
  const setTrash = (trash: boolean) => { void setUrl({ trash, page: 1 }); };
  const setLayout = (layout: typeof url.layout) => { void setUrl({ layout }); };
  const setSearch = (search: string) => { void setUrl({ search, page: 1 }, { history: "replace" }); };
  const setFormat = (format: typeof url.format | undefined) => { void setUrl({ format: format ?? null, page: 1 }); };
  const setMine = (mine: boolean) => { void setUrl({ mine, page: 1 }); };
  const scope = JSON.stringify([page, limit, trash, search, format, mine, profile.data?.id]);
  const [selection, setSelection] = useState<{ scope: string; keys: Key[] }>({ scope, keys: [] });
  const selected = selection.scope === scope ? selection.keys : [];
  const setSelected = (value: Key[] | ((previous: Key[]) => Key[])) => setSelection(previous => ({ scope,
    keys: typeof value === "function" ? value(previous.scope === scope ? previous.keys : []) : value }));
  const [upload, setUpload] = useState(false);
  const [detail, setDetail] = useState<string>();
  const [report, setReport] = useState<BulkResult>();
  const can = (permission: string) => allowed(profile.data, "media." + permission);
  const query = useMedia(
    {
      page,
      limit,
      search: search || undefined,
      format,
      uploadedById: mine ? profile.data?.id : undefined,
    },
    trash,
    can("read"),
  );
  const items = query.data?.items ?? [];
  function reset() {
    setPage(1);
    setSelected([]);
  }
  const mutation = useMutation({
    mutationFn: mutateMedia,
    onSuccess: async (data) => {
      setSelected([]);
      setPage(1);
      setReport(data?.skipped ? data : undefined);
      void message.success(
        data?.affectedCount !== undefined
          ? "Đã xử lý " + data.affectedCount + " ảnh."
          : "Thao tác hoàn tất.",
      );
      await refresh();
    },
  });
  function confirm(ids: string[], action: "delete" | "restore" | "permanent") {
    const label = {
      delete: "Chuyển vào thùng rác",
      restore: "Khôi phục",
      permanent: "Xóa vĩnh viễn",
    }[action];
    modal.confirm({
      title: label + " " + ids.length + " ảnh?",
      content:
        action === "permanent"
          ? "Ảnh sẽ bị xóa vĩnh viễn khỏi kho lưu trữ và database. Không thể khôi phục. Những trang đang dùng ảnh có thể bị ảnh hưởng."
          : action === "delete"
            ? "Ảnh được đưa vào thùng rác và có thể khôi phục. Đường dẫn ảnh có thể vẫn được dùng ở các nội dung hiện có."
            : "Ảnh sẽ trở lại thư viện đang sử dụng.",
      okText: label,
      cancelText: "Hủy",
      okButtonProps: { danger: action !== "restore" },
      onOk: () => mutation.mutateAsync({ ids, action }),
    });
  }
  function rowMenu(item: MediaItem): MenuProps["items"] {
    return [
      { key: "detail", label: "Xem chi tiết", onClick: () => setDetail(item.id) },
      ...(!trash && can("update")
        ? [{ key: "edit", label: "Chỉnh mô tả", onClick: () => setDetail(item.id) }]
        : []),
      ...(trash && can("restore")
        ? [
            {
              key: "restore",
              label: "Khôi phục",
              onClick: () => confirm([item.id], "restore"),
            },
          ]
        : []),
      ...((trash ? can("hard_delete") : can("delete"))
        ? [
            {
              key: "delete",
              label: trash ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác",
              danger: true,
              onClick: () => confirm([item.id], trash ? "permanent" : "delete"),
            },
          ]
        : []),
    ];
  }
  const bulkMenu: MenuProps["items"] = [
    ...(trash && can("restore")
      ? [
          {
            key: "restore",
            label: "Khôi phục ảnh đã chọn",
            onClick: () => confirm(selected.map(String), "restore"),
          },
        ]
      : []),
    ...((trash ? can("hard_delete") : can("delete"))
      ? [
          {
            key: "delete",
            label: trash ? "Xóa vĩnh viễn ảnh đã chọn" : "Chuyển ảnh vào thùng rác",
            danger: true,
            onClick: () => confirm(selected.map(String), trash ? "permanent" : "delete"),
          },
        ]
      : []),
  ];
  const selectionEnabled = bulkMenu.length > 0;
  function toggle(id: string, checked: boolean) {
    setSelected((previous) =>
      checked
        ? [...new Set([...previous, id])].slice(0, 50)
        : previous.filter((key) => key !== id),
    );
  }
  const columns: TableColumnsType<MediaItem> = [
    {
      title: "Ảnh",
      key: "name",
      width: 320,
      render: (_, item) => (
        <Flex gap={12} align="center">
          {safeImageUrl(item.secureUrl) ? (
            <Image
              src={safeImageUrl(item.secureUrl)}
              width={48}
              height={48}
              style={{ objectFit: "cover", borderRadius: 8 }}
              alt={item.altText || item.originalName}
              preview={false}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <PictureOutlined />
          )}
          <div className="admin-identity">
            <Button type="link" className="admin-name" onClick={() => setDetail(item.id)}>
              {item.originalName}
            </Button>
            <Typography.Text className="admin-code" type="secondary">
              {item.width && item.height
                ? item.width + " × " + item.height + " px"
                : "Chưa có kích thước"}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Định dạng",
      dataIndex: "format",
      width: 100,
      render: (value) => <Tag>{String(value).toUpperCase()}</Tag>,
    },
    { title: "Dung lượng", dataIndex: "bytes", width: 120, render: fileSize },
    {
      title: "Ngày tải",
      dataIndex: "createdAt",
      width: 170,
      render: (value) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 64,
      render: (_, item) => (
        <Dropdown
          trigger={["click"]}
          menu={{ items: rowMenu(item) }}
          disabled={mutation.isPending}
        >
          <Button
            type="text"
            icon={<EllipsisOutlined />}
            aria-label={"Thao tác " + item.originalName}
          />
        </Dropdown>
      ),
    },
  ];
  return (
    <AdminFrame
      permission="media.read"
      title="Thư viện media"
      description="Tập trung hình ảnh, quản lý mô tả và tái sử dụng nội dung trong dự án."
    >
      <Card className="admin-table-card">
        <Flex
          wrap
          gap={12}
          align="center"
          justify="space-between"
          className="admin-toolbar"
        >
          <Space wrap>
            <Segmented
              aria-label="Phạm vi media"
              value={trash ? "trash" : "active"}
              options={[
                { value: "active", label: "Thư viện" },
                { value: "trash", label: "Thùng rác" },
              ]}
              onChange={(v) => {
                setTrash(v === "trash");
                reset();
              }}
            />
            <Tag>{query.data?.meta.total ?? 0} ảnh</Tag>
          </Space>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              aria-label="Tải lại media"
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            />
            {!trash && can("create") && (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUpload(true)}
              >
                Tải ảnh lên
              </Button>
            )}
          </Space>
        </Flex>
        <Flex
          wrap
          gap={12}
          align="center"
          justify="space-between"
          className="admin-filters"
        >
          <Flex wrap gap={12} style={{ flex: 1 }}>
            <DebouncedSearch
              value={search}
              aria-label="Tìm media"
              placeholder="Tìm tên, mô tả hoặc public ID…"
              allowClear
              maxLength={255}
              onSearch={(value) => {
                setSearch(value);
                setSelected([]);
              }}
              style={{ maxWidth: 360 }}
            />
            <Select
              aria-label="Lọc định dạng"
              allowClear
              placeholder="Tất cả định dạng"
              value={format}
              style={{ width: 175 }}
              options={["jpg", "jpeg", "png", "gif", "webp", "avif"].map((value) => ({
                value,
                label: value.toUpperCase(),
              }))}
              onChange={(value) => {
                setFormat(value);
                reset();
              }}
            />
            <Checkbox
              checked={mine}
              onChange={(e) => {
                setMine(e.target.checked);
                reset();
              }}
            >
              Ảnh tôi tải
            </Checkbox>
          </Flex>
          <Segmented
            aria-label="Kiểu hiển thị media"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "grid", label: "Lưới", icon: <AppstoreOutlined /> },
              { value: "table", label: "Bảng", icon: <BarsOutlined /> },
            ]}
          />
        </Flex>
        {selectionEnabled && items.length > 0 && (
          <Flex
            wrap
            gap={12}
            align="center"
            justify="space-between"
            className="media-selection-bar"
          >
            <Checkbox
              checked={
                items.length > 0 && items.every((item) => selected.includes(item.id))
              }
              indeterminate={selected.length > 0 && selected.length < items.length}
              disabled={mutation.isPending}
              onChange={(e) =>
                setSelected(
                  e.target.checked ? items.map((item) => item.id).slice(0, 50) : [],
                )
              }
            >
              Chọn ảnh trên trang
            </Checkbox>
            <Space>
              <Typography.Text type="secondary">
                Đã chọn {selected.length}/50
              </Typography.Text>
              {selected.length > 0 && (
                <>
                  <Button type="text" onClick={() => setSelected([])}>
                    Bỏ chọn
                  </Button>
                  <Dropdown
                    trigger={["click"]}
                    menu={{ items: bulkMenu }}
                    disabled={mutation.isPending}
                  >
                    <Button loading={mutation.isPending}>Thao tác hàng loạt</Button>
                  </Dropdown>
                </>
              )}
            </Space>
          </Flex>
        )}
        {report && (
          <Alert
            type={report.skipped.length ? "warning" : "success"}
            showIcon
            closable
            onClose={() => setReport(undefined)}
            title={
              "Đã xử lý " + report.affectedCount + " ảnh; bỏ qua " + report.skipped.length
            }
            description={
              report.skipped.length ? (
                <ul>
                  {report.skipped.map((item) => (
                    <li key={item.id}>
                      {item.id}:{" "}
                      {(
                        {
                          NOT_FOUND: "Không tìm thấy",
                          ALREADY_DELETED: "Ảnh đã ở trong thùng rác",
                          NOT_DELETED: "Ảnh chưa ở trong thùng rác",
                        } as Record<string, string>
                      )[item.reason] ?? item.reason}
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
            style={{ marginBottom: 16 }}
          />
        )}
        {mutation.isError && (
          <Alert
            role="alert"
            type="error"
            showIcon
            title={mutation.error.message}
            style={{ marginBottom: 16 }}
          />
        )}
        {query.isError ? (
          <LoadError error={query.error} retry={() => void query.refetch()} />
        ) : query.isPending ? (
          <Skeleton active />
        ) : !items.length ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              search || format || mine
                ? "Không có ảnh phù hợp với bộ lọc."
                : trash
                  ? "Thùng rác đang trống."
                  : "Chưa có ảnh trong thư viện."
            }
          >
            {!trash && can("create") && (
              <Button type="primary" onClick={() => setUpload(true)}>
                Tải ảnh đầu tiên
              </Button>
            )}
          </Empty>
        ) : layout === "table" ? (
          <Table<MediaItem>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={query.isFetching}
            scroll={{ x: 780 }}
            pagination={false}
            rowSelection={
              selectionEnabled
                ? {
                    selectedRowKeys: selected,
                    onChange: (keys) => setSelected(keys.slice(0, 50)),
                    getCheckboxProps: () => ({ disabled: mutation.isPending }),
                  }
                : undefined
            }
          />
        ) : (
          <div aria-busy={query.isFetching}>
            <Row gutter={[16, 16]}>
              {items.map((item) => (
                <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    size="small"
                    className={
                      "media-card" +
                      (selected.includes(item.id) ? " media-card-selected" : "")
                    }
                  >
                    <div className="media-card-tools">
                      {selectionEnabled ? (
                        <Checkbox
                          aria-label={"Chọn " + item.originalName}
                          checked={selected.includes(item.id)}
                          disabled={mutation.isPending}
                          onChange={(e) => toggle(item.id, e.target.checked)}
                        />
                      ) : (
                        <Tag>{item.format.toUpperCase()}</Tag>
                      )}
                      <Dropdown
                        trigger={["click"]}
                        menu={{ items: rowMenu(item) }}
                        disabled={mutation.isPending}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<EllipsisOutlined />}
                          aria-label={"Thao tác " + item.originalName}
                        />
                      </Dropdown>
                    </div>
                    <button
                      type="button"
                      className="media-thumbnail"
                      aria-label={"Xem " + item.originalName}
                      onClick={() => setDetail(item.id)}
                    >
                      {safeImageUrl(item.secureUrl) ? (
                        <Image
                          src={safeImageUrl(item.secureUrl)}
                          alt={item.altText || item.originalName}
                          preview={false}
                          width="100%"
                          height="100%"
                          style={{ objectFit: "contain" }}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <PictureOutlined />
                      )}
                    </button>
                    <Typography.Paragraph
                      strong
                      ellipsis={{ rows: 1, tooltip: item.originalName }}
                      style={{ margin: "12px 0 6px" }}
                    >
                      {item.originalName}
                    </Typography.Paragraph>
                    <Flex justify="space-between" gap={8}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {fileSize(item.bytes)}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {item.format.toUpperCase()}
                      </Typography.Text>
                    </Flex>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
        {query.data && query.data.meta.total > 0 && (
          <Flex justify="end" style={{ marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={query.data.meta.total}
              showSizeChanger
              pageSizeOptions={[12, 24, 48]}
              showTotal={(total) => total + " ảnh"}
              responsive
              onChange={(p, l) => {
                setPage(l !== limit ? 1 : p);
                setLimit(l);
                setSelected([]);
              }}
            />
          </Flex>
        )}
      </Card>
      {upload && (
        <MediaUpload
          onClose={() => setUpload(false)}
          onUploaded={() => {
            setPage(1);
            setSelected([]);
          }}
        />
      )}{" "}
      {detail && (
        <MediaDetail
          id={detail}
          trash={trash}
          editable={can("update")}
          onClose={() => setDetail(undefined)}
          onSaved={() => {
            setDetail(undefined);
            setPage(1);
            setSelected([]);
          }}
        />
      )}
    </AdminFrame>
  );
}
