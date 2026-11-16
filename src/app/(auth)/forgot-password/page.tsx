import { Suspense } from "react";

import { AccountForm } from "../account-form";

export const metadata = { title: "Quên mật khẩu | TNHub", referrer: "no-referrer" as const };

export default function Page() {
  return (
    <Suspense fallback={<h1 className="text-4xl font-semibold">Quên mật khẩu</h1>}>
      <AccountForm page="forgot-password" />
    </Suspense>
  );
}
