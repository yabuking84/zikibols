/**
 * Settlement math for the operator desk. The raise is split once: most of it
 * goes to the founder, the remainder is the pool the backers share pro-rata.
 * Amounts come from real pledge rows only — `campaign.pledgedHbar` carries the
 * Harbor / Northwind seed fixtures and must never be paid out. Only pledgers
 * holding a minted ATS unit are paid; see `minted` on each backer row.
 */
import { listPledges, loadCampaign } from "@/lib/store";
import { getOperatorAccountId } from "@/lib/hts";
import { mintMatches } from "@/lib/mints";

const TINYBARS_PER_HBAR = 100_000_000;
const MIRROR_URL =
  process.env.ATS_MIRROR_URL?.trim() || "https://testnet.mirrornode.hedera.com/api/v1/";

function envNumber(raw: string | undefined, fallback: number) {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** Share of the raise the founder receives; the rest is the backer pool. */
export function founderPercent() {
  return Math.min(100, envNumber(process.env.PAYOUT_FOUNDER_PERCENT, 90));
}

/** Fat-finger cap per payout action. */
export function maxPayoutTinybars() {
  return Math.round(envNumber(process.env.PAYOUT_MAX_HBAR, 100) * TINYBARS_PER_HBAR);
}

/** The treasury also pays x402 and ATS gas, so it never goes to zero. */
export function reserveTinybars() {
  return Math.round(envNumber(process.env.PAYOUT_RESERVE_HBAR, 50) * TINYBARS_PER_HBAR);
}

export function hbarFromTinybars(tinybars: number) {
  return tinybars / TINYBARS_PER_HBAR;
}

export type SettlementBacker = {
  wallet: string;
  hederaAccountId: string | null;
  pledgedTinybars: number;
  tinybars: number;
  /** Holds a minted ATS unit for this campaign. Only these wallets get paid. */
  minted: boolean;
};

export type SettlementQuote = {
  raiseTinybars: number;
  founderTinybars: number;
  poolTinybars: number;
  founderPercent: number;
  maxPayoutTinybars: number;
  backers: SettlementBacker[];
};

/**
 * Pro-rata split with largest remainder, so the parts sum to the pool exactly
 * instead of leaving dust in the treasury.
 */
function allocate(poolTinybars: number, weights: number[]) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (poolTinybars <= 0 || total <= 0) return weights.map(() => 0);

  const exact = weights.map((weight) => (poolTinybars * weight) / total);
  const parts = exact.map((value) => Math.floor(value));
  let left = poolTinybars - parts.reduce((sum, part) => sum + part, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  for (const { index } of order) {
    if (left <= 0) break;
    parts[index] += 1;
    left -= 1;
  }
  return parts;
}

export async function settlementQuote(slug: string): Promise<SettlementQuote> {
  const pledges = await listPledges(slug);
  const mints = (await loadCampaign(slug))?.mints ?? [];

  const byWallet = new Map<string, { wallet: string; hederaAccountId: string | null; pledgedTinybars: number }>();
  for (const pledge of pledges) {
    const key = pledge.wallet.trim().toLowerCase();
    const current = byWallet.get(key);
    const tinybars = Math.round(pledge.amountHbar * TINYBARS_PER_HBAR);
    if (current) {
      current.pledgedTinybars += tinybars;
      current.hederaAccountId = current.hederaAccountId ?? pledge.hederaAccountId;
    } else {
      byWallet.set(key, {
        wallet: pledge.wallet,
        hederaAccountId: pledge.hederaAccountId,
        pledgedTinybars: tinybars,
      });
    }
  }

  const rows = [...byWallet.values()].sort((a, b) => b.pledgedTinybars - a.pledgedTinybars);
  const raiseTinybars = rows.reduce((sum, row) => sum + row.pledgedTinybars, 0);
  const percent = founderPercent();
  const founderTinybars = Math.floor((raiseTinybars * percent) / 100);
  const poolTinybars = raiseTinybars - founderTinybars;
  const parts = allocate(
    poolTinybars,
    rows.map((row) => row.pledgedTinybars),
  );

  return {
    raiseTinybars,
    founderTinybars,
    poolTinybars,
    founderPercent: percent,
    maxPayoutTinybars: maxPayoutTinybars(),
    backers: rows.map((row, index) => ({
      ...row,
      tinybars: parts[index],
      minted: mints.some((mint) => mintMatches(mint, row.wallet, row.hederaAccountId)),
    })),
  };
}

async function treasuryBalanceTinybars() {
  const accountId = getOperatorAccountId();
  if (!accountId) return null;
  try {
    const response = await fetch(
      `${MIRROR_URL.replace(/\/?$/, "/")}accounts/${accountId}`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { balance?: { balance?: number } };
    const balance = json.balance?.balance;
    return typeof balance === "number" ? balance : null;
  } catch {
    return null;
  }
}

/** Throws a message the operator desk can render verbatim. */
export async function assertPayable(tinybars: number) {
  if (tinybars <= 0) {
    throw new Error("Nothing to pay out — this campaign has no live pledges yet.");
  }
  const cap = maxPayoutTinybars();
  if (tinybars > cap) {
    throw new Error(
      `Payout of ${hbarFromTinybars(tinybars)} ℏ is over the ${hbarFromTinybars(cap)} ℏ cap. Raise PAYOUT_MAX_HBAR to allow it.`,
    );
  }
  const balance = await treasuryBalanceTinybars();
  if (balance === null) return;
  const reserve = reserveTinybars();
  if (balance - tinybars < reserve) {
    throw new Error(
      `Treasury holds ${hbarFromTinybars(balance)} ℏ and must keep ${hbarFromTinybars(reserve)} ℏ for x402 and ATS gas. Fund the treasury or lower PAYOUT_RESERVE_HBAR.`,
    );
  }
}
