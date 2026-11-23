import { Suspense } from "react";
import Link from "next/link";

import { AuthFooter, authLink } from "@/components/auth/auth-ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Đăng nhập | TNHub" };

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<h1 className="auth-page-title">Đăng nhập</h1>}>
        <LoginForm />
      </Suspense>
      <AuthFooter>
        Chưa có tài khoản?{" "}
        <Link href="/register" className={authLink}>
          Tạo tài khoản
        </Link>
      </AuthFooter>
    </>
  );
}
