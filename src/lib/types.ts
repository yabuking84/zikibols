import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";
import type { FounderProfile } from "@/lib/founder-search";
import type { X402Payment } from "@/lib/x402";

/** One ATS unit handed to one wallet. Stored on the campaign runtime. */
export type ShareMint = {
  wallet: string;
  accountId: string;
  txId: string;
  at: string;
};

export type Pledge = {
  id: string;
  campaignSlug: string;
  wallet: string;
  hederaAccountId: string | null;
  amountHbar: number;
  txHash: string | null;
  createdAt: string;
};

export type PayoutApprovals = {
  founderWallet: string | null;
  operator: boolean;
};

/** Settlement receipts. Present means already paid — the desk will not pay twice. */
export type CampaignSettlement = {
  founder: { to: string; tinybars: number; txId: string; at: string } | null;
  backers: { count: number; tinybars: number; txId: string; at: string } | null;
};

export type AgentStep = {
  tool: "queryLending" | "buyFounderProfile" | "buyRiskReport" | "publishAudit";
  detail: string;
};

export type AgentResult = {
  summary: string;
  steps: AgentStep[];
  lending: LendingSnapshot[];
  accounts: CreatorAccount[];
  profile: FounderProfile;
  /** One entry per x402 service the agent paid for during this check. */
  payments: X402Payment[];
  audit: {
    topicId: string;
    transactionId: string;
  } | null;
  usedLlm: boolean;
};
