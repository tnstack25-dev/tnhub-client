"use client";

import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);

  return (
    <div className="relative shrink-0">
      <select
        aria-label="Chế độ giao diện"
        value={ready ? (theme ?? "system") : "system"}
        onChange={(event) => setTheme(event.currentTarget.value)}
        disabled={!ready}
        className="h-9 appearance-none rounded-lg border border-control-line bg-surface py-1 pl-2.5 pr-7 text-xs font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-sm"
      >
        <option value="system">Hệ thống</option>
        <option value="light">Sáng</option>
        <option value="dark">Tối</option>
      </select>
      <ChevronDown
        size={14}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-icon"
      />
    </div>
  );
}
