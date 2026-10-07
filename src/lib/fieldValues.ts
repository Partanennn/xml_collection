export const ratingOptions = [
  "1 Awful",
  "2 Weak",
  "3 Decent",
  "4 Great",
  "5 Exceptional",
];

export function isRatingField(header: string): boolean {
  return header.trim().toLocaleLowerCase() === "rating";
}

export function getRatingDetails(value: string):
  | {
      name: string;
      score: number;
    }
  | undefined {
  const match = /^([1-5])\s+(.+)$/.exec(value.trim());
  if (!match) return undefined;
  return { name: match[2], score: Number(match[1]) };
}

export function getRatingName(value: string): string {
  return getRatingDetails(value)?.name ?? value;
}

export function isDigitalizedField(header: string): boolean {
  const normalized = header.trim().toLocaleLowerCase();
  return normalized === "digitalized" || normalized === "digitalize";
}

export function isBlurayField(header: string): boolean {
  return header.trim().toLocaleLowerCase() === "bluray";
}

export function isNewField(header: string): boolean {
  return header.trim().toLocaleLowerCase() === "new";
}

export function normalizeBooleanField(value: string): string {
  return /^(x|true|1)$/i.test(value.trim()) ? "X" : "";
}

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
