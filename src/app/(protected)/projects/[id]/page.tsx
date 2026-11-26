import { Suspense } from "react";
import { Skeleton } from "antd";
import { ProjectWorkspaceView } from "@/features/projects/components/project-workspace";

export const metadata = { title: "Không gian dự án & Công việc | TNHub" };

async function ProjectWorkspaceLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectWorkspaceView projectId={id} />;
}

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton active />}>
      <ProjectWorkspaceLoader params={params} />
    </Suspense>
  );
}
