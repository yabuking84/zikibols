import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";

export type Pledge = {
  id: string;
  campaignSlug: string;
  wallet: string;
  amountHbar: number;
  txHash: string | null;
  createdAt: string;
};

export type PayoutApprovals = {
  founderWallet: string | null;
  operator: boolean;
};

export type AgentStep = {
  tool: "queryLending" | "buyRiskReport";
  detail: string;
};

export type AgentResult = {
  summary: string;
  steps: AgentStep[];
  lending: LendingSnapshot[];
  accounts: CreatorAccount[];
  payment: {
    success: boolean;
    transaction: string;
    network: string;
    payer?: string;
  } | null;
  usedLlm: boolean;
};
