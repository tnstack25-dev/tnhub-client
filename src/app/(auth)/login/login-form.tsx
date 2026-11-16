"use client";

import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  AuthDivider,
  AuthField,
  AuthHeading,
  AuthNotice,
  AuthSubmit,
  GoogleButton,
  authLink,
} from "../auth-ui";

const messages: Record<string, string> = {
  CredentialsSignin:
    "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa được xác minh.",
  RateLimited: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.",
  AuthUnavailable: "Dịch vụ đăng nhập tạm thời không khả dụng.",
};

const googleMessages: Record<string, string> = {
  failed: "Không thể đăng nhập bằng Google. Vui lòng thử lại.",
  cancelled: "Bạn đã hủy đăng nhập bằng Google.",
  unavailable: "Đăng nhập bằng Google tạm thời không khả dụng.",
};

export function LoginForm() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const google = params.get("google");
  const googleMessage = google ? googleMessages[google] : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);

    try {
      const result = await signIn("credentials", {
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!result?.ok || result.error) {
        setError(messages[result?.error ?? ""] ?? messages.AuthUnavailable);
        return;
      }

      queryClient.clear();
      window.location.replace("/dashboard");
    } catch {
      setError(messages.AuthUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AuthHeading icon={LockKeyhole} title="Đăng nhập">
        Chào mừng bạn trở lại TNHub.
      </AuthHeading>
      {params.get("logout") === "unconfirmed" && (
        <div className="mb-4">
          <AuthNotice>
            Phiên trên ứng dụng đã đóng. Chưa xác nhận được việc thu hồi phiên
            tại máy chủ.
          </AuthNotice>
        </div>
      )}
      {params.get("password") === "changed" && (
        <div className="mb-4">
          <AuthNotice>
            Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.
          </AuthNotice>
        </div>
      )}
      {googleMessage && (
        <div className="mb-4">
          <AuthNotice error={google !== "cancelled"}>
            {googleMessage}
          </AuthNotice>
        </div>
      )}
      <GoogleButton />
      <AuthDivider />
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          placeholder="ban@congty.vn"
          autoComplete="username"
          required
          maxLength={254}
        />
        <AuthField
          label="Mật khẩu"
          icon={KeyRound}
          name="password"
          type="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          required
          maxLength={72}
          action={
            <Link href="/forgot-password" className={authLink + " text-xs"}>
              Quên mật khẩu?
            </Link>
          }
        />
        {error && <AuthNotice error>{error}</AuthNotice>}
        {error === messages.CredentialsSignin && (
          <Link
            className={authLink + " inline-block text-sm"}
            href="/verify-email"
          >
            Gửi lại email xác minh
          </Link>
        )}
        <AuthSubmit pending={pending}>
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </AuthSubmit>
      </form>
    </>
  );
}
