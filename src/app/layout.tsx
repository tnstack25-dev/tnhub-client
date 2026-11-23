import { themeStyle } from "@/lib/theme/palette";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "antd/dist/reset.css";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "@/providers/antd-provider";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "TNHub",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <style>{themeStyle}</style>
      </head>
      <body>
        <Suspense
          fallback={
            <div role="status" className="app-loading">
              Đang tải TNHub…
            </div>
          }
        >
          <AntdRegistry>
            <ThemeProvider>
              <AntdProvider>
                <QueryProvider><NuqsAdapter>{children}</NuqsAdapter></QueryProvider>
              </AntdProvider>
            </ThemeProvider>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );
}
