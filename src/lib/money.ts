export function formatMoneyFromCents(cents: number, currency = "USD") {
  const amount = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Accepts "5", "5.00", "$5", "  $ 5.25  " -> cents.
 * Returns null for empty input.
 */
export function parseMoneyToCents(input: string): number | null {
  const raw = input.replace(/[^0-9.]/g, "").trim();
  if (!raw) return null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;

  // Round to cents
  return Math.max(0, Math.round(n * 100));
}
