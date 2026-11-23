"use client";
import "../services.css";

import { Empty, Table, Tag, type TableColumnsType } from "antd";
import type { ServicePage } from "../services-types";

type Service = ServicePage["items"][number];
const columns: TableColumnsType<Service> = [
  {
    title: "Dịch vụ",
    dataIndex: "name",
    key: "name",
    render: (name: string, service) => (
      <div className="service-name-cell">
        <div className="service-name">{name}</div>
        <div className="service-code">{service.code}</div>
      </div>
    ),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "status",
    width: 180,
    render: (active: boolean) => (
      <Tag color={active ? "success" : "default"}>
        {active ? "Đang hoạt động" : "Đã tắt"}
      </Tag>
    ),
  },
];

export function ServiceTable({
  data,
  paginate,
}: {
  data: ServicePage;
  paginate?: (page: number) => void;
}) {
  return (
    <Table<Service>
      rowKey="id"
      columns={columns}
      dataSource={data.items}
      scroll={{ x: 440 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có dịch vụ nào."
          />
        ),
      }}
      pagination={
        paginate
          ? {
              current: data.meta.page,
              pageSize: data.meta.limit,
              total: data.meta.total,
              onChange: paginate,
              showSizeChanger: false,
              hideOnSinglePage: true,
              showTotal: (total) => `${total} dịch vụ`,
              responsive: true,
            }
          : false
      }
    />
  );
}
