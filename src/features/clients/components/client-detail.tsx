"use client";
import { Space, Tag } from "antd";
import { EntityDetail } from "@/features/admin/components/entity-detail";
import { StatusTag } from "@/components/admin/admin-ui";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { CLIENT_TYPE_LABELS, type Client } from "../clients-types";
import { ClientContactsManager } from "./client-contacts";

const clientDetailLabels: Record<string, string> = {
  email: "Email",
  phone: "Số điện thoại",
  websiteUrl: "Website",
  taxCode: "Mã số thuế",
  address: "Địa chỉ",
  source: "Nguồn khách hàng",
  notes: "Ghi chú",
  createdAt: "Ngày tạo",
  updatedAt: "Cập nhật lần cuối",
  deletedAt: "Ngày xóa",
};

export function ClientDetail({
  id,
  trash,
  onClose,
}: {
  id: string;
  trash: boolean;
  onClose: () => void;
}) {
  const profile = useWorkspaceProfile();
  const canUpdate = allowed(profile.data, "clients.update");

  return (
    <EntityDetail<Client>
      resource="clients"
      id={id}
      trash={trash}
      onClose={onClose}
      labels={clientDetailLabels}
      getTitle={(item) => item.name}
      renderStatus={(item) => (
        <Space wrap>
          <StatusTag status={item.status} />
          <Tag color={item.clientType === "BUSINESS" ? "blue" : "cyan"}>
            {CLIENT_TYPE_LABELS[item.clientType] ?? item.clientType}
          </Tag>
          {item.source && <Tag>Nguồn: {item.source}</Tag>}
        </Space>
      )}
      sections={[
        {
          title: "",
          render: (item) => (
            <ClientContactsManager
              clientId={item.id}
              trash={trash}
              canUpdate={canUpdate}
            />
          ),
        },
      ]}
    />
  );
}
