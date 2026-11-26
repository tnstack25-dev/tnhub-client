"use client";
import "./change-password.css";

import { useQueryClient } from "@tanstack/react-query";
import { clearSessionCache, handleSessionError } from "@/lib/auth/client-cache";
import {
  ArrowLeftOutlined as ArrowLeft,
  KeyOutlined as KeyRound,
} from "@ant-design/icons";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Card, Form, Typography } from "antd";

import { apiClient } from "@/lib/axios/client";
import { ApiError } from "@/lib/axios/error";
import {
  AuthField,
  AuthNotice,
  AuthSubmit,
  authLink,
  passwordHint,
  passwordPattern,
} from "@/components/auth/auth-ui";

export function ChangePasswordForm() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(fields: Record<string, string>) {
    if (pending) return;

    const newPassword = fields.newPassword;
    if (newPassword !== fields.confirmation) {
      setError("Hai mật khẩu mới chưa khớp.");
      return;
    }

    setError("");
    setPending(true);
    try {
      await apiClient.post("/account/change-password", {
        currentPassword: fields.currentPassword,
        newPassword,
      });
      const loginUrl = "/login?password=changed";
      await signOut({ redirect: false, callbackUrl: loginUrl }).catch(() => {});
      await clearSessionCache(queryClient);
      window.location.replace(loginUrl);
    } catch (failure) {
      handleSessionError(queryClient, failure);
      setError(
        failure instanceof ApiError && [400, 403, 429].includes(failure.status)
          ? failure.message
          : failure instanceof ApiError && failure.status === 401
            ? "Mật khẩu hiện tại không đúng hoặc phiên đã hết hạn."
            : "Chưa thể đổi mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="password-page">
      <Link className={authLink + " password-back-link"} href="/account">
        <ArrowLeft style={{ fontSize: 16 }} aria-hidden /> Về trang tài khoản
      </Link>
      <Typography.Title level={1}>Đổi mật khẩu</Typography.Title>
      <Typography.Paragraph type="secondary">
        Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên các thiết bị.
      </Typography.Paragraph>
      <Card>
        <Form layout="vertical" disabled={pending} onFinish={submit}>
          <AuthField
            label="Mật khẩu hiện tại"
            icon={KeyRound}
            name="currentPassword"
            type="password"
            required
            maxLength={72}
            autoComplete="current-password"
          />
          <AuthField
            label="Mật khẩu mới"
            icon={KeyRound}
            name="newPassword"
            type="password"
            required
            minLength={12}
            maxLength={72}
            pattern={passwordPattern}
            hint={passwordHint}
            autoComplete="new-password"
          />
          <AuthField
            label="Xác nhận mật khẩu mới"
            icon={KeyRound}
            name="confirmation"
            type="password"
            required
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
          />
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthSubmit pending={pending}>
            {pending ? "Đang lưu…" : "Đổi mật khẩu"}
          </AuthSubmit>
        </Form>
      </Card>
    </div>
  );
}
