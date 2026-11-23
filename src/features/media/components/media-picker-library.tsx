"use client";
import "./media-picker-library.css";

import { useState } from "react";
import { Alert, Button, Empty, Flex, Image, Pagination, Segmented, Skeleton } from "antd";
import { CheckCircleFilled, PictureOutlined, ReloadOutlined } from "@ant-design/icons";
import { DebouncedSearch } from "@/components/debounced-search";
import { LoadError } from "@/components/admin/admin-ui";
import { safeImageUrl } from "@/lib/media/validation";
import { useMedia } from "../media-queries";
import { isSelectableImage } from "../media-selection";
import type { MediaItem } from "../media-types";

export function MediaPickerLibrary({ canRead, userId, selectedIds, disabled, onToggle }: {
  canRead: boolean;
  userId?: string;
  selectedIds: string[];
  disabled: boolean;
  onToggle: (item: MediaItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mine, setMine] = useState(false);
  const query = useMedia({ page, limit: 12, search: search || undefined, uploadedById: mine ? userId : undefined }, false, canRead);

  if (!canRead) return <Alert type="info" showIcon title="Bạn chưa có quyền xem thư viện ảnh." />;

  return <div className="media-picker-library">
    <div className="media-picker-toolbar">
      <DebouncedSearch value={search} aria-label="Tìm ảnh trong thư viện" placeholder="Tìm tên hoặc mô tả ảnh…"
        maxLength={255} disabled={disabled}
        onSearch={value => { setSearch(value); setPage(1); }} />
      <Flex align="center" justify="space-between" gap={12}>
        <Segmented aria-label="Phạm vi thư viện ảnh" value={mine ? "mine" : "all"} disabled={disabled}
          options={[{ value: "all", label: "Tất cả ảnh" }, { value: "mine", label: "Ảnh của tôi", disabled: !userId }]}
          onChange={value => { setMine(value === "mine"); setPage(1); }} />
        <Button aria-label="Tải lại thư viện ảnh" icon={<ReloadOutlined />} loading={query.isFetching} disabled={disabled} onClick={() => void query.refetch()} />
      </Flex>
    </div>
    <div className="media-picker-library-scroll">
    {query.isError ? <LoadError error={query.error} retry={() => void query.refetch()} />
      : query.isPending ? <Skeleton active />
        : !query.data?.items.length ? <Empty description="Không tìm thấy ảnh phù hợp." />
          : <div className="media-picker-grid" aria-label="Ảnh trong thư viện" aria-busy={query.isFetching}>
            {query.data.items.map(item => {
              const selected = selectedIds.includes(item.id);
              const selectable = isSelectableImage(item);
              return <button key={item.id} type="button" className="media-picker-tile" aria-pressed={selected}
                aria-label={"Chọn ảnh " + item.originalName} disabled={disabled || !selectable} onClick={() => onToggle(item)}>
                <div className="media-picker-thumbnail">
                  <Image src={safeImageUrl(item.secureUrl)} alt={item.altText || item.originalName} preview={false}
                    placeholder={<PictureOutlined />} loading="lazy" referrerPolicy="no-referrer" />
                  {selected && <CheckCircleFilled className="media-picker-check" />}
                </div>
                <span className="media-picker-filename" title={item.originalName}>{item.originalName}</span>
                <span className="media-picker-tile-meta"><span>{item.format.toUpperCase()}</span><span>{item.width && item.height ? `${item.width} × ${item.height}` : "Ảnh"}</span></span>
              </button>;
            })}
          </div>}
    </div>
    <Pagination className="media-picker-pagination" current={page} pageSize={12} total={query.data?.meta.total ?? 0} showSizeChanger={false}
      hideOnSinglePage disabled={disabled} onChange={setPage} showTotal={total => `${total} ảnh`} />
  </div>;
}
