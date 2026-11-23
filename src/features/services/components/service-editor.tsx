"use client";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { saveService } from "../services-api";
import type { Service } from "../services-types";
import { ServiceFields } from "./service-fields";

export function ServiceEditor({ id, onClose }: { id?: string; onClose: () => void; }) {
  return <ResourceEditor<Service>
    resource="services"
    id={id}
    title={id ? "Chỉnh sửa dịch vụ" : "Tạo dịch vụ"}
    save={saveService}
    onClose={onClose}
    initialValues={item => item ? { ...item } : { isActive: true, defaultPrice: "0", category: "WEB" }}>
    <ServiceFields id={id} />
  </ResourceEditor>;
}
