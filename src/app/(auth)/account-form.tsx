"use client";

import {
  CheckCircleOutlined as CircleCheck,
  KeyOutlined as KeyRound,
  LockOutlined as LockKeyhole,
  MailOutlined as Mail,
  MailOutlined as MailCheck,
  UserOutlined as UserRound,
  UserAddOutlined as UserRoundPlus,
} from "@ant-design/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Form, Button } from "antd";

import { apiClient } from "@/lib/axios/client";
import { ApiError } from "@/lib/axios/error";
import {
  AuthDivider,
  AuthField,
  AuthFooter,
  AuthHeading,
  AuthNotice,
  AuthSubmit,
  GoogleButton,
  authLink,
  passwordHint,
  passwordPattern,
} from "@/components/auth/auth-ui";

const content = {
  register: {
    title: "Tạo tài khoản",
    description: "Tạo tài khoản để bắt đầu sử dụng TNHub.",
    icon: UserRoundPlus,
    button: "Tạo tài khoản",
  },
  "forgot-password": {
    title: "Quên mật khẩu?",
    description: "Nhập email của bạn để nhận liên kết đặt lại mật khẩu.",
    icon: KeyRound,
    button: "Gửi liên kết đặt lại",
  },
  "resend-verification": {
    title: "Gửi lại email xác minh",
    description: "Nhập email bạn đã dùng để đăng ký tài khoản TNHub.",
    icon: MailCheck,
    button: "Gửi email xác minh",
  },
  "verify-email": {
    title: "Xác minh email",
    description: "Xác nhận địa chỉ email để kích hoạt tài khoản TNHub.",
    icon: MailCheck,
    button: "Xác minh email",
  },
  "reset-password": {
    title: "Đặt lại mật khẩu",
    description: "Tạo mật khẩu mới cho tài khoản TNHub của bạn.",
    icon: LockKeyhole,
    button: "Lưu mật khẩu mới",
  },
};

type Action = keyof typeof content;

function Success({ action, email }: { action: Action; email: string }) {
  const inbox =
    action === "register" ||
    action === "forgot-password" ||
    action === "resend-verification";
  const verification = action === "register" || action === "resend-verification";
  return (
    <>
      <AuthHeading
        icon={inbox ? MailCheck : CircleCheck}
        title={
          inbox
            ? "Kiểm tra hộp thư"
            : action === "verify-email"
              ? "Email đã xác minh"
              : "Đã cập nhật mật khẩu"
        }
      >
        {action === "register" && (
          <>
            Mở email gửi đến <strong className="auth-email">{email}</strong> và làm
            theo hướng dẫn để kích hoạt tài khoản.
          </>
        )}
        {action === "forgot-password" &&
          "Nếu email thuộc một tài khoản dùng mật khẩu, bạn sẽ nhận được liên kết đặt lại."}
        {action === "resend-verification" &&
          "Nếu email thuộc tài khoản chưa xác minh, bạn sẽ nhận được liên kết kích hoạt mới."}
        {action === "verify-email" &&
          "Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập ngay."}
        {action === "reset-password" && "Hãy đăng nhập lại bằng mật khẩu mới."}
      </AuthHeading>
      {inbox && (
        <div className="auth-notice">
          <AuthNotice>Nếu chưa thấy email, hãy kiểm tra thư rác.</AuthNotice>
        </div>
      )}
      <Button type="primary" href="/login" block size="large">
        Về trang đăng nhập
      </Button>
      {verification && action === "register" && (
        <AuthFooter>
          <Link href="/verify-email" className={authLink}>
            Gửi lại email xác minh
          </Link>
        </AuthFooter>
      )}
    </>
  );
}

export function AccountForm({ page }: { page: Exclude<Action, "resend-verification"> }) {
  const token = useSearchParams().get("token")?.trim();
  const action = page === "verify-email" && !token ? "resend-verification" : page;
  const config = content[action];
  const [pending, setPending] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  const register = action === "register";
  const reset = action === "reset-password";
  const verify = action === "verify-email";
  const hasValidToken = Boolean(token && /^[A-Za-z0-9_-]{32,256}$/.test(token));
  const invalidLink = (reset || verify) && !hasValidToken;

  async function submit(fields: Record<string, string>) {
    if (pending || invalidLink) return;
    const email = String(fields.email ?? "").trim();
    const password = String(fields.password ?? "");
    if ((register || reset) && password !== fields.confirmation) {
      setError("Hai mật khẩu chưa khớp.");
      return;
    }

    const body = register
      ? { email, fullName: String(fields.fullName).trim(), password }
      : reset
        ? { token, newPassword: password }
        : verify
          ? { token }
          : { email };

    setError("");
    setPending(true);
    try {
      await apiClient.post("/account/" + action, body);
      setSuccessEmail(email);
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 429) {
        setError("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.");
      } else if (
        failure instanceof ApiError &&
        failure.status === 400 &&
        (reset || verify)
      ) {
        setError("Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu email mới.");
      } else if (
        failure instanceof ApiError &&
        failure.status > 0 &&
        failure.status < 500
      ) {
        setError(failure.message);
      } else {
        setError("Chưa thể xử lý yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  if (successEmail !== null) return <Success action={action} email={successEmail} />;
  return (
    <>
      <AuthHeading icon={config.icon} title={config.title}>
        {config.description}
      </AuthHeading>
      {register && (
        <>
          <GoogleButton />
          <AuthDivider />
        </>
      )}
      {invalidLink ? (
        <AuthNotice error>
          Liên kết không hợp lệ. Hãy mở liên kết trong email hoặc yêu cầu liên kết mới.
        </AuthNotice>
      ) : (
        <Form layout="vertical" disabled={pending} onFinish={submit}>
          {register && (
            <AuthField
              label="Họ và tên"
              icon={UserRound}
              name="fullName"
              placeholder="Nguyễn Văn An"
              required
              maxLength={150}
              autoComplete="name"
            />
          )}
          {!reset && !verify && (
            <AuthField
              label="Email"
              icon={Mail}
              name="email"
              type="email"
              placeholder="ban@congty.vn"
              required
              maxLength={254}
              autoComplete="email"
            />
          )}
          {(register || reset) && (
            <>
              <AuthField
                label={reset ? "Mật khẩu mới" : "Mật khẩu"}
                icon={KeyRound}
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                required
                minLength={12}
                maxLength={72}
                pattern={passwordPattern}
                autoComplete="new-password"
                hint={passwordHint}
              />
              <AuthField
                label="Xác nhận mật khẩu"
                icon={KeyRound}
                name="confirmation"
                type="password"
                placeholder="Nhập lại mật khẩu"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
              />
            </>
          )}
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthSubmit pending={pending}>
            {pending ? "Đang xử lý…" : config.button}
          </AuthSubmit>
        </Form>
      )}
      {(verify || reset) && (invalidLink || error) && (
        <p className="auth-retry">
          <Link href={verify ? "/verify-email" : "/forgot-password"} className={authLink}>
            Yêu cầu liên kết mới
          </Link>
        </p>
      )}
      {register ? (
        <AuthFooter>
          Đã có tài khoản?{" "}
          <Link href="/login" className={authLink}>
            Đăng nhập
          </Link>
        </AuthFooter>
      ) : (
        <AuthFooter />
      )}
    </>
  );
}
