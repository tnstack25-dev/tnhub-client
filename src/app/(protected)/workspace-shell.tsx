"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Blocks, ChevronDown, KeyRound, Layers3, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ThemeSelect } from "@/components/theme-select";
import { apiClient } from "@/lib/axios/client";
import { ApiError } from "@/lib/axios/error";
import { canReadServices, useWorkspaceProfile } from "./workspace-data";

const destinations = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/services", label: "Dịch vụ", icon: Blocks },
  { href: "/account", label: "Tài khoản", icon: UserRound },
];

function Navigation({ pathname, showServices, close }: { pathname: string; showServices: boolean; close?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-3">
        <Link href="/dashboard" onClick={close} className="inline-flex items-center gap-3 rounded-lg text-[21px] font-semibold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
            <Layers3 size={21} aria-hidden />
          </span>
          TNHub
        </Link>
        {close && (
          <button type="button" onClick={close} aria-label="Đóng điều hướng" className="rounded-lg p-2 text-sidebar-muted hover:bg-white/10">
            <X size={21} aria-hidden />
          </button>
        )}
      </div>
      <nav aria-label="Điều hướng chính" className="mt-12">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">Không gian làm việc</p>
        <div className="space-y-1.5">
          {destinations.filter(({ href }) => href !== "/services" || showServices).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={active
                  ? "flex min-h-11 items-center gap-3 rounded-xl bg-sidebar-active px-3 text-sm font-semibold text-white"
                  : "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-muted transition hover:bg-white/10 hover:text-white"}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function WorkspaceShell({ user, children }: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useWorkspaceProfile();
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const drawer = useRef<HTMLDialogElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  const destination = destinations.find(({ href }) => pathname === href || pathname.startsWith(href + "/"));
  const title = pathname === "/change-password" ? "Đổi mật khẩu" : destination?.label ?? "Không gian làm việc";
  const name = profile.data?.fullName || user.name || profile.data?.email || user.email || "Tài khoản";
  const email = profile.data?.email ?? user.email;
  const initials = name.trim().split(/[\s@._-]+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "TN";
  const expired = profile.error instanceof ApiError && profile.error.status === 401;
  const showServices = canReadServices(profile.data);
  const closeDrawer = () => drawer.current?.close();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) drawer.current?.close();
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function closeAccount() {
    account.current?.removeAttribute("open");
  }

  async function logout() {
    if (leaving) return;
    setLeaving(true);
    setLogoutError("");
    await queryClient.cancelQueries();

    let callbackUrl = "/login";
    try {
      await apiClient.post("/session/logout");
    } catch (error) {
      if (!(error instanceof ApiError && error.code === "LOGOUT_UNCONFIRMED")) {
        setLogoutError("Chưa thể đăng xuất. Vui lòng thử lại.");
        setLeaving(false);
        return;
      }
      callbackUrl = "/login?logout=unconfirmed";
    }

    queryClient.clear();
    try {
      await signOut({ redirect: false, callbackUrl });
      closeAccount();
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setLogoutError("Phiên đã đóng. Hãy thử lại để xóa cookie đăng nhập.");
      setLeaving(false);
    }
  }

  const menuItem = "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm font-medium text-foreground hover:bg-surface-hover hover:text-brand-ink";

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#workspace-content" className="sr-only z-50 rounded-lg bg-surface p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Đến nội dung chính</a>
      <aside className="sticky top-0 hidden h-dvh overflow-y-auto bg-sidebar px-4 py-7 lg:block">
        <Navigation pathname={pathname} showServices={showServices} />
      </aside>
      <dialog
        id="workspace-navigation"
        ref={drawer}
        aria-label="Điều hướng TNHub"
        onClick={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-none bg-transparent p-0 backdrop:bg-overlay/60 lg:hidden"
      >
        <div className="h-full w-[min(84vw,272px)] overflow-y-auto bg-sidebar px-4 py-6">
          <Navigation pathname={pathname} showServices={showServices} close={closeDrawer} />
        </div>
      </dialog>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-7 xl:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => drawer.current?.showModal()} aria-label="Mở điều hướng" aria-controls="workspace-navigation" aria-haspopup="dialog" className="grid size-9 shrink-0 place-items-center rounded-lg border border-control-line text-foreground hover:bg-surface-hover lg:hidden">
              <Menu size={20} aria-hidden />
            </button>
            <nav aria-label="Vị trí hiện tại" className="flex min-w-0 items-center gap-2 text-sm">
              <Link href="/dashboard" className="hidden shrink-0 text-muted hover:text-brand-ink sm:inline">TNHub</Link>
              <span className="hidden text-muted-icon sm:inline" aria-hidden>/</span>
              <span aria-current="page" className="truncate font-semibold">{title}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeSelect />
            <details
              ref={account}
              className="relative shrink-0"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) closeAccount();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && account.current?.open) {
                  account.current.querySelector("summary")?.focus();
                  closeAccount();
                }
              }}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 text-sm hover:bg-surface-hover [&::-webkit-details-marker]:hidden">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-xs font-semibold text-brand-ink" aria-hidden>{initials}</span>
                <span className="hidden max-w-44 truncate font-semibold sm:block">{name}</span>
                <span className="sr-only sm:hidden">Tài khoản</span>
                <ChevronDown size={15} className="text-muted-icon" aria-hidden />
              </summary>
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface-raised p-2 shadow-lg shadow-panel-shadow/20">
                <div className="mb-1 border-b border-line px-2.5 pb-2 pt-1.5">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  {email && email !== name && <p className="truncate text-xs text-muted">{email}</p>}
                </div>
                <Link href="/account" onClick={closeAccount} className={menuItem}><UserRound size={17} aria-hidden />Hồ sơ tài khoản</Link>
                {profile.data?.authProvider === "LOCAL" && <Link href="/change-password" onClick={closeAccount} className={menuItem}><KeyRound size={17} aria-hidden />Đổi mật khẩu</Link>}
                <button type="button" onClick={logout} disabled={leaving} className={menuItem + " disabled:opacity-60"}><LogOut size={17} aria-hidden />{leaving ? "Đang đăng xuất…" : "Đăng xuất"}</button>
              </div>
            </details>
          </div>
        </header>

        <main id="workspace-content" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 outline-none sm:px-7 sm:py-8 xl:px-10">
          {(logoutError || expired) && (
            <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
              {logoutError || "Phiên đăng nhập đã hết hiệu lực."}
              {expired && <button type="button" onClick={logout} disabled={leaving} className="font-semibold underline">{leaving ? "Đang xử lý…" : "Về trang đăng nhập"}</button>}
            </div>
          )}
          {!leaving && !expired && children}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line bg-surface px-4 py-4 text-xs text-muted sm:px-7 xl:px-10">
          <span>© {new Date().getFullYear()} TNHub</span>
          <Link href="/account" className="inline-flex items-center gap-1.5 font-medium hover:text-brand-ink">Tài khoản <ArrowUpRight size={13} aria-hidden /></Link>
        </footer>
      </div>
    </div>
  );
}
