"use client";
import "./account.css";
import { useState } from "react";
import { DesktopOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { LoadError } from "@/components/admin/admin-ui";
import { ProfileForm } from "./components/profile-form";
import { SessionsView } from "./components/sessions-view";
import type { AuthProfile } from "@/lib/auth/contracts";
import { MediaPickerField } from "@/features/media/components/media-picker-field";
import { avatarPatch, profileAvatar } from "./avatar";
import { useUpdateProfile } from "./account-queries";

export function AccountView() {
  const profile = useWorkspaceProfile();
  return (
    <Flex vertical gap={24}>
      <header className="admin-page-heading">
        <div>
          <Typography.Text className="admin-eyebrow">TÀI KHOẢN CỦA BẠN</Typography.Text>
          <Typography.Title level={1}>Hồ sơ & bảo mật</Typography.Title>
          <Typography.Paragraph type="secondary">
            Cập nhật thông tin cá nhân và kiểm soát các thiết bị đang đăng nhập.
          </Typography.Paragraph>
        </div>
      </header>
      {profile.isPending ? (
        <Skeleton active />
      ) : profile.isError ? (
        <LoadError error={profile.error} retry={() => void profile.refetch()} />
      ) : (
        profile.data && (
          <AccountContent key={profile.data.id} profile={profile.data} />
        )
      )}
    </Flex>
  );
}

function AccountContent({ profile }: { profile: AuthProfile }) {
  const { message } = App.useApp();
  const [avatar, setAvatar] = useState(() => profileAvatar(profile));
  const mutation = useUpdateProfile(() => { void message.success("Đã cập nhật hồ sơ."); });
  return (<Row gutter={[24, 24]}>
    <Col xs={24} xl={7}>
      <Card className="account-identity-card">
        <Flex vertical align="center" gap={16}>
          <MediaPickerField value={avatar} onChange={setAvatar} disabled={mutation.isPending}
            presentation="avatar" shape="circle" title="Chọn ảnh đại diện" chooseText="Thay đổi ảnh đại diện" />
          <Typography.Title level={4} style={{ margin: 0, textAlign: "center" }}>
            {profile.fullName || "Tài khoản TNHub"}
          </Typography.Title>
          <Typography.Text type="secondary" className="account-email">
            {profile.email}
          </Typography.Text>
          <Space wrap>
            {profile.roles.map((role) => (
              <Tag key={role} color="blue">
                {role}
              </Tag>
            ))}
          </Space>
        </Flex>
      </Card>
      <Card
        title={
          <Space>
            <SafetyOutlined />
            Bảo mật
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Typography.Paragraph type="secondary">
          Kiểm tra các phiên đăng nhập thường xuyên và cập nhật mật khẩu khi cần
          thiết.
        </Typography.Paragraph>
        {profile.authProvider === "LOCAL" ? (
          <Button href="/change-password" block>
            Đổi mật khẩu
          </Button>
        ) : (
          <Tag>Đăng nhập qua Google</Tag>
        )}
      </Card>
    </Col>
    <Col xs={24} xl={17}>
      <Card>
        <Tabs
          items={[
            {
              key: "profile",
              label: "Thông tin cá nhân",
              icon: <UserOutlined />,
              children: (
                <ProfileForm profile={profile} saving={mutation.isPending} error={mutation.error}
                  onSubmit={values => mutation.mutate({ ...values, ...avatarPatch(profile, avatar) })} />
              ),
            },
            {
              key: "sessions",
              label: "Phiên đăng nhập",
              icon: <DesktopOutlined />,
              children: <SessionsView />,
            },
          ]}
        />
      </Card>
    </Col>
  </Row>);
}
