"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

export const authLink =
  "font-semibold text-brand-ink underline-offset-4 hover:underline";
export const passwordHint =
  "12–72 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";
export const passwordPattern =
  "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,72}";
export const authButton =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-60";

export function AuthHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col items-center text-center">
      <span className="mb-5 grid size-12 place-items-center rounded-2xl border border-line bg-brand-soft text-brand-ink">
        <Icon size={23} strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] sm:text-[2.5rem] uppercase">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px] uppercase">
        {children}
      </p>
    </header>
  );
}

export function AuthField({
  label,
  icon: Icon,
  action,
  hint,
  ...input
}: ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  action?: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = input.type === "password";
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {action}
      </div>
      <div className="flex min-h-12 items-center gap-3 rounded-xl border border-control-line bg-surface px-3.5 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/25">
        <Icon
          size={18}
          strokeWidth={1.75}
          className="shrink-0 text-muted-icon"
          aria-hidden
        />
        <input
          {...input}
          id={id}
          type={isPassword && visible ? "text" : input.type}
          aria-describedby={hint ? id + "-hint" : undefined}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-icon sm:text-sm"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="-mr-1 grid size-9 shrink-0 place-items-center rounded-md text-muted-icon hover:bg-surface-hover"
          >
            {visible ? (
              <EyeOff size={18} aria-hidden />
            ) : (
              <Eye size={18} aria-hidden />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p
          id={id + "-hint"}
          className="mt-2 text-xs leading-relaxed text-muted"
        >
          {hint}
        </p>
      )}
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
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
          : "rounded-xl border border-line bg-surface-hover px-4 py-3 text-sm leading-relaxed text-brand-ink"
      }
    >
      {children}
    </p>
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
    <button className={authButton} type="submit" disabled={pending}>
      {children} {!pending && <ArrowRight size={17} aria-hidden />}
    </button>
  );
}

export function GoogleButton() {
  return (
    <a
      href="/api/v1/auth/google"
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-control-line bg-surface px-4 text-sm font-semibold transition hover:border-focus hover:bg-surface-hover"
    >
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
      Tiếp tục với Google
    </a>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-4 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
      hoặc dùng email
    </div>
  );
}

export function AuthFooter({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-6 text-center text-sm leading-relaxed text-muted">
      {children ?? (
        <Link href="/login" className={authLink}>
          Quay lại đăng nhập
        </Link>
      )}
    </p>
  );
}
