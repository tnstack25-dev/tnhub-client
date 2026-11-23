"use client";
import "./media-picker-field.css";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CameraOutlined, DeleteOutlined, PictureOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Flex, Typography } from "antd";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { safeImageUrl } from "@/lib/media/validation";
import { toPickerValue } from "../media-selection";
import type { MediaPickerValue } from "../media-types";

const MediaPickerModal = dynamic(() => import("./media-picker-modal").then(module => module.MediaPickerModal), {
  loading: () => <span role="status">Đang mở thư viện ảnh…</span>,
});

export type MediaPickerFieldProps = {
  value?: MediaPickerValue[];
  onChange?: (value: MediaPickerValue[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  maxCount?: number;
  allowUpload?: boolean;
  shape?: "circle" | "square";
  title?: string;
  chooseText?: string;
  id?: string;
  presentation?: "inline" | "avatar";
};

// Controlled array value integrates with Form.Item and URL-only legacy images.
export function MediaPickerField({ value = [], onChange, disabled = false, multiple = false, maxCount = 10,
  allowUpload = true, shape = "square", title, chooseText = "Chọn ảnh", id, presentation = "inline" }: MediaPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const profile = useWorkspaceProfile();
  const canSelect = allowed(profile.data, "media.read") || (allowUpload && allowed(profile.data, "media.create"));

  return <Flex vertical gap={12} className={presentation === "avatar" ? "account-avatar-control" : undefined}>
    {presentation === "avatar" ? <>
      <div className="account-avatar-ring">
        <Avatar size={112} src={safeImageUrl(value[0]?.url ?? "")} icon={<UserOutlined />} />
        <span className="account-avatar-camera" aria-hidden><CameraOutlined /></span>
      </div>
      <Button id={id} disabled={disabled || (!canSelect && !value.length)} icon={<CameraOutlined />} onClick={() => setOpen(true)}>
        {chooseText}
      </Button>
    </> :
    <Flex wrap gap={16} align="center">
      {!value.length && <Avatar shape={shape} size={80} icon={shape === "circle" ? <UserOutlined /> : <PictureOutlined />} />}
      {value.map((image, index) => <Flex key={image.id ?? index} vertical align="center" gap={6}>
        <Avatar shape={shape} size={80} src={safeImageUrl(image.url)} icon={shape === "circle" ? <UserOutlined /> : <PictureOutlined />} />
        <Button type="text" danger size="small" disabled={disabled} icon={<DeleteOutlined />}
          aria-label={`Gỡ ảnh ${image.name ?? index + 1}`}
          onClick={() => onChange?.(value.filter((_, position) => position !== index))}>Gỡ ảnh</Button>
      </Flex>)}
      <Button id={id} disabled={disabled || !canSelect} icon={<PictureOutlined />} onClick={() => setOpen(true)}>
        {chooseText}
      </Button>
    </Flex>}
    {!canSelect && !profile.isPending && <Typography.Text type="secondary">Bạn chưa có quyền chọn hoặc tải ảnh từ media.</Typography.Text>}
    {open && <MediaPickerModal open onCancel={() => setOpen(false)} multiple={multiple} maxCount={maxCount}
      allowUpload={allowUpload} title={title} selectedIds={value.flatMap(item => item.id ? [item.id] : [])}
      onClear={value.length ? () => { onChange?.([]); setOpen(false); } : undefined}
      onConfirm={items => { onChange?.(items.map(toPickerValue)); setOpen(false); }} />}
  </Flex>;
}
