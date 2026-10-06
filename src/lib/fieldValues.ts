export function isPriceField(header: string): boolean {
  return header.trim().toLocaleLowerCase() === "price";
}

export function isValidPriceValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) return false;
  return Number.isFinite(Number(trimmed));
}

export function normalizePriceValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const price = Number(trimmed);
  if (!Number.isFinite(price) || price < 0) return trimmed;
  return price.toFixed(2);
}

export function normalizeFieldValue(header: string, value: string): string {
  return isPriceField(header) ? normalizePriceValue(value) : value.trim();
}
