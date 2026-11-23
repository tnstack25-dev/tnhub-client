"use client";
import "./auth-ui.css";
import Link from "next/link";
import { Alert, Button, Divider, Form, Input, Typography, type InputProps } from "antd";
import { ArrowRightOutlined as ArrowRight } from "@ant-design/icons";
import type { ReactNode } from "react";
export const authLink = "auth-link";
export const passwordHint = "12–72 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";
export const passwordPattern =
  "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,72}";
export function AuthHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ArrowRight;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="auth-heading">
      <span className="auth-heading-icon">
        <Icon style={{ fontSize: 23 }} aria-hidden />
      </span>
      <Typography.Title level={1} style={{ fontSize: 32, marginBottom: 12 }}>
        {title}
      </Typography.Title>
      <Typography.Paragraph type="secondary">{children}</Typography.Paragraph>
    </header>
  );
}
type AuthFieldProps = Omit<InputProps, "prefix" | "name"> & {
  name: string;
  label: string;
  icon: typeof ArrowRight;
  action?: ReactNode;
  hint?: string;
};
export function AuthField({
  label,
  icon: Icon,
  action,
  hint,
  name,
  required,
  minLength,
  maxLength,
  pattern,
  type,
  ...input
}: AuthFieldProps) {
  const rules = [
    ...(required
      ? [
          {
            required: true,
            whitespace: type !== "password",
            message: `Vui lòng nhập ${label.toLowerCase()}.`,
          },
        ]
      : []),
    ...(type === "email"
      ? [{ type: "email" as const, message: "Email không hợp lệ." }]
      : []),
    ...(minLength
      ? [{ min: minLength, message: `${label} cần ít nhất ${minLength} ký tự.` }]
      : []),
    ...(maxLength
      ? [{ max: maxLength, message: `${label} tối đa ${maxLength} ký tự.` }]
      : []),
    ...(pattern
      ? [{ pattern: new RegExp("^(?:" + pattern + ")$"), message: passwordHint }]
      : []),
  ];
  const props = {
    ...input,
    prefix: <Icon style={{ fontSize: 18 }} aria-hidden />,
    maxLength,
    size: "large" as const,
  };
  return (
    <div className="auth-field">
      {action && <span className="auth-field-action">{action}</span>}
      <Form.Item name={name} label={label} extra={hint} rules={rules}>
        {type === "password" ? (
          <Input.Password {...props} />
        ) : (
          <Input {...props} type={type} />
        )}
      </Form.Item>
    </div>
  );
}
export function AuthNotice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <Alert
      role={error ? "alert" : "status"}
      type={error ? "error" : "info"}
      title={children}
      showIcon
    />
  );
}
export function AuthSubmit({
  children,
  pending,
}: {
  children: ReactNode;
  pending: boolean;
}) {
  return (
    <Button
      type="primary"
      htmlType="submit"
      loading={pending}
      block
      size="large"
      icon={!pending && <ArrowRight style={{ fontSize: 17 }} aria-hidden />}
      iconPlacement="end"
    >
      {children}
    </Button>
  );
}
export function GoogleButton() {
  return (
    <Button
      href="/api/v1/auth/google"
      block
      size="large"
      icon={
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.24 5.48-4.76 7.18l7.73 6C44.42 38.04 46.98 31.91 46.98 24.55z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.42 14.42 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.98-6.19A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.5 42.62 14.62 48 24 48z"
          />
        </svg>
      }
    >
      Tiếp tục với Google
    </Button>
  );
}
export function AuthDivider() {
  return <Divider plain>hoặc dùng email</Divider>;
}
export function AuthFooter({ children }: { children?: ReactNode }) {
  return (
    <p className="auth-footer">
      {children ?? (
        <Link href="/login" className={authLink}>
          Quay lại đăng nhập
        </Link>
      )}
    </p>
  );
}
