import {
  buyFounderProfile,
  buyRiskReport,
  founderSearchQueryCount,
  isX402ClientConfigured,
  type X402Payment,
} from "@/lib/x402";
import { publishRiskAudit } from "@/lib/hcs";
import { isSearchConfigured, type FounderProfile } from "@/lib/founder-search";
import { writeRiskNote } from "@/lib/risk-note";
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
  errors: string[] = [],
  profile: FounderProfile,
) {
  const ranked = [...lending].sort(
    (a, b) => Number(b.totalValueLockedUSD) - Number(a.totalValueLockedUSD),
  );
  const top = ranked[0];
  const rest = ranked.slice(1);
  const tvlCmp =
    top && rest.length
      ? `${top.label} currently holds the most TVL among the live books (${usd(top.totalValueLockedUSD)} vs ${rest.map((row) => `${row.label} ${usd(row.totalValueLockedUSD)}`).join(", ")}).`
      : top
        ? `${top.label} TVL is ${usd(top.totalValueLockedUSD)} (only one live book returned).`
        : "Could not compare protocol TVL.";

  const labels = lending.map((row) => row.label).join(", ") || "the queried protocols";
  const open = accounts.reduce((sum, account) => sum + account.openPositionCount, 0);
  const liquidations = accounts.reduce(
    (sum, account) => sum + account.liquidationCount,
    0,
  );

  const history =
    open === 0
      ? `This creator wallet has no open positions in the standardized ${labels} subgraphs, so on-chain lending history is thin — treat that as unknown risk, not a green light.`
      : `The wallet has ${open} open lending position(s) across ${labels} and ${liquidations} recorded liquidation(s).`;

  const web = profile.skipped
    ? `Public-web founder profile skipped: ${profile.skipped}`
    : profile.sources.length
      ? `Public-web search returned ${profile.sources.length} cited source(s); see Founder profile.`
      : "";

  return [
    `Due diligence for ${title}.`,
    tvlCmp,
    history,
    errors.length ? `Unavailable books: ${errors.join(" ")}` : "",
    web,
    paidNote,
  ]
    .filter(Boolean)
    .join(" ");
}

async function llmSummary(
  title: string,
  lending: LendingSnapshot[],
  accounts: CreatorAccount[],
  paidNote: string,
  errors: string[],
  profile: FounderProfile,
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
            "You are a cautious crowdfunding due-diligence agent. Use only the provided Graph numbers and public-web snippets. Write 3-5 short sentences a backer can act on. Never invent TVL, positions, employers, or headlines. Mention only protocols present in the payload. If a protocol is missing or listed in errors, do not invent its TVL. If the founder profile is skipped or empty, say so — do not invent a biography.",
        },
        {
          role: "user",
          content: JSON.stringify({ title, lending, accounts, paidNote, errors, profile }),
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

function skippedProfile(reason: string): FounderProfile {
  return { queried: [], sources: [], profile: null, skipped: reason };
}

function isFounderProfile(value: unknown): value is FounderProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FounderProfile>;
  return Array.isArray(candidate.sources) && Array.isArray(candidate.queried);
}

/**
 * Founder research is a paid x402 service. Decide locally whether it can run
 * (Tavily + agent keys) so the agent never pays for a 503, then buy it.
 */
async function buyFounderProfileStep(input: {
  origin: string;
  campaignTitle: string;
  creatorName: string;
  creatorEmail: string | null;
  location: string;
}): Promise<{ profile: FounderProfile; payment: X402Payment | null; detail: string }> {
  if (!input.creatorName.trim()) {
    return {
      profile: skippedProfile("No founder name on this campaign"),
      payment: null,
      detail: "Skipped: no founder name",
    };
  }
  if (!isSearchConfigured()) {
    const reason = "Set TAVILY_API_KEY to sell public-web founder research over x402";
    return { profile: skippedProfile(reason), payment: null, detail: reason };
  }
  if (!isX402ClientConfigured()) {
    const reason =
      "Founder search is a paid service; set HEDERA_AGENT_ACCOUNT_ID and HEDERA_AGENT_PRIVATE_KEY so the agent can pay for it";
    return { profile: skippedProfile(reason), payment: null, detail: reason };
  }

  const queries = founderSearchQueryCount(input.creatorEmail);
  try {
    const paid = await buyFounderProfile(input.origin, {
      creatorName: input.creatorName,
      creatorEmail: input.creatorEmail,
      campaignTitle: input.campaignTitle,
      location: input.location,
    });
    const profile = isFounderProfile(paid.report.profile)
      ? paid.report.profile
      : skippedProfile("Paid founder-search endpoint returned no profile");
    const summary = profile.skipped
      ? profile.skipped
      : `Public web: ${profile.sources.length} source(s) for ${input.creatorName}`;
    return {
      profile,
      payment: paid.payment,
      detail: paid.payment?.transaction
        ? `Paid x402 for ${queries} quer${queries === 1 ? "y" : "ies"} · ${paid.payment.transaction} · ${summary}`
        : `Paid x402 for ${queries} quer${queries === 1 ? "y" : "ies"} · ${summary}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "founder search failed";
    return {
      profile: skippedProfile(`Public-web search skipped: ${message}`),
      payment: null,
      detail: `x402 founder search skipped: ${message}`,
    };
  }
}

export async function runDueDiligence(input: {
  origin: string;
  campaignTitle: string;
  creatorWallet: string;
  creatorName: string;
  creatorEmail: string | null;
  location: string;
}): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const payments: X402Payment[] = [];

  const [lendingResult, founder] = await Promise.all([
    queryStandardizedLending(input.creatorWallet),
    buyFounderProfileStep(input),
  ]);
  const { lending, accounts, errors } = lendingResult;
  const profile = founder.profile;
  if (founder.payment) payments.push(founder.payment);

  steps.push({
    tool: "queryLending",
    detail: errors.length
      ? `Live Messari lending schema on ${lending.map((row) => row.label).join(" + ")} (${errors.join("; ")})`
      : `Live Messari lending schema on ${lending.map((row) => row.label).join(" + ")}`,
  });
  steps.push({ tool: "buyFounderProfile", detail: founder.detail });

  let paidNote: string;
  try {
    const paid = await buyRiskReport(input.origin, {
      campaignTitle: input.campaignTitle,
      creatorWallet: input.creatorWallet,
      lending,
      accounts,
      profile,
    });
    if (paid.payment) payments.push(paid.payment);
    paidNote =
      typeof paid.report.note === "string"
        ? paid.report.note
        : "Paid risk endpoint returned no note.";
    steps.push({
      tool: "buyRiskReport",
      detail: paid.payment?.transaction
        ? `Paid x402 on Hedera · ${paid.payment.transaction}`
        : "Paid x402 on Hedera",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "x402 payment failed";
    paidNote = [
      writeRiskNote({
        campaignTitle: input.campaignTitle,
        creatorWallet: input.creatorWallet,
        lending,
        accounts,
        profile,
      }),
      `x402 did not settle (${message}). Graph and public-web results above are still live.`,
    ].join(" ");
    steps.push({
      tool: "buyRiskReport",
      detail: `x402 skipped: ${message}`,
    });
  }

  let audit: AgentResult["audit"] = null;
  try {
    audit = await publishRiskAudit({
      campaignTitle: input.campaignTitle,
      creatorWallet: input.creatorWallet,
      note: paidNote,
      profile: profile.profile,
      x402: payments.map((payment) => ({
        service: payment.service,
        transaction: payment.transaction,
      })),
      protocols: lending.map((row) => row.label),
    });
    steps.push({
      tool: "publishAudit",
      detail: audit
        ? `HCS topic ${audit.topicId} · ${audit.transactionId}`
        : "HCS audit skipped (set Hedera operator/agent keys to publish the note hash)",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HCS publish failed";
    steps.push({
      tool: "publishAudit",
      detail: `HCS audit skipped: ${message}`,
    });
  }

  const llm = await llmSummary(
    input.campaignTitle,
    lending,
    accounts,
    paidNote,
    errors,
    profile,
  );

  return {
    summary:
      llm ??
      heuristicSummary(
        input.campaignTitle,
        lending,
        accounts,
        paidNote,
        errors,
        profile,
      ),
    steps,
    lending,
    accounts,
    profile,
    payments,
    audit,
    usedLlm: Boolean(llm),
  };
}
