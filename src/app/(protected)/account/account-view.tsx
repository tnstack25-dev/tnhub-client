"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";

import { useWorkspaceProfile } from "../workspace-data";

export function AccountView() {
  const profile = useWorkspaceProfile();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Tài khoản</h1>
      <section aria-labelledby="account-profile" className="mt-6 max-w-3xl rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 id="account-profile" className="text-lg font-semibold tracking-tight">Thông tin cá nhân</h2>
        {profile.isPending && <p role="status" className="mt-3 text-sm text-muted">Đang tải hồ sơ…</p>}
        {profile.isError && <p role="alert" className="mt-3 text-sm text-danger">{profile.error.message}</p>}
        {profile.data && (
          <>
            <dl className="mt-4 divide-y divide-line text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-muted">Họ và tên</dt><dd className="break-words font-medium">{profile.data.fullName || "Chưa cập nhật"}</dd></div>
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-muted">Email</dt><dd className="break-all font-medium">{profile.data.email}</dd></div>
              <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-muted">Phương thức đăng nhập</dt><dd className="font-medium">{profile.data.authProvider === "LOCAL" ? "Email và mật khẩu" : "Google"}</dd></div>
            </dl>
            {profile.data.authProvider === "LOCAL" && <Link href="/change-password" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-brand-ink hover:bg-surface-hover"><KeyRound size={16} aria-hidden />Đổi mật khẩu</Link>}
          </>
        )}
      </section>
    </div>
  );
}
