"use client";
import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Select, Space } from "antd";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <Select
      aria-label="Chế độ giao diện"
      value={ready ? (theme ?? "system") : "system"}
      onChange={setTheme}
      disabled={!ready}
      style={{ width: 132 }}
      options={[
        {
          value: "system",
          label: (
            <Space size={6}>
              <DesktopOutlined aria-hidden />
              <span>Hệ thống</span>
            </Space>
          ),
        },
        {
          value: "light",
          label: (
            <Space size={6}>
              <SunOutlined aria-hidden />
              <span>Sáng</span>
            </Space>
          ),
        },
        {
          value: "dark",
          label: (
            <Space size={6}>
              <MoonOutlined aria-hidden />
              <span>Tối</span>
            </Space>
          ),
        },
      ]}
    />
  );
}
