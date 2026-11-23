"use client";
import "./media.css";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Image,
  Input,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { updateMedia } from "./media-api";
import { fileSize, safeImageUrl } from "@/lib/media/validation";
import { LoadError, useDrawerGuard } from "@/components/admin/admin-ui";
import { useMediaDetail, useRefreshMedia } from "./media-queries";

export function MediaDetail({
  id,
  trash,
  editable,
  onClose,
  onSaved,
}: {
  id: string;
  trash: boolean;
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const query = useMediaDetail(id, trash);
  const guard = useDrawerGuard(onClose);
  const refresh = useRefreshMedia();
  const { message } = App.useApp();
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: (values: { altText?: string }) => updateMedia(id, values),
    onSuccess: async () => {
      onSaved();
      void message.success("Đã cập nhật mô tả ảnh.");
      await refresh();
    },
  });
  const item = query.data;
  const url = item ? safeImageUrl(item.secureUrl) : undefined;
  return (
    <Drawer open title="Chi tiết media" size={620} onClose={guard.requestClose}>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : !item ? (
        <Skeleton active />
      ) : (
        <Flex vertical gap={20}>
          <div className="media-detail-preview">
            {url ? (
              <Image
                src={url}
                alt={item.altText || item.originalName}
                referrerPolicy="no-referrer"
                style={{ maxHeight: 360, objectFit: "contain" }}
              />
            ) : (
              <PictureOutlined />
            )}
          </div>
          <div>
            <Typography.Title level={4} className="media-filename">
              {item.originalName}
            </Typography.Title>
            <Space>
              <Tag>{item.format.toUpperCase()}</Tag>
              {trash && <Tag color="warning">Trong thùng rác</Tag>}
            </Space>
          </div>
          <Descriptions
            size="small"
            column={1}
            bordered
            items={[
              { key: "bytes", label: "Dung lượng", children: fileSize(item.bytes) },
              {
                key: "size",
                label: "Kích thước",
                children:
                  item.width && item.height
                    ? item.width + " × " + item.height + " px"
                    : "Chưa có thông tin",
              },
              {
                key: "uploaded",
                label: "Ngày tải",
                children: new Date(item.createdAt).toLocaleString("vi-VN"),
              },
              {
                key: "uploader",
                label: "ID người tải",
                children: item.uploadedById || "Không xác định",
              },
              {
                key: "public",
                label: "Public ID",
                children: (
                  <Typography.Text className="media-filename">
                    {item.publicId}
                  </Typography.Text>
                ),
              },
            ]}
          />
          {url && (
            <div>
              <Typography.Text type="secondary">Đường dẫn ảnh</Typography.Text>
              <Typography.Paragraph copyable={{ text: url }} className="media-filename">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </Typography.Paragraph>
            </div>
          )}
          {editable && !trash ? (
            <Form
              layout="vertical"
              initialValues={{ altText: item.altText ?? "" }}
              disabled={mutation.isPending}
              onValuesChange={guard.markDirty}
              onFinish={(v) => mutation.mutate(v)}
            >
              {mutation.isError && (
                <Alert type="error" role="alert" title={mutation.error.message} />
              )}
              <Form.Item name="altText" label="Mô tả thay thế" rules={[{ max: 255 }]}>
                <Input.TextArea rows={3} maxLength={255} showCount />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                Lưu mô tả
              </Button>
            </Form>
          ) : (
            <div>
              <Typography.Text type="secondary">Mô tả thay thế</Typography.Text>
              <Typography.Paragraph>
                {item.altText || "Chưa có mô tả"}
              </Typography.Paragraph>
            </div>
          )}
        </Flex>
      )}
    </Drawer>
  );
}
