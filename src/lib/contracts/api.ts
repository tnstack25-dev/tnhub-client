export type ApiResponse<T> = { data: T };

export type Page<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type BulkResult = {
  affectedCount: number;
  skipped: { id: string; reason: string }[];
};

export type ListParams = Record<string, string | number | undefined>;
