"use client";
import "./audit-logs.css";
import { Alert, Descriptions, Drawer, Skeleton, Space, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { LoadError } from "@/components/admin/admin-ui";
import { useAuditDetail } from "./audit-queries";

export function IntegrityTag({ value }: { value: boolean | null }) {
  return (
    <Tag
      icon={
        value === true ? (
          <CheckCircleOutlined />
        ) : value === false ? (
          <CloseCircleOutlined />
        ) : (
          <QuestionCircleOutlined />
        )
      }
      color={value === true ? "success" : value === false ? "error" : "default"}
    >
      {value === true ? "Hợp lệ" : value === false ? "Không hợp lệ" : "Chưa xác minh"}
    </Tag>
  );
}
export function SeverityTag({ severity }: { severity: string }) {
  const labels: Record<string, string> = {
    INFO: "Thông tin",
    WARNING: "Cảnh báo",
    ERROR: "Lỗi",
    CRITICAL: "Nghiêm trọng",
  };
  return (
    <Tag
      color={
        severity === "CRITICAL" || severity === "ERROR"
          ? "error"
          : severity === "WARNING"
            ? "warning"
            : "blue"
      }
    >
      {labels[severity] ?? severity}
    </Tag>
  );
}
export function AuditDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const query = useAuditDetail(id);
  const item = query.data;
  return (
    <Drawer open title="Chi tiết audit log" size={720} onClose={onClose}>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : !item ? (
        <Skeleton active />
      ) : (
        <Space orientation="vertical" size={24} style={{ width: "100%" }}>
          <div>
            <Typography.Title level={4} className="audit-value">
              {item.eventType}
            </Typography.Title>
            <Space wrap>
              <SeverityTag severity={item.severity} />
              <IntegrityTag value={item.integrityValid} />
            </Space>
          </div>
          {item.integrityValid === false && (
            <Alert
              type="error"
              showIcon
              title="Kiểm tra toàn vẹn không đạt"
              description="Dữ liệu hoặc khóa ký có thể đã thay đổi. Cần kiểm tra nhật ký và cấu hình khóa trước khi kết luận."
            />
          )}
          {item.integrityValid === null && (
            <Alert
              type="info"
              showIcon
              title="Bản ghi chưa có thông tin xác minh toàn vẹn"
            />
          )}
          <Descriptions
            column={1}
            bordered
            size="small"
            items={[
              {
                key: "id",
                label: "ID sự kiện",
                children: (
                  <Typography.Text copyable className="audit-value">
                    {item.id}
                  </Typography.Text>
                ),
              },
              {
                key: "date",
                label: "Thời gian",
                children: new Date(item.createdAt).toLocaleString("vi-VN"),
              },
              {
                key: "email",
                label: "Người thực hiện",
                children: item.email || "Hệ thống / Không xác định",
              },
              {
                key: "user",
                label: "User ID",
                children: <span className="audit-value">{item.userId || "—"}</span>,
              },
              {
                key: "session",
                label: "Session ID",
                children: <span className="audit-value">{item.sessionId || "—"}</span>,
              },
              { key: "ip", label: "Địa chỉ IP", children: item.ipAddress || "—" },
              {
                key: "ua",
                label: "User agent",
                children: <span className="audit-value">{item.userAgent || "—"}</span>,
              },
              {
                key: "key",
                label: "Mã khóa xác minh",
                children: item.integrityKeyId || "—",
              },
            ]}
          />
          <div>
            <Typography.Title level={5}>Dữ liệu sự kiện</Typography.Title>
            <Typography.Paragraph
              copyable={{ text: JSON.stringify(item.metadata ?? {}, null, 2) }}
            >
              Sao chép JSON
            </Typography.Paragraph>
            <pre className="audit-metadata">
              {JSON.stringify(item.metadata ?? {}, null, 2)}
            </pre>
          </div>
        </Space>
      )}
    </Drawer>
  );
}
