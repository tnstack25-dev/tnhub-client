"use client";
import "./workspace-shell.css";
import { useQueryClient } from "@tanstack/react-query";
import { clearSessionCache } from "@/lib/auth/client-cache";
import { safeImageUrl } from "@/lib/media/validation";
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Layout,
  Menu,
  type MenuProps,
  Typography,
} from "antd";
import {
  AppstoreOutlined as Blocks,
  DownOutlined as ChevronDown,
  KeyOutlined as KeyRound,
  AppstoreOutlined as Layers3,
  DashboardOutlined as LayoutDashboard,
  LogoutOutlined as LogOut,
  MenuOutlined as MenuIcon,
  UserOutlined as UserRound,
  CloseOutlined as X,
  SafetyCertificateOutlined,
  KeyOutlined,
  TeamOutlined,
  PictureOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSelect } from "@/components/theme-select";
import { apiClient } from "@/lib/axios/client";
import { ApiError } from "@/lib/axios/error";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { canReadServices } from "@/lib/auth/permissions";
import { allowed } from "@/lib/auth/permissions";
import type { AuthProfile } from "@/lib/auth/contracts";
const destinations = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/services", label: "Dịch vụ", icon: Blocks },
  { href: "/account", label: "Tài khoản", icon: UserRound },
  {
    href: "/roles",
    label: "Vai trò",
    icon: SafetyCertificateOutlined,
    permission: "roles.read",
  },
  {
    href: "/permissions",
    label: "Danh mục quyền",
    icon: KeyOutlined,
    permission: "permissions.read",
  },
  {
    href: "/users",
    label: "Người dùng",
    icon: TeamOutlined,
    permission: "users.read",
  },

  {
    href: "/media",
    label: "Thư viện media",
    icon: PictureOutlined,
    permission: "media.read",
  },
  {
    href: "/audit-logs",
    label: "Nhật ký audit",
    icon: AuditOutlined,
    permission: "audit.read",
  },
];
function Navigation({
  pathname,
  showServices,
  profile,
  close,
}: {
  pathname: string;
  showServices: boolean;
  profile?: AuthProfile;
  close?: () => void;
}) {
  return (
    <>
      <Link href="/dashboard" onClick={close} className="workspace-brand">
        <Layers3 style={{ fontSize: 26 }} aria-hidden />
        TNHub
      </Link>
      <Typography.Text className="workspace-nav-caption">WORKSPACE</Typography.Text>
      <nav aria-label="Điều hướng chính">
        <Menu
          theme="light"
          mode="inline"
          style={{ background: "transparent", borderInlineEnd: 0 }}
          selectedKeys={[
            destinations.find(
              (d) => pathname === d.href || pathname.startsWith(d.href + "/"),
            )?.href ?? "/account",
          ]}
          items={destinations
            .filter(
              (d) =>
                (d.href !== "/services" || showServices) &&
                (!("permission" in d) || allowed(profile, d.permission!)),
            )
            .map(({ href, label, icon: Icon }) => ({
              key: href,
              icon: <Icon style={{ fontSize: 18 }} aria-hidden />,
              label: (
                <Link
                  href={href}
                  onClick={close}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              ),
            }))}
        />
      </nav>
    </>
  );
}
export function WorkspaceShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useWorkspaceProfile();
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const destination = destinations.find(
    (d) => pathname === d.href || pathname.startsWith(d.href + "/"),
  );
  const title =
    pathname === "/change-password"
      ? "Đổi mật khẩu"
      : (destination?.label ?? "Không gian làm việc");
  const name =
    profile.data?.fullName ||
    user.name ||
    profile.data?.email ||
    user.email ||
    "Tài khoản";
  const email = profile.data?.email ?? user.email;
  const initials =
    name
      .trim()
      .split(/[\s@._-]+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "TN";
  const expired = profile.error instanceof ApiError && profile.error.status === 401;
  const showServices = canReadServices(profile.data);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const close = (e: MediaQueryListEvent) => {
      if (e.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  async function logout() {
    if (leaving) return;
    setLeaving(true);
    setLogoutError("");
    await queryClient.cancelQueries();

    let callbackUrl = "/login";
    try {
      await apiClient.post("/session/logout");
    } catch (error) {
      if (!(error instanceof ApiError && error.code === "LOGOUT_UNCONFIRMED")) {
        setLogoutError("Chưa thể đăng xuất. Vui lòng thử lại.");
        setLeaving(false);
        return;
      }
      callbackUrl = "/login?logout=unconfirmed";
    }

    await clearSessionCache(queryClient);
    try {
      await signOut({ redirect: false, callbackUrl });
      setAccountOpen(false);
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setLogoutError("Phiên đã đóng. Hãy thử lại để xóa cookie đăng nhập.");
      setLeaving(false);
    }
  }

  const items: MenuProps["items"] = [
    {
      key: "identity",
      label: (
        <div className="account-menu-identity">
          <div className="account-menu-name">{name}</div>
          <div className="account-menu-email">{email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserRound style={{ fontSize: 17 }} aria-hidden />,
      label: <Link href="/account">Hồ sơ tài khoản</Link>,
    },
    ...(profile.data?.authProvider === "LOCAL"
      ? [
          {
            key: "password",
            icon: <KeyRound style={{ fontSize: 17 }} aria-hidden />,
            label: <Link href="/change-password">Đổi mật khẩu</Link>,
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogOut style={{ fontSize: 17 }} aria-hidden />,
      label: leaving ? "Đang đăng xuất…" : "Đăng xuất",
      disabled: leaving,
      danger: true,
    },
  ];
  return (
    <Layout style={{ minHeight: "100dvh" }}>
      <a href="#workspace-content" className="workspace-skip-link">
        Đến nội dung chính
      </a>
      <Layout.Sider
        width={232}
        className="workspace-sidebar"
        style={{
          position: "sticky",
          top: 0,
          height: "100dvh",
          overflowY: "auto",
          background: "var(--tn-sidebar)",
          padding: "28px 12px",
        }}
      >
        <Navigation
          pathname={pathname}
          showServices={showServices}
          profile={profile.data}
        />
      </Layout.Sider>
      <Drawer
        title={<span className="workspace-drawer-label">Điều hướng TNHub</span>}
        closeIcon={
          <X style={{ fontSize: 18 }} className="workspace-drawer-label" aria-hidden />
        }
        placement="left"
        size={272}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          section: { background: "var(--tn-sidebar)" },
          header: { color: "var(--tn-foreground)" },
        }}
      >
        <Navigation
          pathname={pathname}
          showServices={showServices}
          profile={profile.data}
          close={() => setDrawerOpen(false)}
        />
      </Drawer>
      <Layout className="workspace-main">
        <Layout.Header
          className="workspace-header"
          style={{
            padding: "12px 24px",
            height: "auto",
            minHeight: 68,
            lineHeight: "normal",
          }}
        >
          <Flex align="center" gap={12} className="workspace-breadcrumb">
            <Button
              className="workspace-menu-toggle"
              aria-label="Mở điều hướng"
              aria-haspopup="dialog"
              onClick={() => setDrawerOpen(true)}
              icon={<MenuIcon style={{ fontSize: 20 }} aria-hidden />}
            />
            <Breadcrumb
              items={[{ title: <Link href="/dashboard">TNHub</Link> }, { title }]}
            />
          </Flex>
          <Flex align="center" gap={12}>
            <ThemeSelect />
            <Dropdown
              trigger={["click"]}
              open={accountOpen}
              onOpenChange={setAccountOpen}
              menu={{
                items,
                onClick: ({ key }) => {
                  setAccountOpen(false);
                  if (key === "logout") void logout();
                },
              }}
            >
              <Button
                type="text"
                aria-label="Menu tài khoản"
                className="workspace-account-button"
                aria-expanded={accountOpen}
              >
                <Avatar size="small" src={safeImageUrl(profile.data?.avatarUrl ?? "")}>{initials}</Avatar>
                <span className="workspace-account-name">{name}</span>
                <ChevronDown style={{ fontSize: 14 }} aria-hidden />
              </Button>
            </Dropdown>
          </Flex>
        </Layout.Header>
        <Layout.Content
          id="workspace-content"
          tabIndex={-1}
          className="workspace-content"
        >
          {(logoutError || expired) && (
            <Alert
              className="workspace-notice"
              role="alert"
              type="error"
              showIcon
              title={logoutError || "Phiên đăng nhập đã hết hiệu lực."}
              action={
                expired ? (
                  <Button loading={leaving} onClick={logout}>
                    Về trang đăng nhập
                  </Button>
                ) : undefined
              }
            />
          )}
          {!leaving && !expired && children}
        </Layout.Content>
        <Layout.Footer
          className="workspace-footer"
          style={{ padding: "16px 24px", background: "var(--tn-surface)" }}
        >
          © {new Date().getFullYear()} TNHub
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
