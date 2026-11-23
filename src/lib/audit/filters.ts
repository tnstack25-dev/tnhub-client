export type AuditFilterInput = {
  eventType?: string;
  severity?: string;
  userId?: string;
  fromLocal?: string;
  toLocal?: string;
};
export function buildAuditFilters(input: AuditFilterInput) {
  const eventType = input.eventType?.trim() || undefined;
  const userId = input.userId?.trim().toLowerCase() || undefined;
  if (eventType && eventType.length > 100) throw Error("Loại sự kiện tối đa 100 ký tự.");
  if (
    userId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(userId)
  )
    throw Error("ID người dùng phải là UUID hợp lệ.");
  const from = input.fromLocal ? new Date(input.fromLocal) : undefined;
  const to = input.toLocal ? new Date(input.toLocal) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())))
    throw Error("Thời gian không hợp lệ.");
  if (from && to && from > to)
    throw Error("Thời gian bắt đầu phải trước thời gian kết thúc.");
  return {
    eventType,
    userId,
    severity: input.severity || undefined,
    from: from?.toISOString(),
    to: to?.toISOString(),
  };
}
