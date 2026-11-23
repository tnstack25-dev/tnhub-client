"use client";
import "./dashboard.css";

import {
  ArrowRightOutlined as ArrowRight,
  AppstoreOutlined as Blocks,
  SafetyOutlined as ShieldCheck,
  UserOutlined as UserRound,
} from "@ant-design/icons";
import Link from "next/link";
import { Alert, Button, Card, Col, Flex, Row, Skeleton, Statistic } from "antd";

import { ServiceTable } from "@/features/services/components/service-table";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { canReadServices } from "@/lib/auth/permissions";
import { useWorkspaceServices } from "@/features/services/services-queries";

export function Dashboard() {
  const profile = useWorkspaceProfile();
  const showServices = canReadServices(profile.data);
  const services = useWorkspaceServices(1, 5, showServices);
  const metrics = [
    ...(showServices
      ? [{ title: "Tổng số dịch vụ", value: services.data?.meta.total, icon: Blocks }]
      : []),
    { title: "Vai trò được gán", value: profile.data?.roles.length, icon: UserRound },
    {
      title: "Quyền được cấp",
      value: profile.data?.permissions.length,
      icon: ShieldCheck,
    },
  ];

  return (
    <Flex vertical gap={24}>
      <section className="dashboard-hero">
        <div className="dashboard-hero-pattern" aria-hidden />
        <h1 className="dashboard-hero-title">
          {profile.data?.fullName ? "Xin chào, " + profile.data.fullName : "Tổng quan"}
        </h1>
        <p className="dashboard-hero-description">
          {showServices
            ? "Theo dõi danh sách dịch vụ và quyền truy cập của bạn."
            : "Xem thông tin tài khoản và quyền truy cập của bạn."}
        </p>
        <Button
          className="dashboard-hero-action"
          href={showServices ? "/services" : "/account"}
          icon={<ArrowRight style={{ fontSize: 16 }} aria-hidden />}
          iconPlacement="end"
        >
          {showServices ? "Xem dịch vụ" : "Xem tài khoản"}
        </Button>
      </section>

      {profile.isError && (
        <Alert role="alert" type="error" showIcon title={profile.error.message} />
      )}
      <Row gutter={[16, 16]}>
        {metrics.map(({ title, value, icon: Icon }) => (
          <Col key={title} xs={24} sm={showServices ? 8 : 12}>
            <Card loading={profile.isPending}>
              <Statistic
                title={title}
                value={value ?? "—"}
                prefix={<Icon style={{ fontSize: 22 }} aria-hidden />}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {showServices && (
        <Card
          title={<span id="dashboard-services">Dịch vụ mới nhất</span>}
          extra={<Link href="/services">Tất cả dịch vụ</Link>}
        >
          {services.isPending && <Skeleton active aria-label="Đang tải dịch vụ" />}
          {services.isError && (
            <Alert role="alert" type="error" showIcon title={services.error.message} />
          )}
          {services.data && <ServiceTable data={services.data} />}
        </Card>
      )}
    </Flex>
  );
}
