"use client";

import { App, ConfigProvider, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { palettes } from "@/lib/theme/palette";
const subscribe = () => () => {};

export function AntdProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";
  const colors = dark ? palettes.dark : palettes.light;
  return (
    <ConfigProvider
      locale={viVN}
      form={{
        validateMessages: {
          required: "Vui lòng nhập ${label}.",
          types: { email: "Email không hợp lệ." },
          string: {
            min: "${label} cần ít nhất ${min} ký tự.",
            max: "${label} tối đa ${max} ký tự.",
          },
        },
      }}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        cssVar: { key: dark ? "tnhub-dark" : "tnhub-light" },
        components: {
          Menu: {
            itemBg: "transparent",
            subMenuItemBg: "transparent",
            itemSelectedBg: colors["brand-soft"],
            itemSelectedColor: colors["brand-ink"],
            itemHeight: 46,
          },
          Table: { headerBg: colors["surface-muted"], rowHoverBg: colors["brand-soft"] },
          Card: { headerFontSize: 16 },
          Layout: {
            siderBg: colors.sidebar,
            headerBg: colors.surface,
            bodyBg: colors.background,
          },
          Drawer: { colorBgElevated: colors.surface },
        },
        token: {
          colorPrimary: colors.brand,
          colorBgLayout: colors.background,
          colorBgContainer: colors.surface,
          colorText: colors.foreground,
          colorTextSecondary: colors.muted,
          fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          colorBorder: colors.line,
          colorBorderSecondary: colors.line,
          colorBgElevated: colors.surface,
          borderRadius: 10,
          controlHeight: 40,
        },
      }}
    >
      <App className="app-root">{children}</App>
    </ConfigProvider>
  );
}
