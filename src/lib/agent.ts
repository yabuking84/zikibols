import { buyRiskReport } from "@/lib/x402";
import {
  queryStandardizedLending,
  type CreatorAccount,
  type LendingSnapshot,
} from "@/lib/graph";
import type { AgentResult, AgentStep } from "@/lib/types";

export type { AgentResult, AgentStep };

function usd(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function heuristicSummary(
  title: string,
  lending: LendingSnapshot[],
  accounts: CreatorAccount[],
  paidNote: string,
) {
  const [left, right] = lending;
  const tvlCmp =
    left && right
      ? Number(left.totalValueLockedUSD) >= Number(right.totalValueLockedUSD)
        ? `${left.label} currently holds more TVL (${usd(left.totalValueLockedUSD)} vs ${usd(right.totalValueLockedUSD)}).`
        : `${right.label} currently holds more TVL (${usd(right.totalValueLockedUSD)} vs ${usd(left.totalValueLockedUSD)}).`
      : "Could not compare both protocols.";

  const open = accounts.reduce((sum, account) => sum + account.openPositionCount, 0);
  const liquidations = accounts.reduce(
    (sum, account) => sum + account.liquidationCount,
    0,
  );

  const history =
    open === 0
      ? "This creator wallet has no open Aave/Compound positions in the standardized subgraphs, so on-chain lending history is thin — treat that as unknown risk, not a green light."
      : `The wallet has ${open} open lending position(s) across the two protocols and ${liquidations} recorded liquidation(s).`;

  return [
    `Due diligence for ${title}.`,
    tvlCmp,
    history,
    paidNote,
  ].join(" ");
}

async function llmSummary(
  title: string,
  lending: LendingSnapshot[],
  accounts: CreatorAccount[],
  paidNote: string,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a cautious crowdfunding due-diligence agent. Use only the provided Graph numbers. Write 3-5 short sentences a backer can act on. Never invent TVL or positions. Mention that Aave and Compound were queried with the same Messari lending schema.",
        },
        {
          role: "user",
          content: JSON.stringify({ title, lending, accounts, paidNote }),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

export async function runDueDiligence(input: {
  origin: string;
  campaignTitle: string;
  creatorWallet: string;
}): Promise<AgentResult> {
  const steps: AgentStep[] = [];

  const { lending, accounts } = await queryStandardizedLending(input.creatorWallet);
  steps.push({
    tool: "queryLending",
    detail: `Live Messari lending schema on ${lending.map((row) => row.label).join(" + ")}`,
  });

  const paid = await buyRiskReport(input.origin, {
    campaignTitle: input.campaignTitle,
    creatorWallet: input.creatorWallet,
    lending,
    accounts,
  });
  steps.push({
    tool: "buyRiskReport",
    detail: paid.payment?.transaction
      ? `Paid x402 on Hedera · ${paid.payment.transaction}`
      : "Paid x402 on Hedera",
  });

  const paidNote =
    typeof paid.report.note === "string"
      ? paid.report.note
      : "Paid risk endpoint returned no note.";

  const llm = await llmSummary(
    input.campaignTitle,
    lending,
    accounts,
    paidNote,
  );

  return {
    summary:
      llm ??
      heuristicSummary(input.campaignTitle, lending, accounts, paidNote),
    steps,
    lending,
    accounts,
    payment: paid.payment,
    usedLlm: Boolean(llm),
  };
}
