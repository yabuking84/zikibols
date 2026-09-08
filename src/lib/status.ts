import { isHederaOperatorConfigured, getBackerAccountId } from "@/lib/hts";
import { isSearchConfigured } from "@/lib/founder-search";

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
    x402: Boolean(
      process.env.HEDERA_PAY_TO_ACCOUNT &&
        process.env.HEDERA_AGENT_ACCOUNT_ID &&
        process.env.HEDERA_AGENT_PRIVATE_KEY,
    ),
    hts: isHederaOperatorConfigured(),
    search: isSearchConfigured(),
    backer: Boolean(getBackerAccountId()),
  };
}
