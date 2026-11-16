import { Suspense } from "react";

import { AccountForm } from "../account-form";

export const metadata = { title: "Xác minh email | TNHub", referrer: "no-referrer" as const };

export default function Page() {
  return (
    <Suspense fallback={<h1 className="text-4xl font-semibold">Xác minh email</h1>}>
      <AccountForm page="verify-email" />
    </Suspense>
  );
}
