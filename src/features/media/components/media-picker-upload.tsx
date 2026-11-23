"use client";
import "./media-picker-upload.css";

import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { InboxOutlined } from "@ant-design/icons";
import { Alert, App, Button, Flex, Input, Progress, Typography, Upload, type UploadFile } from "antd";
import { IMAGE_TYPES, imageError } from "@/lib/media/validation";
import { uploadMediaFile, type UploadProgress } from "../media-api";
import { useRefreshMedia } from "../media-queries";
import type { MediaItem } from "../media-types";

export function MediaPickerUpload({ multiple, maxFiles, disabled, onBusyChange, onUploaded }: {
  multiple: boolean;
  maxFiles: number;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onUploaded: (item: MediaItem) => void;
}) {
  const { message } = App.useApp();
  const altTextId = useId();
  const refresh = useRefreshMedia();
  const controller = useRef<AbortController | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [altText, setAltText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<UploadProgress>({ index: 0, total: 0, percent: 0 });
  useEffect(() => () => controller.current?.abort(), []);

  const mutation = useMutation({
    onMutate: () => { onBusyChange(true); setErrors([]); },
    mutationFn: async () => {
      controller.current = new AbortController();
      const uploaded: string[] = [];
      const failures: string[] = [];
      const batch = files.slice(0, maxFiles);
      for (const [index, item] of batch.entries()) {
        if (controller.current.signal.aborted) break;
        setProgress({ index: index + 1, total: batch.length, percent: 0 });
        try {
          if (!item.originFileObj) throw new Error("Không đọc được ảnh.");
          const media = await uploadMediaFile(item.originFileObj, altText, {
            signal: controller.current.signal,
            onProgress: percent => setProgress({ index: index + 1, total: batch.length, percent }),
          });
          onUploaded(media);
          uploaded.push(item.uid);
        } catch (error) {
          if (controller.current.signal.aborted) break;
          failures.push(`${item.name}: ${error instanceof Error ? error.message : "Chưa thể tải ảnh."}`);
        }
      }
      setFiles(previous => previous.filter(item => !uploaded.includes(item.uid)));
      setErrors(failures);
      if (uploaded.length) void message.success(`Đã tải ${uploaded.length} ảnh. Nhấn “Chọn ảnh” để sử dụng.`);
      await refresh();
    },
    onSettled: () => onBusyChange(false),
  });
  const busy = disabled || mutation.isPending;

  return <Flex vertical gap={18} className="media-picker-upload">
    <div className="media-picker-upload-heading"><Typography.Title level={5}>Thêm hình ảnh mới</Typography.Title>
      <Typography.Text type="secondary">Tải ảnh để sử dụng ngay và lưu vào thư viện của bạn.</Typography.Text></div>
    <Upload.Dragger accept={IMAGE_TYPES.join(",")} multiple={multiple} maxCount={Math.max(1, maxFiles)}
      fileList={files} disabled={busy || maxFiles <= 0}
      beforeUpload={file => {
        const error = imageError(file);
        if (error) { void message.error(error); return Upload.LIST_IGNORE; }
        return false;
      }}
      onChange={({ fileList }) => { setFiles(fileList); setErrors([]); }}>
      <p className="ant-upload-drag-icon"><span className="media-picker-upload-symbol"><InboxOutlined /></span></p>
      <p className="ant-upload-text">Kéo thả ảnh vào đây</p>
      <p className="ant-upload-hint">hoặc nhấn để chọn ảnh từ thiết bị</p>
      <div className="media-picker-upload-formats"><span>JPG</span><span>PNG</span><span>GIF</span><span>WEBP</span><span>AVIF</span></div>
      <p className="ant-upload-hint">Dung lượng tối đa 10 MB mỗi ảnh</p>
    </Upload.Dragger>
    {maxFiles <= 0 && <Alert type="info" showIcon title="Đã đủ số ảnh. Bỏ chọn một ảnh để tải thêm." />}
    <label htmlFor={altTextId}>Mô tả thay thế</label>
    <Input.TextArea id={altTextId} value={altText} onChange={event => setAltText(event.target.value)}
      maxLength={255} rows={2} showCount disabled={busy} />
    {mutation.isPending && <div role="status" aria-live="polite">
      <Typography.Text>Đang tải ảnh {progress.index}/{progress.total}…</Typography.Text>
      <Progress percent={progress.percent} />
      <Typography.Text type="secondary">Vui lòng chờ ảnh được lưu hoàn tất.</Typography.Text>
    </div>}
    {errors.length > 0 && <Alert type="error" showIcon role="alert" title="Một số ảnh chưa tải được"
      description={<ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>} />}
    {mutation.isError && <Alert type="error" showIcon role="alert" title={mutation.error.message} />}
    <Flex justify="end">
      <Button type="primary" loading={mutation.isPending} disabled={busy || !files.length || maxFiles <= 0}
        onClick={() => mutation.mutate()}>{errors.length ? "Tải lại ảnh lỗi" : "Tải ảnh lên"}</Button>
    </Flex>
    <Typography.Text type="secondary">Ảnh đã tải vẫn nằm trong thư viện nếu bạn đóng popup mà chưa chọn ảnh.</Typography.Text>
  </Flex>;
}
