import "./auth-layout.css";
import Image from "next/image";
import Link from "next/link";
import { BrandIcon } from "@/components/brand-icon";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ThemeSelect } from "@/components/theme-select";
import { authOptions } from "@/lib/auth/options";
import { GuestNavigation } from "./guest-navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="session-loading">
          Đang kiểm tra phiên đăng nhập…
        </p>
      }
    >
      <GuestLayout>{children}</GuestLayout>
    </Suspense>
  );
}

async function GuestLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="auth-page">
      <GuestNavigation />
      <section className="auth-panel">
        <header className="auth-header">
          <Link href="/login" className="auth-brand">
            <span className="auth-brand-icon">
              <BrandIcon />
            </span>
            TNHUB
          </Link>
          <ThemeSelect />
        </header>
        <div className="auth-content">
          <div className="auth-content-inner">{children}</div>
        </div>
      </section>
      <aside className="auth-aside">
        <Image
          src="/auth-architecture.webp"
          alt=""
          fill
          sizes="46vw"
          preload
          className="auth-aside-image"
        />
        <div className="auth-aside-overlay" />
        <div className="auth-aside-content">
          <div className="auth-aside-accent" aria-hidden />
          <p className="auth-aside-title">Dự án, khách hàng và công việc của bạn</p>
          <p className="auth-aside-description">
            Quản lý và theo dõi tiến độ cùng đội ngũ trên TNHUB.
          </p>
        </div>
      </aside>
    </main>
  );
}
