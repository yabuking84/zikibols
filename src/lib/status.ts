import { isHederaOperatorConfigured, getBackerAccountId } from "@/lib/hts";
import { isSearchConfigured } from "@/lib/founder-search";
import { isX402ClientConfigured, isX402PayToDistinct } from "@/lib/x402";

export type IntegrationStatus = {
  privy: boolean;
  graph: boolean;
  x402: boolean;
  hts: boolean;
  search: boolean;
  backer: boolean;
};

export function getIntegrationStatus(): IntegrationStatus {
  return {
    privy: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    graph: Boolean(process.env.THEGRAPH_API_KEY),
    x402: isX402ClientConfigured() && (isX402PayToDistinct() || isHederaOperatorConfigured()),
    hts: isHederaOperatorConfigured(),
    search: isSearchConfigured(),
    backer: Boolean(getBackerAccountId()),
  };
}
