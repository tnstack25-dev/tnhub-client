import { Suspense } from "react";

import { AccountForm } from "../account-form";

export const metadata = { title: "Tạo tài khoản | TNHub", referrer: "no-referrer" as const };

export default function Page() {
  return (
    <Suspense fallback={<h1 className="text-4xl font-semibold">Tạo tài khoản</h1>}>
      <AccountForm page="register" />
    </Suspense>
  );
}
