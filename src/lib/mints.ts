import type { Pledge, ShareMint } from "@/lib/types";

export type MintHolder = {
  wallet: string;
  accountId: string | null;
  pledgedHbar: number;
  mint: ShareMint | null;
};

function norm(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function backerKeys(...ids: Array<string | null | undefined>) {
  return new Set(ids.map(norm).filter(Boolean));
}

export function mintMatches(mint: ShareMint, ...ids: Array<string | null | undefined>) {
  const mintKeys = backerKeys(mint.wallet, mint.accountId);
  for (const key of backerKeys(...ids)) {
    if (mintKeys.has(key)) return true;
  }
  return false;
}

export function alreadyMinted(mints: ShareMint[], ...ids: Array<string | null | undefined>) {
  return mints.some((mint) => mintMatches(mint, ...ids));
}

export function normalizeMints(
  mints: ShareMint[] | null | undefined,
  fallback?: { accountId: string | null; txId: string | null },
): ShareMint[] {
  if (Array.isArray(mints) && mints.length > 0) return mints;
  if (fallback?.accountId && fallback.txId) {
    return [
      {
        wallet: fallback.accountId,
        accountId: fallback.accountId,
        txId: fallback.txId,
        at: "",
      },
    ];
  }
  return Array.isArray(mints) ? mints : [];
}

export function holdersFromPledges(pledges: Pledge[], mints: ShareMint[]): MintHolder[] {
  const byWallet = new Map<string, { wallet: string; accountId: string | null; pledgedHbar: number }>();
  for (const pledge of pledges) {
    const key = norm(pledge.wallet);
    if (!key) continue;
    const current = byWallet.get(key);
    if (current) {
      current.pledgedHbar += pledge.amountHbar;
      current.accountId = current.accountId ?? pledge.hederaAccountId;
    } else {
      byWallet.set(key, {
        wallet: pledge.wallet,
        accountId: pledge.hederaAccountId,
        pledgedHbar: pledge.amountHbar,
      });
    }
  }

  const holders = [...byWallet.values()]
    .sort((a, b) => b.pledgedHbar - a.pledgedHbar)
    .map((row) => ({
      ...row,
      mint: mints.find((mint) => mintMatches(mint, row.wallet, row.accountId)) ?? null,
    }));

  const extras = mints
    .filter((mint) => !holders.some((holder) => holder.mint && mintMatches(mint, holder.wallet, holder.accountId)))
    .map((mint) => ({
      wallet: mint.wallet,
      accountId: mint.accountId,
      pledgedHbar: 0,
      mint,
    }));

  return [...holders, ...extras];
}
