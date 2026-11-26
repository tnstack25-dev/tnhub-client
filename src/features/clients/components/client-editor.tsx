"use client";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { saveClient } from "../clients-api";
import type { Client } from "../clients-types";
import { ClientFields } from "./client-fields";

export function ClientEditor({ id, onClose }: { id?: string; onClose: () => void }) {
  return (
    <ResourceEditor<Client>
      resource="clients"
      id={id}
      title={id ? "Chỉnh sửa khách hàng" : "Tạo khách hàng mới"}
      save={saveClient}
      onClose={onClose}
      initialValues={(item) =>
        item
          ? {
              name: item.name,
              clientType: item.clientType,
              status: item.status,
              email: item.email ?? "",
              phone: item.phone ?? "",
              websiteUrl: item.websiteUrl ?? "",
              taxCode: item.taxCode ?? "",
              address: item.address ?? "",
              source: item.source ?? "",
              notes: item.notes ?? "",
            }
          : { clientType: "BUSINESS", status: "ACTIVE" }
      }
    >
      <ClientFields />
    </ResourceEditor>
  );
}
