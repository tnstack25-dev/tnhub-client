"use client";
import { Select } from "antd";
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
      style={{ width: 112 }}
      options={[
        { value: "system", label: "Hệ thống" },
        { value: "light", label: "Sáng" },
        { value: "dark", label: "Tối" },
      ]}
    />
  );
}
