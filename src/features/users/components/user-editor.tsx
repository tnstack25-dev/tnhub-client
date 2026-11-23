"use client";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { saveUser } from "../users-api";
import type { Member } from "../users-types";
import { UserFields } from "./user-fields";

export function UserEditor({ id, onClose }: { id?: string; onClose: () => void; }) {
  return <ResourceEditor<Member>
    resource="users"
    id={id}
    title={id ? "Chỉnh sửa người dùng" : "Tạo người dùng"}
    save={saveUser}
    onClose={onClose}
    initialValues={item => item ? { ...item, dateOfBirth: item.dateOfBirth?.slice(0, 10) }
      : { status: "ACTIVE", authProvider: "LOCAL", isVerified: false }}>
    <UserFields id={id} />
  </ResourceEditor>;
}
