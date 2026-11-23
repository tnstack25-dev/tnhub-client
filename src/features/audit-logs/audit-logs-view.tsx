"use client";
import "./audit-logs.css";
import { useState } from "react";
import { useQueryStates } from "nuqs";
import { auditParsers, listUrlOptions } from "@/lib/url/list-parsers";
import { format as formatDate } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import {
  AuditOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Flex,
  Grid,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";
import { AdminFrame, LoadError, emptyAdmin } from "@/components/admin/admin-ui";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { exportAudit } from "./audit-api";
import { buildAuditFilters, type AuditFilterInput } from "@/lib/audit/filters";
import { useAudit } from "./audit-queries";
import { type AuditEvent, type AuditFilters } from "./audit-types";
import { AuditDetail, IntegrityTag, SeverityTag } from "./audit-detail";
import { AuditFiltersForm } from "./components/audit-filters-form";

export function AuditLogsView() {
  const screens = Grid.useBreakpoint();
  const profile = useWorkspaceProfile();
  const { message } = App.useApp();
  const [url, setUrl] = useQueryStates(auditParsers, listUrlOptions);
  const { page, limit } = url;
  const setPage = (page: number) => { void setUrl({ page }); };
  const setLimit = (limit: number) => { void setUrl({ limit }); };
  const setFilters = (filters: AuditFilters) => { void setUrl({ eventType: filters.eventType ?? "", userId: filters.userId ?? "",
    severity: (filters.severity as typeof url.severity) ?? null, from: filters.from ?? "", to: filters.to ?? "", page: 1 }); };
  let filters: AuditFilters = {};
  let urlError = "";
  try { filters = buildAuditFilters({ eventType: url.eventType, userId: url.userId, severity: url.severity ?? undefined, fromLocal: url.from, toLocal: url.to }); }
  catch (error) { urlError = error instanceof Error ? error.message : "Bộ lọc không hợp lệ."; }
  const toLocal = (value: string) => value && !Number.isNaN(Date.parse(value)) ? formatDate(new Date(value), "yyyy-MM-dd'T'HH:mm:ss") : "";
  const filterValues = { eventType: url.eventType, severity: url.severity ?? undefined, userId: url.userId, fromLocal: toLocal(url.from), toLocal: toLocal(url.to) };
  const formKey = JSON.stringify(filterValues);
  const [filterError, setFilterError] = useState("");
  const [detail, setDetail] = useState<string>();
  const [exportInfo, setExportInfo] = useState<{ count: number; truncated: boolean }>();
  const query = useAudit(filters, page, limit, !urlError && allowed(profile.data, "audit.read"));
  const items = query.data?.items ?? [];
  const download = useMutation({
    mutationFn: () => exportAudit(filters),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "audit-logs-" + data.exportedAt.replace(/[:.]/g, "-") + ".json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setExportInfo({ count: data.items.length, truncated: data.truncated });
      void message.success("Đã tạo file xuất " + data.items.length + " bản ghi.");
    },
  });
  function apply(values: AuditFilterInput) {
    try {
      setFilters(buildAuditFilters(values));
      setFilterError("");
      setExportInfo(undefined);
      setPage(1);
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : "Bộ lọc không hợp lệ.");
    }
  }
  const columns: TableColumnsType<AuditEvent> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 180,
      render: (value) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Sự kiện",
      key: "event",
      width: 250,
      render: (_, item) => (
        <div>
          <Button type="link" className="admin-name" onClick={() => setDetail(item.id)}>
            {item.eventType}
          </Button>
          <Typography.Text type="secondary" className="admin-code">
            {item.email || "Hệ thống / Không xác định"}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 140,
      render: (severity) => <SeverityTag severity={severity} />,
    },
    { title: "IP", dataIndex: "ipAddress", width: 155, responsive: ["xxl"], render: (value) => value || "—" },
    {
      title: "Toàn vẹn",
      dataIndex: "integrityValid",
      width: 160,
      render: (value) => <IntegrityTag value={value} />,
    },
    {
      title: "",
      key: "detail",
      fixed: "right",
      width: 84,
      render: (_, item) => (
        <Button
          type="link"
          onClick={() => setDetail(item.id)}
          aria-label={"Chi tiết " + item.eventType}
        >
          Chi tiết
        </Button>
      ),
    },
  ];
  return (
    <AdminFrame
      permission="audit.read"
      title="Nhật ký audit"
      description="Theo dõi hoạt động và sự kiện bảo mật, tra cứu người thực hiện và kiểm tra tính toàn vẹn dữ liệu."
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Kết quả theo bộ lọc"
              value={query.data?.meta.total ?? "—"}
              prefix={<AuditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Nghiêm trọng · trang này"
              value={
                query.data
                  ? items.filter((item) => item.severity === "CRITICAL").length
                  : "—"
              }
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="admin-metric">
            <Statistic
              title="Toàn vẹn không hợp lệ · trang này"
              value={
                query.data
                  ? items.filter((item) => item.integrityValid === false).length
                  : "—"
              }
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Card className="admin-table-card">
        <Flex
          wrap
          gap={12}
          align="center"
          justify="space-between"
          className="admin-toolbar"
        >
          <Typography.Text type="secondary">
            Chỉ xem · Dữ liệu theo múi giờ thiết bị
          </Typography.Text>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Tải lại
            </Button>
            {allowed(profile.data, "audit.export") && (
              <Button
                icon={<DownloadOutlined />}
                loading={download.isPending}
                disabled={Boolean(urlError)}
                onClick={() => download.mutate()}
              >
                Xuất JSON
              </Button>
            )}
          </Space>
        </Flex>
        <AuditFiltersForm key={formKey} initialValues={filterValues} onApply={apply} onClear={() => {
          setFilters({}); setFilterError(""); setExportInfo(undefined);
        }} />
        {(filterError || urlError) && (
          <Alert
            type="error"
            showIcon
            role="alert"
            title={filterError || urlError}
            style={{ marginBottom: 16 }}
          />
        )}
        {download.isError && (
          <Alert
            type="error"
            showIcon
            role="alert"
            title={download.error.message}
            style={{ marginBottom: 16 }}
          />
        )}
        {exportInfo && (
          <Alert
            showIcon
            closable
            type={exportInfo.truncated ? "warning" : "success"}
            title={"File xuất gồm " + exportInfo.count + " bản ghi"}
            description={
              exportInfo.truncated
                ? "Backend giới hạn tối đa 10.000 bản ghi mỗi lần xuất. Thu hẹp bộ lọc để xuất đầy đủ dữ liệu."
                : "File JSON sử dụng các bộ lọc đang được áp dụng trên bảng."
            }
            onClose={() => setExportInfo(undefined)}
            style={{ marginBottom: 16 }}
          />
        )}
        {query.isError ? (
          <LoadError error={query.error} retry={() => void query.refetch()} />
        ) : (
          <Table<AuditEvent>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={query.isFetching}
            scroll={{ x: screens.xxl ? 1000 : 820 }}
            locale={{ emptyText: emptyAdmin }}
            pagination={{
              current: page,
              pageSize: limit,
              total: query.data?.meta.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => total + " sự kiện",
              onChange: (p, l) => {
                setPage(l !== limit ? 1 : p);
                setLimit(l);
              },
            }}
          />
        )}
      </Card>
      {detail && <AuditDetail id={detail} onClose={() => setDetail(undefined)} />}
    </AdminFrame>
  );
}
