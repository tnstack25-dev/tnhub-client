"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, KeyRound } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { apiClient } from "@/lib/axios/client";
import { ApiError } from "@/lib/axios/error";
import {
  AuthField,
  AuthNotice,
  AuthSubmit,
  authLink,
  passwordHint,
  passwordPattern,
} from "../../(auth)/auth-ui";

export function ChangePasswordForm() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const fields = new FormData(event.currentTarget);
    const newPassword = fields.get("newPassword");
    if (newPassword !== fields.get("confirmation")) {
      setError("Hai mật khẩu mới chưa khớp.");
      return;
    }

    setError("");
    setPending(true);
    try {
      await apiClient.post("/account/change-password", { currentPassword: fields.get("currentPassword"), newPassword });
      const loginUrl = "/login?password=changed";
      await signOut({ redirect: false, callbackUrl: loginUrl }).catch(() => {});
      queryClient.clear();
      window.location.replace(loginUrl);
    } catch (failure) {
      setError(failure instanceof ApiError && [400, 403, 429].includes(failure.status)
        ? failure.message
        : failure instanceof ApiError && failure.status === 401
          ? "Mật khẩu hiện tại không đúng hoặc phiên đã hết hạn."
          : "Chưa thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link className={authLink + " mb-4 inline-flex items-center gap-2 text-sm"} href="/account">
        <ArrowLeft size={16} aria-hidden /> Về trang tài khoản
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Đổi mật khẩu</h1>
      <p className="mt-2 text-sm text-muted">Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên các thiết bị.</p>
      <form className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6" onSubmit={submit}>
        <AuthField label="Mật khẩu hiện tại" icon={KeyRound} name="currentPassword" type="password" required maxLength={72} autoComplete="current-password" />
        <AuthField label="Mật khẩu mới" icon={KeyRound} name="newPassword" type="password" required minLength={12} maxLength={72} pattern={passwordPattern} hint={passwordHint} autoComplete="new-password" />
        <AuthField label="Xác nhận mật khẩu mới" icon={KeyRound} name="confirmation" type="password" required minLength={12} maxLength={72} autoComplete="new-password" />
        {error && <AuthNotice error>{error}</AuthNotice>}
        <AuthSubmit pending={pending}>{pending ? "Đang lưu…" : "Đổi mật khẩu"}</AuthSubmit>
      </form>
    </div>
  );
}
