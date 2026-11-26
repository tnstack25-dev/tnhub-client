export type ProjectTag = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export const PRESET_TAG_COLORS = [
  "#2563EB",
  "#0284C7",
  "#0D9488",
  "#16A34A",
  "#D97706",
  "#EA580C",
  "#DC2626",
  "#9333EA",
  "#4F46E5",
  "#64748B",
] as const;
