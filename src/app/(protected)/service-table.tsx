import { Blocks, ChevronLeft, ChevronRight } from "lucide-react";

import type { ServicePage } from "./workspace-data";

const paginationButton = "grid size-8 place-items-center rounded-lg border border-control-line text-foreground hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent";

export function ServiceTable({ data, paginate }: { data: ServicePage; paginate?: (page: number) => void }) {
  const { items } = data;
  if (items.length === 0) {
    return (
      <div className="grid place-items-center gap-2 border-t border-line px-5 py-12 text-center text-sm text-muted">
        <Blocks size={25} strokeWidth={1.6} className="text-muted-icon" aria-hidden />
        <p>Chưa có dịch vụ nào.</p>
      </div>
    );
  }

  return (
    <>
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <thead className="border-y border-line bg-surface-muted text-xs font-semibold text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 sm:px-6">Dịch vụ</th>
            <th scope="col" className="w-[42%] px-4 py-3 sm:w-48 sm:px-6">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((service) => (
            <tr key={service.id}>
              <td className="px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink sm:grid"><Blocks size={17} aria-hidden /></span>
                  <div className="min-w-0 break-words">
                    <p className="font-semibold">{service.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{service.code}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 sm:px-6">
                <span className={service.isActive
                  ? "inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                  : "inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-semibold text-muted"}>
                  <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
                  {service.isActive ? "Đang hoạt động" : "Đã tắt"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {paginate && data.meta.totalPages > 1 && (
        <nav aria-label="Phân trang dịch vụ" className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted sm:px-6">
          <span>Trang {data.meta.page} / {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => paginate(data.meta.page - 1)} disabled={data.meta.page <= 1} aria-label="Trang trước" className={paginationButton}><ChevronLeft size={18} aria-hidden /></button>
            <button type="button" onClick={() => paginate(data.meta.page + 1)} disabled={data.meta.page >= data.meta.totalPages} aria-label="Trang tiếp theo" className={paginationButton}><ChevronRight size={18} aria-hidden /></button>
          </div>
        </nav>
      )}
    </>
  );
}
