"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { InboxOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Progress,
  Space,
  Typography,
  Upload,
  type UploadFile,
} from "antd";
import { uploadMediaFiles } from "./media-api";
import { IMAGE_TYPES, imageError } from "@/lib/media/validation";
import { useDrawerGuard } from "@/components/admin/admin-ui";
import { useRefreshMedia } from "./media-queries";

export function MediaUpload({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { message } = App.useApp();
  const guard = useDrawerGuard(onClose);
  const refresh = useRefreshMedia();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [progress, setProgress] = useState({ index: 0, total: 0, percent: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: async ({ altText }: { altText?: string }) => {
      const { succeeded, failures } = await uploadMediaFiles(files.map(item => ({ uid: item.uid, name: item.name, file: item.originFileObj })), altText, setProgress);
      setErrors(failures);
      setFiles((old) => old.filter((f) => !succeeded.includes(f.uid)));
      return { succeeded, failures };
    },
    onSuccess: async ({ succeeded, failures }) => {
      if (succeeded.length) {
        void message.success("Đã tải " + succeeded.length + " ảnh.");
        onUploaded();
      }
      await refresh();
      if (!failures.length) onClose();
    },
  });
  return (
    <Drawer
      open
      title="Tải ảnh lên thư viện"
      size={580}
      onClose={guard.requestClose}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        onFinish={(v) => mutation.mutate(v)}
        disabled={mutation.isPending}
      >
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <Typography.Paragraph type="secondary">
            JPEG, PNG, GIF, WebP hoặc AVIF · Tối đa 10 MB/ảnh, 10 ảnh mỗi lượt.
          </Typography.Paragraph>
          <Upload.Dragger
            accept={IMAGE_TYPES.join(",")}
            multiple
            maxCount={10}
            fileList={files}
            disabled={mutation.isPending}
            beforeUpload={(file) => {
              const error = imageError(file);
              if (error) {
                void message.error(error);
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            onChange={({ fileList }) => {
              guard.markDirty();
              setFiles(fileList);
              setErrors([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo ảnh vào đây hoặc nhấn để chọn</p>
            <p className="ant-upload-hint">Ảnh được lưu qua backend của dự án</p>
          </Upload.Dragger>
          <Form.Item
            name="altText"
            label="Mô tả thay thế"
            rules={[{ max: 255 }]}
            extra="Áp dụng cho các ảnh trong lượt tải này; có thể sửa riêng sau khi tải."
          >
            <Input.TextArea
              rows={3}
              maxLength={255}
              showCount
              onChange={guard.markDirty}
            />
          </Form.Item>
          {mutation.isPending && (
            <div role="status">
              <Typography.Text>
                Đang tải ảnh {progress.index}/{progress.total}
              </Typography.Text>
              <Progress percent={progress.percent} status="active" />
              <Typography.Text type="secondary">
                Tiến trình hiển thị dung lượng gửi; vui lòng đợi server lưu ảnh.
              </Typography.Text>
            </div>
          )}
          {errors.length > 0 && (
            <Alert
              type="error"
              showIcon
              role="alert"
              title="Một số ảnh chưa tải được"
              description={
                <ul>
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              }
            />
          )}
          <Flex justify="end" gap={8} className="access-drawer-footer">
            <Button disabled={mutation.isPending} onClick={guard.requestClose}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!files.length}
              loading={mutation.isPending}
            >
              {errors.length ? "Tải lại ảnh lỗi" : "Tải " + files.length + " ảnh"}
            </Button>
          </Flex>
        </Space>
      </Form>
    </Drawer>
  );
}
