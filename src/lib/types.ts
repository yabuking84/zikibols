import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";
import type { FounderProfile } from "@/lib/founder-search";

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

export type AgentStep = {
  tool: "queryLending" | "searchFounder" | "buyRiskReport" | "publishAudit";
  detail: string;
};

export type AgentResult = {
  summary: string;
  steps: AgentStep[];
  lending: LendingSnapshot[];
  accounts: CreatorAccount[];
  profile: FounderProfile;
  payment: {
    success: boolean;
    transaction: string;
    network: string;
    payer?: string;
  } | null;
  audit: {
    topicId: string;
    transactionId: string;
  } | null;
  usedLlm: boolean;
};
