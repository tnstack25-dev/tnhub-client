export type AuditEvent = {
  id: string;
  eventType: string;
  severity: string;
  userId: string | null;
  sessionId: string | null;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  integrityValid: boolean | null;
  integrityKeyId: string | null;
  createdAt: string;
};

export type AuditFilters = {
  eventType?: string;
  severity?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export type AuditExport = { exportedAt: string; truncated: boolean; items: AuditEvent[] };
