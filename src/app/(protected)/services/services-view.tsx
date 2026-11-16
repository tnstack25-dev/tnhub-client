"use client";

import { useState } from "react";

import { ServiceTable } from "../service-table";
import { canReadServices, useWorkspaceProfile, useWorkspaceServices } from "../workspace-data";

export function ServicesView() {
  const [page, setPage] = useState(1);
  const profile = useWorkspaceProfile();
  const allowed = canReadServices(profile.data);
  const services = useWorkspaceServices(page, 20, allowed);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Dịch vụ</h1>
      <p className="mt-2 text-sm text-muted">Danh mục dịch vụ và trạng thái hoạt động.</p>
      <section aria-label="Danh sách dịch vụ" className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {(profile.isPending || (allowed && services.isPending)) && <p role="status" className="px-5 py-6 text-sm text-muted">Đang tải dịch vụ…</p>}
        {profile.isError && <p role="alert" className="px-5 py-6 text-sm text-danger">{profile.error.message}</p>}
        {profile.data && !allowed && <p className="px-5 py-6 text-sm text-muted">Bạn không có quyền xem danh sách dịch vụ.</p>}
        {allowed && services.isError && <p role="alert" className="px-5 py-6 text-sm text-danger">{services.error.message}</p>}
        {allowed && services.data && <ServiceTable data={services.data} paginate={setPage} />}
      </section>
    </div>
  );
}
