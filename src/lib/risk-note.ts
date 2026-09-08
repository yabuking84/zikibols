import { usd } from "@/lib/money";
import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";

export function writeRiskNote(input: {
  campaignTitle: string;
  creatorWallet: string;
  lending: LendingSnapshot[];
  accounts: CreatorAccount[];
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

  const walletLine =
    open === 0
      ? `Wallet ${input.creatorWallet} has no open Aave/Compound positions in Messari standardized subgraphs.`
      : `Wallet ${input.creatorWallet} has ${open} open position(s) and ${liquidations} liquidation(s) across Aave v3 and Compound v3.`;

  return [
    `Paid risk note for ${input.campaignTitle}.`,
    walletLine,
    ...lines,
    "This paragraph is compute over live Graph data, not a copy of the subgraph JSON.",
  ].join(" ");
}
