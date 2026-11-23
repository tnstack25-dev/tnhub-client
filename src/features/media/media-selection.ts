import { IMAGE_TYPES, safeImageUrl } from "@/lib/media/validation";
import type { MediaItem, MediaPickerValue } from "./media-types";

export function isSelectableImage(item: MediaItem) {
  return !item.deletedAt && IMAGE_TYPES.some(type => type === item.mimeType) && Boolean(safeImageUrl(item.secureUrl));
}

export function selectionLimit(multiple: boolean, maxCount: number) {
  return multiple ? Math.max(1, Math.floor(Number.isFinite(maxCount) ? maxCount : 10)) : 1;
}

export function toggleMediaSelection(ids: string[], id: string, multiple: boolean, maxCount: number) {
  if (ids.includes(id)) return ids.filter(value => value !== id);
  return multiple ? [...ids, id].slice(0, selectionLimit(true, maxCount)) : [id];
}

export function toPickerValue(item: MediaItem): MediaPickerValue {
  return { id: item.id, url: item.secureUrl, name: item.originalName, altText: item.altText,
    width: item.width, height: item.height, bytes: item.bytes };
}
