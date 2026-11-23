export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;
export function imageError(file: { size: number; type: string }): string | null {
  if (file.size <= 0) return "Ảnh không được rỗng.";
  if (file.size > MAX_IMAGE_BYTES) return "Mỗi ảnh tối đa 10 MB.";
  if (!IMAGE_TYPES.some((type) => type === file.type))
    return "Chỉ hỗ trợ ảnh JPEG, PNG, GIF, WebP hoặc AVIF.";
  return null;
}
export function safeImageUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function fileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
