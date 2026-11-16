import Image from "next/image";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ThemeSelect } from "@/components/theme-select";
import { authOptions } from "@/lib/auth/options";
import { GuestNavigation } from "./guest-navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-8">Đang kiểm tra phiên đăng nhập…</p>}>
      <GuestLayout>{children}</GuestLayout>
    </Suspense>
  );
}

async function GuestLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-surface-muted font-sans text-foreground lg:grid lg:grid-cols-[1fr_46%]">
      <GuestNavigation />
      <section className="flex min-h-dvh flex-col px-6 py-7 sm:px-12 lg:px-16 xl:px-20">
        <header className="flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex w-fit items-center gap-2.5 text-xl font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-[10px] bg-brand text-white">
              <Layers3 size={20} aria-hidden />
            </span>
            TNHUB
          </Link>
          <ThemeSelect />
        </header>
        <div className="flex flex-1 items-center justify-center py-12 sm:py-14">
          <div className="w-full max-w-105">{children}</div>
        </div>
      </section>
      <aside className="relative hidden min-h-[calc(100dvh-2rem)] overflow-hidden bg-[#0b2461] text-white lg:flex lg:items-end">
        <Image
          src="/auth-architecture.webp"
          alt=""
          fill
          sizes="46vw"
          preload
          className="object-cover object-[52%_45%] dark:brightness-75"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#06163e] via-[#071d50]/24 to-transparent" />
        <div className="relative px-10 pb-12 xl:px-14 xl:pb-16">
          <div className="mb-7 h-0.75 w-12 rounded-full bg-[#7da7ff]" aria-hidden />
          <p className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[3.25rem] uppercase">
            Dự án, khách hàng và công việc của bạn
          </p>
          <p className="mt-5 text-base leading-relaxed text-blue-100 uppercase">
            Quản lý và theo dõi tiến độ cùng đội ngũ trên TNHUB.
          </p>
        </div>
      </aside>
    </main>
  );
}
