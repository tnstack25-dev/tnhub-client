import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { WorkspaceShell } from "./workspace-shell";

async function RequireSession({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return <WorkspaceShell user={{ name: session.user.name, email: session.user.email }}>{children}</WorkspaceShell>;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Đang kiểm tra phiên đăng nhập…</p>}>
      <RequireSession>{children}</RequireSession>
    </Suspense>
  );
}
