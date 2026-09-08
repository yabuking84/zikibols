import { isHederaOperatorConfigured, getBackerAccountId } from "@/lib/hts";
import { isSearchConfigured } from "@/lib/founder-search";
import { isX402Ready } from "@/lib/x402";

export type IntegrationStatus = {
  privy: boolean;
  graph: boolean;
  x402: boolean;
  hts: boolean;
  search: boolean;
  backer: boolean;
};

export function getIntegrationStatus(): IntegrationStatus {
  const x402 = isX402Ready();
  return {
    privy: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    graph: Boolean(process.env.THEGRAPH_API_KEY),
    x402,
    hts: isHederaOperatorConfigured(),
    // Founder search is sold over x402, so it is only Ready when the agent can pay.
    search: isSearchConfigured() && x402,
    backer: Boolean(getBackerAccountId()),
  };
}
