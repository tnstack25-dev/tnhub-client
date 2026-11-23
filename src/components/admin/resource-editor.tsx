"use client";
import type { ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, App, Button, Drawer, Flex, Form, Skeleton } from "antd";
import { useAdminDetail, useRefreshAdmin } from "@/lib/admin/admin-queries";
import type { Resource } from "@/lib/admin/resource-types";
import { LoadError, useDrawerGuard } from "./admin-ui";

type Props<T> = {
  resource: Resource;
  id?: string;
  title: string;
  initialValues: (item?: T) => Record<string, unknown>;
  save: (values: Record<string, unknown>, id?: string) => Promise<void>;
  children: ReactNode;
  onClose: () => void;
};

export function ResourceEditor<T>(props: Props<T>) {
  const guard = useDrawerGuard(props.onClose);
  const detail = useAdminDetail<T>(props.resource, props.id ?? "", Boolean(props.id));
  return <Drawer open size={580} title={props.title} onClose={guard.requestClose} destroyOnHidden>
    {props.id && detail.isError ? <LoadError error={detail.error} retry={() => void detail.refetch()} />
      : props.id && !detail.data ? <Skeleton active />
        : <EditorForm key={props.id ?? "new"} {...props} item={detail.data} guard={guard} />}
  </Drawer>;
}

function EditorForm<T>({ resource, id, initialValues, item, save, children, onClose, guard }: Props<T> & {
  item?: T;
  guard: ReturnType<typeof useDrawerGuard>;
}) {
  const { message } = App.useApp();
  const refresh = useRefreshAdmin(resource);
  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => save(values, id),
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    onSuccess: async () => {
      void message.success("Đã lưu thành công.");
      await refresh();
      onClose();
    },
  });
  return <Form
    layout="vertical"
    initialValues={initialValues(item)}
    onValuesChange={guard.markDirty}
    onFinish={values => mutation.mutate(values)}
    disabled={mutation.isPending}>
    {mutation.isError && <Alert
      role="alert"
      type="error"
      showIcon
      title={mutation.error.message}
      style={{ marginBottom: 20 }} />}
    {children}
    <Flex justify="end" gap={8} className="access-drawer-footer">
      <Button onClick={guard.requestClose}>Hủy</Button>
      <Button type="primary" htmlType="submit" loading={mutation.isPending}>Lưu thay đổi</Button>
    </Flex>
  </Form>;
}
