export function formatPrice(value: string) {
  const [integer, fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return grouped + (fraction && /[1-9]/.test(fraction) ? "," + fraction : "");
}
