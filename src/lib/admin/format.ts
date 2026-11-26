export function formatPrice(value: string) {
  const [integer, fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return grouped + (fraction && /[1-9]/.test(fraction) ? "," + fraction : "");
}

export function sumDecimalStrings(values: readonly string[]): string {
  let totalCents = BigInt(0);
  for (const raw of values) {
    if (!raw || typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!/^\d+(?:\.\d+)?$/.test(trimmed)) continue;
    const [intPart = "0", fracPart = ""] = trimmed.split(".");
    const cents = (fracPart + "00").slice(0, 2);
    totalCents += BigInt(intPart) * BigInt(100) + BigInt(cents);
  }
  const integer = (totalCents / BigInt(100)).toString();
  const fraction = (totalCents % BigInt(100)).toString().padStart(2, "0");
  return `${integer}.${fraction}`;
}

export function matchesYearMonth(
  dateValue: string | null | undefined,
  yearMonth: string | null | undefined,
): boolean {
  if (!yearMonth || yearMonth === "all") return true;
  if (!dateValue || typeof dateValue !== "string") return false;
  return dateValue.slice(0, 7) === yearMonth;
}
