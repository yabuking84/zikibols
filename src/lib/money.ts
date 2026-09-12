export function usd(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function hbar(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)} ℏ`;
}

/** Payout amounts are tinybars and can be far below 1 ℏ. */
export function hbarTinybars(tinybars: number) {
  const value = tinybars / 100_000_000;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value)} ℏ`;
}

export function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
