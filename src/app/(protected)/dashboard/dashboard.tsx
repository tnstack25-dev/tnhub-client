"use client";

import { ArrowRight, Blocks, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { ServiceTable } from "../service-table";
import { canReadServices, useWorkspaceProfile, useWorkspaceServices } from "../workspace-data";

export function Dashboard() {
  const profile = useWorkspaceProfile();
  const showServices = canReadServices(profile.data);
  const services = useWorkspaceServices(1, 5, showServices);
  const metrics = [
    ...(showServices ? [{ title: "Tổng số dịch vụ", value: services.data?.meta.total, icon: Blocks }] : []),
    { title: "Vai trò được gán", value: profile.data?.roles.length, icon: UserRound },
    { title: "Quyền được cấp", value: profile.data?.permissions.length, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-hero-start to-hero-end px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-3/5 bg-[repeating-radial-gradient(ellipse_at_90%_120%,transparent_0_22px,#c9dbff24_23px_24px,transparent_25px_44px)] [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden />
        <h1 className="max-w-3xl break-words text-3xl font-semibold tracking-tight sm:text-[2.6rem]">
          {profile.data?.fullName ? "Xin chào, " + profile.data.fullName : "Tổng quan"}
        </h1>
        <p className="mt-2 text-sm text-[#edf3ff] sm:text-base">{showServices ? "Theo dõi danh sách dịch vụ và quyền truy cập của bạn." : "Xem thông tin tài khoản và quyền truy cập của bạn."}</p>
        <Link href={showServices ? "/services" : "/account"} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-surface px-3.5 text-sm font-semibold text-brand-ink transition hover:bg-surface-hover">
          {showServices ? "Xem dịch vụ" : "Xem tài khoản"}<ArrowRight size={16} aria-hidden />
        </Link>
      </section>

      {profile.isError && <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{profile.error.message}</p>}
      <div className={showServices ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
        {metrics.map(({ title, value, icon: Icon }) => (
          <div key={title} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink"><Icon size={21} strokeWidth={1.8} aria-hidden /></span>
            <div>
              <p className="text-xs font-medium text-muted sm:text-sm">{title}</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {showServices && (
        <section aria-labelledby="dashboard-services" className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <h2 id="dashboard-services" className="text-lg font-semibold tracking-tight">Dịch vụ mới nhất</h2>
              <p className="mt-0.5 text-sm text-muted">Danh mục và trạng thái hiện tại.</p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline">Tất cả dịch vụ <ArrowRight size={15} aria-hidden /></Link>
          </div>
          {services.isPending && <p role="status" className="border-t border-line px-6 py-5 text-sm text-muted">Đang tải dịch vụ…</p>}
          {services.isError && <p role="alert" className="border-t border-line px-6 py-5 text-sm text-danger">{services.error.message}</p>}
          {services.data && <ServiceTable data={services.data} />}
        </section>
      )}
    </div>
  );
}
