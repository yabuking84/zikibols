import { usd } from "@/lib/money";
import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";
import type { FounderProfile } from "@/lib/founder-search";

export function writeRiskNote(input: {
  campaignTitle: string;
  creatorWallet: string;
  lending: LendingSnapshot[];
  accounts: CreatorAccount[];
  profile?: FounderProfile | null;
}) {
  const lines = input.lending.map((row) => {
    const utilization =
      Number(row.totalDepositBalanceUSD) > 0
        ? Number(row.totalBorrowBalanceUSD) / Number(row.totalDepositBalanceUSD)
        : 0;
    return `${row.label}: TVL ${usd(row.totalValueLockedUSD)}, deposits ${usd(row.totalDepositBalanceUSD)}, borrows ${usd(row.totalBorrowBalanceUSD)}, utilization ${(utilization * 100).toFixed(1)}%, historical liquidations ${usd(row.cumulativeLiquidateUSD)}.`;
  });

  const open = input.accounts.reduce((sum, account) => sum + account.openPositionCount, 0);
  const liquidations = input.accounts.reduce(
    (sum, account) => sum + account.liquidationCount,
    0,
  );

  const labels =
    input.lending.map((row) => row.label).join(", ") || "the queried lending books";
  const walletLine =
    open === 0
      ? `Wallet ${input.creatorWallet} has no open positions in Messari standardized subgraphs (${labels}).`
      : `Wallet ${input.creatorWallet} has ${open} open position(s) and ${liquidations} liquidation(s) across ${labels}.`;

  return [
    `Paid risk note for ${input.campaignTitle}.`,
    walletLine,
    ...lines,
    input.profile?.profile
      ? input.profile.profile
      : input.profile?.skipped
        ? `Founder public-web profile skipped: ${input.profile.skipped}`
        : "",
    "This paragraph is compute over live Graph data (and public-web snippets when present), not a copy of the subgraph JSON.",
  ]
    .filter(Boolean)
    .join(" ");
}
}
