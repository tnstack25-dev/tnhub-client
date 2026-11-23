export type MediaItem = {
  id: string;
  originalName: string;
  altText: string | null;
  secureUrl: string;
  url: string;
  format: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  uploadedById: string | null;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// Existing URL-only images can be previewed before a module migrates to media IDs.
export type MediaPickerValue = {
  id?: string;
  url: string;
  name?: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number;
};
