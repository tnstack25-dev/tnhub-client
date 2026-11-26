"use client";
import "./dashboard.css";

import { useState } from "react";
import {
  ApartmentOutlined,
  AppstoreOutlined as Blocks,
  AuditOutlined,
  BellOutlined,
  CalendarOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  PictureOutlined,
  ProjectOutlined,
  ReloadOutlined,
  TagsOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Input,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";

import { StatusTag } from "@/components/admin/admin-ui";
import {
  CLIENT_TYPE_LABELS,
  type Client,
} from "@/features/clients/clients-types";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type Project,
} from "@/features/projects/projects-types";
import type { Website } from "@/features/websites/websites-types";
import {
  useMyNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/notifications-queries";
import { useQuery } from "@tanstack/react-query";
import { useAdminList } from "@/lib/admin/admin-queries";
import { getSystemHealth } from "@/lib/admin/admin-api";
import {
  formatPrice,
  matchesYearMonth,
  sumDecimalStrings,
} from "@/lib/admin/format";
import { allowed, canReadServices } from "@/lib/auth/permissions";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function previousYearMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function upcomingThirtyDaysDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function formatMonthLabel(ym: string): string {
  if (!ym || ym === "all") return "Toàn thời gian";
  const [year, month] = ym.split("-");
  return `Tháng ${Number(month)}/${year}`;
}

export function Dashboard() {
  const profile = useWorkspaceProfile();
  const canClients = allowed(profile.data, "clients.read");
  const canProjects = allowed(profile.data, "projects.read");
  const canWebsites = allowed(profile.data, "websites.read");
  const showServices = canReadServices(profile.data);

  const [thisMonth] = [currentYearMonth()];
  const [lastMonth] = [previousYearMonth()];
  const [expiringBefore] = [upcomingThirtyDaysDate()];
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const unreadCount = useUnreadNotificationCount(Boolean(profile.data));
  const inbox = useMyNotifications(
    { page: 1, limit: 20, state: "all" },
    Boolean(profile.data),
  );
  const healthQuery = useQuery({
    queryKey: ["system", "health"] as const,
    enabled: Boolean(profile.data),
    staleTime: 30_000,
    queryFn: ({ signal }) => getSystemHealth(signal),
  });

  // Load up to 100 latest records to support accurate monthly aggregation & filtering on the dashboard
  const clientsQuery = useAdminList<Client>(
    "clients",
    { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    canClients,
    false,
  );

  const projectsQuery = useAdminList<Project>(
    "projects",
    { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    canProjects,
    false,
  );

  const websitesQuery = useAdminList<Website>(
    "websites",
    { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" },
    canWebsites,
    false,
  );

  const expiringWebsitesQuery = useAdminList<Website>(
    "websites",
    {
      page: 1,
      limit: 20,
      expiresBefore: expiringBefore,
      sortBy: "domainExpiresOn",
      sortOrder: "asc",
    },
    canWebsites,
    false,
  );

  const allClients = clientsQuery.data?.items ?? [];
  const allProjects = projectsQuery.data?.items ?? [];
  const allWebsites = websitesQuery.data?.items ?? [];
  const allInbox = inbox.data?.items ?? [];

  const filteredClients = allClients.filter((c) =>
    matchesYearMonth(c.createdAt, selectedMonth),
  );
  const filteredProjects = allProjects.filter((p) =>
    matchesYearMonth(p.startDate ?? p.createdAt, selectedMonth),
  );
  const filteredWebsites = allWebsites.filter((w) =>
    matchesYearMonth(w.createdAt, selectedMonth),
  );
  const filteredInbox = allInbox.filter((n) =>
    matchesYearMonth(n.notification.createdAt, selectedMonth),
  );

  const activeProjectsCount = filteredProjects.filter(
    (p) => p.status === "ACTIVE",
  ).length;

  // Aggregate project budgets by currency using exact decimal arithmetic
  const vndProjects = filteredProjects.filter((p) => p.currency === "VND");
  const usdProjects = filteredProjects.filter((p) => p.currency === "USD");
  const totalVndBudget = sumDecimalStrings(vndProjects.map((p) => p.budget));
  const totalUsdBudget = sumDecimalStrings(usdProjects.map((p) => p.budget));

  const periodLabel = formatMonthLabel(selectedMonth);

  const kpiCards = [
    ...(canProjects
      ? [
          {
            key: "budget",
            title: `Tổng ngân sách dự án (${periodLabel})`,
            value: `${formatPrice(totalVndBudget)} ₫`,
            sub:
              usdProjects.length > 0
                ? `+ ${formatPrice(totalUsdBudget)} USD (${filteredProjects.length} dự án)`
                : `Tổng hợp từ ${filteredProjects.length} dự án trong kỳ`,
            icon: DollarOutlined,
            loading: projectsQuery.isPending,
          },
          {
            key: "projects",
            title: `Dự án triển khai (${periodLabel})`,
            value: `${activeProjectsCount} / ${
              selectedMonth === "all"
                ? (projectsQuery.data?.meta.total ?? filteredProjects.length)
                : filteredProjects.length
            }`,
            sub: "Dự án đang hoạt động / Tổng dự án trong kỳ",
            icon: ProjectOutlined,
            loading: projectsQuery.isPending,
          },
        ]
      : []),
    ...(canClients
      ? [
          {
            key: "clients",
            title: `Khách hàng (${periodLabel})`,
            value:
              selectedMonth === "all"
                ? (clientsQuery.data?.meta.total ?? filteredClients.length)
                : filteredClients.length,
            sub: "Hồ sơ doanh nghiệp & cá nhân tiếp nhận",
            icon: ApartmentOutlined,
            loading: clientsQuery.isPending,
          },
        ]
      : []),
    ...(canWebsites
      ? [
          {
            key: "websites",
            title: `Website & Hạ tầng (${periodLabel})`,
            value:
              selectedMonth === "all"
                ? (websitesQuery.data?.meta.total ?? filteredWebsites.length)
                : filteredWebsites.length,
            sub: expiringWebsitesQuery.data?.meta.total
              ? `${expiringWebsitesQuery.data.meta.total} website sắp/đã hết hạn (30 ngày)`
              : "Tất cả tên miền & máy chủ còn hạn",
            icon: GlobalOutlined,
            loading: websitesQuery.isPending,
          },
        ]
      : []),
  ];

  const quickLinks = [
    { href: "/projects", label: "Dự án & Công việc", icon: ProjectOutlined, show: canProjects },
    { href: "/clients", label: "Khách hàng & Danh bạ", icon: ApartmentOutlined, show: canClients },
    { href: "/websites", label: "Website & Bảo trì", icon: GlobalOutlined, show: canWebsites },
    { href: "/tags", label: "Nhãn dự án", icon: TagsOutlined, show: allowed(profile.data, "tags.read") },
    { href: "/services", label: "Bảng giá dịch vụ", icon: Blocks, show: showServices },
    { href: "/notifications", label: "Hộp thư thông báo", icon: BellOutlined, show: true },
    { href: "/media", label: "Thư viện Media", icon: PictureOutlined, show: allowed(profile.data, "media.read") },
    { href: "/users", label: "Đội ngũ thành viên", icon: TeamOutlined, show: allowed(profile.data, "users.read") },
    { href: "/audit-logs", label: "Nhật ký bảo mật", icon: AuditOutlined, show: allowed(profile.data, "audit.read") },
  ].filter((item) => item.show);

  function refreshAll() {
    if (canProjects) void projectsQuery.refetch();
    if (canClients) void clientsQuery.refetch();
    if (canWebsites) {
      void websitesQuery.refetch();
      void expiringWebsitesQuery.refetch();
    }
    void inbox.refetch();
    void healthQuery.refetch();
  }

  return (
    <Flex vertical gap={24}>
      {/* Monthly Filter Bar */}
      <div className="dashboard-filter-bar">
        <Space wrap size={10}>
          <CalendarOutlined style={{ color: "var(--tn-brand-ink)", fontSize: 16 }} />
          <Typography.Text strong>Kỳ thống kê dữ liệu:</Typography.Text>
          <Segmented
            aria-label="Chọn kỳ thống kê nhanh"
            value={
              selectedMonth === "all" ||
              selectedMonth === thisMonth ||
              selectedMonth === lastMonth
                ? selectedMonth
                : "custom"
            }
            options={[
              { value: "all", label: "Toàn thời gian" },
              { value: thisMonth, label: `Tháng này (${thisMonth})` },
              { value: lastMonth, label: `Tháng trước (${lastMonth})` },
            ]}
            onChange={(val) => {
              if (val !== "custom") setSelectedMonth(String(val));
            }}
          />
          {healthQuery.data && (
            <Tag
              color={
                healthQuery.data.ready
                  ? "success"
                  : healthQuery.data.alive
                    ? "warning"
                    : "error"
              }
            >
              {healthQuery.data.ready
                ? "Hạ tầng API & DB: Sẵn sàng"
                : healthQuery.data.alive
                  ? "API: Hoạt động"
                  : "Cảnh báo kết nối API"}
            </Tag>
          )}
        </Space>
        <Space wrap size={10}>
          <Input
            type="month"
            aria-label="Lọc theo tháng cụ thể"
            value={selectedMonth === "all" ? "" : selectedMonth}
            style={{ width: 175 }}
            onChange={(e) => setSelectedMonth(e.target.value || "all")}
          />
          {selectedMonth !== "all" && (
            <Button onClick={() => setSelectedMonth("all")}>Bỏ lọc tháng</Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            aria-label="Làm mới số liệu dashboard"
            loading={
              projectsQuery.isFetching ||
              clientsQuery.isFetching ||
              websitesQuery.isFetching
            }
            onClick={refreshAll}
          />
        </Space>
      </div>

      {profile.isError && (
        <Alert role="alert" type="error" showIcon title={profile.error.message} />
      )}

      {/* Focused Business KPI Cards (4 equal-height columns) */}
      {kpiCards.length > 0 && (
        <Row gutter={[16, 16]} align="stretch">
          {kpiCards.map(({ key, title, value, sub, icon: Icon, loading }) => (
            <Col
              key={key}
              xs={24}
              sm={12}
              xl={kpiCards.length >= 4 ? 6 : 24 / kpiCards.length}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Card className="admin-metric dashboard-kpi-card" loading={loading}>
                <Statistic
                  title={title}
                  value={value ?? "—"}
                  prefix={<Icon style={{ fontSize: 20 }} aria-hidden />}
                />
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8, fontSize: 12 }}
                >
                  {sub}
                </Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Quick Navigation Tiles */}
      <div>
        <Typography.Text
          className="admin-eyebrow"
          style={{ display: "block", marginBottom: 12 }}
        >
          TRUY CẬP NHANH PHÂN HỆ
        </Typography.Text>
        <div className="dashboard-quick-grid">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="dashboard-quick-tile">
              <span className="dashboard-quick-icon">
                <Icon aria-hidden />
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Equal-Height Row 1: Projects & Clients (Symmetric 12/12 layout) */}
      {(canProjects || canClients) && (
        <Row gutter={[20, 20]} align="stretch">
          {canProjects && (
            <Col
              xs={24}
              lg={canClients ? 12 : 24}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Card
                className="dashboard-panel-card"
                title={
                  <Space>
                    <ProjectOutlined />
                    <span>Dự án ({periodLabel})</span>
                    <Tag color="blue">{filteredProjects.length}</Tag>
                  </Space>
                }
                extra={<Link href="/projects">Tất cả dự án →</Link>}
              >
                {projectsQuery.isPending ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : projectsQuery.isError ? (
                  <Alert type="error" showIcon title={projectsQuery.error.message} />
                ) : filteredProjects.length === 0 ? (
                  <div className="dashboard-panel-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={`Không có dự án nào trong ${periodLabel.toLowerCase()}.`}
                    />
                  </div>
                ) : (
                  <div className="dashboard-panel-list">
                    {filteredProjects.slice(0, 6).map((proj) => {
                      const prio = PROJECT_PRIORITY_OPTIONS.find(
                        (p) => p.value === proj.priority,
                      );
                      const pType = PROJECT_TYPE_OPTIONS.find(
                        (t) => t.value === proj.projectType,
                      );
                      return (
                        <div key={proj.id} className="dashboard-item-row">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Space wrap size={6}>
                              <Link
                                href={`/projects/${proj.id}`}
                                style={{ fontWeight: 600 }}
                              >
                                {proj.name}
                              </Link>
                              <Tag className="admin-code" style={{ margin: 0 }}>
                                {proj.code}
                              </Tag>
                              <StatusTag status={proj.status} />
                              <Tag color={prio?.color}>{prio?.label ?? proj.priority}</Tag>
                            </Space>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--tn-muted)",
                                marginTop: 4,
                              }}
                            >
                              {pType?.label ?? proj.projectType} · Ngân sách:{" "}
                              <strong>
                                {formatPrice(proj.budget)} {proj.currency}
                              </strong>{" "}
                              · Deadline: {proj.deadline?.slice(0, 10) || "Chưa đặt"}
                            </div>
                          </div>
                          <Link href={`/projects/${proj.id}`}>
                            <Button size="small" icon={<FolderOpenOutlined />}>
                              Công việc
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>
          )}

          {canClients && (
            <Col
              xs={24}
              lg={canProjects ? 12 : 24}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <Card
                className="dashboard-panel-card"
                title={
                  <Space>
                    <ApartmentOutlined />
                    <span>Khách hàng tiếp nhận ({periodLabel})</span>
                    <Tag color="blue">{filteredClients.length}</Tag>
                  </Space>
                }
                extra={<Link href="/clients">Quản lý khách hàng →</Link>}
              >
                {clientsQuery.isPending ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : clientsQuery.isError ? (
                  <Alert type="error" showIcon title={clientsQuery.error.message} />
                ) : filteredClients.length === 0 ? (
                  <div className="dashboard-panel-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={`Không có khách hàng mới trong ${periodLabel.toLowerCase()}.`}
                    />
                  </div>
                ) : (
                  <div className="dashboard-panel-list">
                    {filteredClients.slice(0, 6).map((client) => (
                      <div key={client.id} className="dashboard-item-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Space wrap size={6}>
                            <Typography.Text strong>{client.name}</Typography.Text>
                            <Tag color={client.clientType === "BUSINESS" ? "blue" : "cyan"}>
                              {CLIENT_TYPE_LABELS[client.clientType] ?? client.clientType}
                            </Tag>
                            <StatusTag status={client.status} />
                          </Space>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--tn-muted)",
                              marginTop: 4,
                            }}
                          >
                            {client.email || client.phone || "Chưa có email/SĐT"} ·{" "}
                            {client._count?.contacts ?? 0} người liên hệ · Ngày tạo:{" "}
                            {client.createdAt.slice(0, 10)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Equal-Height Row 2: Expiring Websites & Recent Notifications (Symmetric 12/12 layout) */}
      <Row gutter={[20, 20]} align="stretch">
        {canWebsites && (
          <Col
            xs={24}
            lg={12}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Card
              className="dashboard-panel-card"
              title={
                <Space>
                  <WarningOutlined style={{ color: "#d97706" }} />
                  <span>Cảnh báo hạn Domain & Hosting (30 ngày tới)</span>
                </Space>
              }
              extra={<Link href="/websites">Tất cả website →</Link>}
            >
              {expiringWebsitesQuery.isPending ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : expiringWebsitesQuery.isError ? (
                <Alert
                  type="error"
                  showIcon
                  title={expiringWebsitesQuery.error.message}
                />
              ) : !(expiringWebsitesQuery.data?.items.length ?? 0) ? (
                <div className="dashboard-panel-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có website nào sắp hết hạn trong 30 ngày tới."
                  />
                </div>
              ) : (
                <div className="dashboard-panel-list">
                  {expiringWebsitesQuery.data!.items.map((site) => (
                    <div key={site.id} className="dashboard-item-row">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Space wrap size={6}>
                          <Typography.Text strong>{site.displayName}</Typography.Text>
                          {site.domainName && (
                            <Tag className="admin-code">{site.domainName}</Tag>
                          )}
                          <StatusTag status={site.status} />
                        </Space>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--tn-muted)",
                            marginTop: 4,
                          }}
                        >
                          Hạn Domain:{" "}
                          <strong>{site.domainExpiresOn?.slice(0, 10) || "—"}</strong> ·
                          Hạn Hosting:{" "}
                          <strong>{site.hostingExpiresOn?.slice(0, 10) || "—"}</strong>
                        </div>
                      </div>
                      <Link href={`/projects/${site.projectId}`}>
                        <Button size="small" type="link">
                          Dự án →
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        )}

        <Col
          xs={24}
          lg={canWebsites ? 12 : 24}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <Card
            className="dashboard-panel-card"
            title={
              <Space>
                <BellOutlined />
                <span>Hộp thư thông báo ({periodLabel})</span>
                {(unreadCount.data ?? 0) > 0 && (
                  <Badge count={unreadCount.data} size="small" />
                )}
              </Space>
            }
            extra={<Link href="/notifications">Mở hộp thư →</Link>}
          >
            {inbox.isPending ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : inbox.isError ? (
              <Alert type="error" showIcon title={inbox.error.message} />
            ) : filteredInbox.length === 0 ? (
              <div className="dashboard-panel-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={`Không có thông báo trong ${periodLabel.toLowerCase()}.`}
                />
              </div>
            ) : (
              <div className="dashboard-panel-list">
                {filteredInbox.slice(0, 6).map((item) => (
                  <div key={item.id} className="dashboard-item-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Space wrap size={6}>
                        {!item.isRead && <Badge status="processing" />}
                        <Typography.Text strong>
                          {item.notification.title}
                        </Typography.Text>
                        <Tag color="blue">{item.notification.type}</Tag>
                      </Space>
                      <Typography.Paragraph
                        type="secondary"
                        ellipsis={{ rows: 1 }}
                        style={{ margin: "4px 0 0", fontSize: 12 }}
                      >
                        {item.notification.body}
                      </Typography.Paragraph>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(item.notification.createdAt).toLocaleDateString(
                        "vi-VN",
                      )}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}
