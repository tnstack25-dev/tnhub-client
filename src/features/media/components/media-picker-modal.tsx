"use client";
import "./media-picker-modal.css";

import { useState } from "react";
import { CheckCircleFilled, CloudUploadOutlined, DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, App, Button, Image, Modal, Skeleton, Space, Tabs, Tag, Typography } from "antd";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { fileSize, safeImageUrl } from "@/lib/media/validation";
import { queryKeys } from "@/lib/query-keys";
import { getMedia } from "../media-api";
import { isSelectableImage, selectionLimit, toggleMediaSelection } from "../media-selection";
import type { MediaItem } from "../media-types";
import { MediaPickerLibrary } from "./media-picker-library";
import { MediaPickerUpload } from "./media-picker-upload";

export type MediaPickerModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (items: MediaItem[]) => void;
  onClear?: () => void;
  selectedIds?: string[];
  multiple?: boolean;
  maxCount?: number;
  allowUpload?: boolean;
  title?: string;
  confirmText?: string;
};

export function MediaPickerModal(props: MediaPickerModalProps) {
  // A fresh session discards unconfirmed selections and filters whenever the popup closes.
  return props.open ? <PickerSession {...props} /> : null;
}

function PickerSession({ onCancel, onConfirm, onClear, selectedIds = [], multiple = false, maxCount = 10,
  allowUpload = true, title = "Chọn ảnh từ thư viện", confirmText = "Chọn ảnh" }: MediaPickerModalProps) {
  const { message } = App.useApp();
  const profile = useWorkspaceProfile();
  const canRead = allowed(profile.data, "media.read");
  const canUpload = allowUpload && allowed(profile.data, "media.create");
  const limit = selectionLimit(multiple, maxCount);
  const [initialIds] = useState(() => [...new Set(selectedIds)].slice(0, limit));
  const [selected, setSelected] = useState(initialIds);
  const [known, setKnown] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState(canRead ? "library" : "upload");
  const initial = useQuery({
    queryKey: queryKeys.mediaPickerSelection(initialIds),
    enabled: canRead && initialIds.length > 0,
    staleTime: 0,
    queryFn: ({ signal }) => Promise.all(initialIds.map(id => getMedia(id, false, signal))),
  });
  const byId = new Map([...(initial.data ?? []), ...known].map(item => [item.id, item]));
  const preview = selected.length ? byId.get(selected[selected.length - 1]) : undefined;
  const remember = (item: MediaItem) => setKnown(previous => [...previous.filter(value => value.id !== item.id), item]);

  function toggle(item: MediaItem) {
    if (!isSelectableImage(item)) return;
    if (multiple && selected.length >= limit && !selected.includes(item.id)) {
      void message.info(`Chỉ được chọn tối đa ${limit} ảnh.`);
      return;
    }
    remember(item);
    setSelected(previous => toggleMediaSelection(previous, item.id, multiple, limit));
  }

  const confirm = useMutation({
    mutationFn: async () => {
      if (!selected.length) throw new Error("Vui lòng chọn ảnh.");
      // Validate active media again; a selected image may have been deleted in another screen.
      const items = await Promise.all(selected.map(async id => canRead ? getMedia(id, false) : byId.get(id)));
      if (items.some(item => !item || !isSelectableImage(item))) throw new Error("Một số ảnh không còn khả dụng. Vui lòng chọn lại.");
      return items.filter((item): item is MediaItem => Boolean(item));
    },
    onSuccess: onConfirm,
  });
  const busy = uploading || confirm.isPending;

  return <Modal open centered className="media-picker-modal" width={1080}
    title={<div className="media-picker-heading">
      <span className="media-picker-heading-icon"><PictureOutlined /></span>
      <div><span className="media-picker-eyebrow">THƯ VIỆN MEDIA</span>
        <Typography.Title level={4}>{title}</Typography.Title>
        <Typography.Text type="secondary">Chọn ảnh có sẵn hoặc tải lên một hình ảnh mới.</Typography.Text>
      </div>
    </div>}
    destroyOnHidden onCancel={() => { if (!busy) onCancel(); }} closable={!busy} keyboard={!busy} mask={{ closable: !busy }}
    footer={<div className="media-picker-footer">
      <div className="media-picker-footer-status"><CheckCircleFilled /><span>Đã chọn <strong>{selected.length}</strong> / {limit} ảnh</span></div>
      <Space><Button disabled={busy} onClick={onCancel}>Hủy</Button>
        <Button type="primary" icon={<CheckCircleFilled />} loading={confirm.isPending}
          disabled={busy || !selected.length || (!canRead && !canUpload)} onClick={() => confirm.mutate()}>{confirmText}</Button>
      </Space>
    </div>}>
    <div className="media-picker-workspace">
      <div className="media-picker-main">
        {profile.isError && <Alert type="error" showIcon title="Chưa thể kiểm tra quyền truy cập media." />}
        {!canRead && !canUpload ? <Alert type="info" showIcon title="Bạn chưa có quyền chọn hoặc tải ảnh. Liên hệ quản trị viên để được cấp quyền media." />
          : <Tabs className="media-picker-tabs" activeKey={tab} onChange={value => { if (!busy) setTab(value); }} destroyOnHidden items={[
            { key: "library", label: "Thư viện ảnh", icon: <PictureOutlined />, disabled: busy || !canRead,
              children: <MediaPickerLibrary canRead={canRead} userId={profile.data?.id} selectedIds={selected} disabled={busy} onToggle={toggle} /> },
            ...(canUpload ? [{ key: "upload", label: "Tải ảnh lên", icon: <CloudUploadOutlined />, disabled: busy,
              children: <MediaPickerUpload multiple={multiple} maxFiles={multiple ? Math.min(10, limit - selected.length) : 1}
                disabled={confirm.isPending} onBusyChange={setUploading} onUploaded={item => {
                  if (!isSelectableImage(item)) throw new Error("Ảnh vừa tải không đủ điều kiện để chọn.");
                  remember(item);
                  setSelected(previous => multiple ? [...new Set([...previous, item.id])].slice(0, limit) : [item.id]);
                }} /> }] : []),
          ]} />}
      </div>
      <aside className="media-picker-sidebar" aria-label="Xem trước ảnh đang chọn">
        <div className="media-picker-sidebar-heading"><Typography.Text strong>Ảnh đang chọn</Typography.Text>
          <span className="media-picker-selection-count">{selected.length}/{limit}</span>
        </div>
        <div className="media-picker-preview-visual">
          {preview ? <Image src={safeImageUrl(preview.secureUrl)} alt={preview.altText || preview.originalName}
            preview={false} referrerPolicy="no-referrer" />
            : initial.isFetching && selected.length ? <Skeleton.Image active />
              : <div className="media-picker-preview-empty"><PictureOutlined /><span>Chưa chọn ảnh</span></div>}
        </div>
        <div className="media-picker-preview-info">
          {preview ? <>
            <Typography.Text strong className="media-picker-preview-name">{preview.originalName}</Typography.Text>
            <dl className="media-picker-metadata">
              <div><dt>Định dạng</dt><dd>{preview.format.toUpperCase()}</dd></div>
              <div><dt>Dung lượng</dt><dd>{fileSize(preview.bytes)}</dd></div>
              <div><dt>Kích thước</dt><dd>{preview.width && preview.height ? preview.width + " × " + preview.height : "—"}</dd></div>
            </dl>
          </> : <Typography.Text type="secondary">Chọn một ảnh trong thư viện để xem trước và kiểm tra thông tin.</Typography.Text>}
        </div>
        {multiple && selected.length > 0 && <Space wrap className="media-picker-selected-tags">{selected.map(id =>
          <Tag key={id} closable={!busy} onClose={() => setSelected(previous => previous.filter(value => value !== id))}>
            {byId.get(id)?.originalName ?? "Ảnh đang chọn"}
          </Tag>)}</Space>}
        {initial.isError && <Alert type="warning" showIcon title="Không tải được ảnh đang chọn. Vui lòng chọn lại." />}
        {confirm.isError && <Alert role="alert" type="error" showIcon title={confirm.error.message} />}
        {onClear && <Button className="media-picker-remove-current" type="text" danger icon={<DeleteOutlined />} disabled={busy} onClick={onClear}>Gỡ ảnh hiện tại</Button>}
      </aside>
    </div>
  </Modal>;
}
