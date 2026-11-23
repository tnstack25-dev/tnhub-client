import type { AuthProfile } from "@/lib/auth/contracts";
import type { MediaPickerValue } from "@/features/media/media-types";

type AvatarProfile = Pick<AuthProfile, "avatarUrl" | "avatarMediaId">;

export function profileAvatar(profile: AvatarProfile): MediaPickerValue[] {
  return profile.avatarUrl ? [{ id: profile.avatarMediaId ?? undefined, url: profile.avatarUrl, name: "Ảnh đại diện hiện tại" }] : [];
}

export function avatarPatch(profile: AvatarProfile, selected: MediaPickerValue[]): { avatarMediaId?: string | null } {
  const image = selected[0];
  if (image?.id) return image.id === profile.avatarMediaId ? {} : { avatarMediaId: image.id };
  if (!image && (profile.avatarMediaId || profile.avatarUrl)) return { avatarMediaId: null };
  return {};
}
