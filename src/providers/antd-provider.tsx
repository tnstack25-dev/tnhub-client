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
            itemHoverBg: colors["surface-hover"],
            itemHoverColor: colors.foreground,
            itemColor: colors.muted,
            itemBorderRadius: 10,
            itemMarginInline: 4,
            itemMarginBlock: 4,
            itemHeight: 44,
          },
          Table: {
            headerBg: colors["surface-muted"],
            headerColor: colors.muted,
            headerSplitColor: "transparent",
            rowHoverBg: colors["surface-hover"],
            rowSelectedBg: colors["brand-soft"],
            rowSelectedHoverBg: colors["brand-soft"],
            borderColor: colors.line,
            cellPaddingBlock: 14,
          },
          Card: {
            headerFontSize: 16,
            colorBorderSecondary: colors.line,
          },
          Button: {
            fontWeight: 500,
            defaultBg: colors.surface,
            defaultBorderColor: colors.line,
          },
          Input: {
            activeBorderColor: colors.brand,
            hoverBorderColor: colors["line-strong"],
          },
          Select: {
            optionSelectedBg: colors["brand-soft"],
            optionSelectedColor: colors["brand-ink"],
          },
          Segmented: {
            trackBg: colors["surface-muted"],
            itemSelectedBg: colors.surface,
            itemSelectedColor: colors.foreground,
            itemColor: colors.muted,
          },
          Modal: {
            contentBg: colors.surface,
            headerBg: colors.surface,
            footerBg: colors.surface,
          },
          Layout: {
            siderBg: colors.sidebar,
            headerBg: colors.surface,
            bodyBg: colors.background,
          },
          Drawer: { colorBgElevated: colors.surface },
        },
        token: {
          colorPrimary: colors.brand,
          colorInfo: colors.brand,
          colorLink: colors["brand-ink"],
          colorLinkHover: colors.brand,
          colorBgLayout: colors.background,
          colorBgContainer: colors.surface,
          colorFillAlter: colors["surface-muted"],
          colorText: colors.foreground,
          colorTextSecondary: colors.muted,
          fontFamily: "var(--font-geist-sans), Arial, sans-serif",
          colorBorder: colors.line,
          colorBorderSecondary: colors.line,
          colorSplit: colors.line,
          colorBgElevated: colors.surface,
          borderRadius: 10,
          borderRadiusLG: 14,
          controlHeight: 40,
        },
      }}
    >
      <App className="app-root">{children}</App>
    </ConfigProvider>
  );
}
