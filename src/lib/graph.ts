export const LENDING_SUBGRAPHS = {
  "aave-v3": {
    label: "Aave v3",
    network: "ethereum",
    subgraphId: "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk",
  },
  "compound-v3": {
    label: "Compound v3",
    network: "ethereum",
    subgraphId: "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9",
  },
} as const;

export type ProtocolSlug = keyof typeof LENDING_SUBGRAPHS;

export type LendingSnapshot = {
  protocol: ProtocolSlug;
  label: string;
  subgraphId: string;
  name: string;
  slug: string;
  totalValueLockedUSD: string;
  totalDepositBalanceUSD: string;
  totalBorrowBalanceUSD: string;
  cumulativeDepositUSD: string;
  cumulativeBorrowUSD: string;
  cumulativeLiquidateUSD: string;
};

export type CreatorPosition = {
  protocol: ProtocolSlug;
  id: string;
  side: string;
  balance: string;
  market: string;
  symbol: string;
  open: boolean;
};

export type CreatorAccount = {
  protocol: ProtocolSlug;
  positionCount: number;
  openPositionCount: number;
  liquidationCount: number;
  positions: CreatorPosition[];
};

const LENDING_QUERY = /* GraphQL */ `
  query LendingSnapshot {
    lendingProtocols {
      name
      slug
      totalValueLockedUSD
      totalDepositBalanceUSD
      totalBorrowBalanceUSD
      cumulativeDepositUSD
      cumulativeBorrowUSD
      cumulativeLiquidateUSD
    }
  }
`;

const ACCOUNT_QUERY = /* GraphQL */ `
  query CreatorAccount($id: ID!) {
    account(id: $id) {
      id
      positionCount
      openPositionCount
      liquidationCount
      positions(first: 6) {
        id
        side
        balance
        market {
          name
          inputToken {
            symbol
          }
        }
      }
    }
  }
`;

function gatewayUrl(subgraphId: string) {
  const apiKey = process.env.THEGRAPH_API_KEY;
  if (!apiKey) {
    throw new Error(
      "THEGRAPH_API_KEY is missing. Add a Graph Gateway key so the agent can read live subgraphs.",
    );
  }
  const base =
    process.env.THEGRAPH_GATEWAY_URL ??
    "https://gateway.thegraph.com/api";
  return `${base.replace(/\/$/, "")}/${apiKey}/subgraphs/id/${subgraphId}`;
}

async function graphQuery<T>(
  subgraphId: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(gatewayUrl(subgraphId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `The Graph request failed (${response.status}) for ${subgraphId}`,
    );
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }

  if (!json.data) {
    throw new Error("The Graph returned an empty payload");
  }

  return json.data;
}

export async function queryLending(protocol: ProtocolSlug): Promise<LendingSnapshot> {
  const meta = LENDING_SUBGRAPHS[protocol];
  const data = await graphQuery<{
    lendingProtocols: Omit<LendingSnapshot, "protocol" | "label" | "subgraphId">[];
  }>(meta.subgraphId, LENDING_QUERY);

  const row = data.lendingProtocols[0];
  if (!row) {
    throw new Error(`No lendingProtocols entity on ${protocol}`);
  }

  return {
    protocol,
    label: meta.label,
    subgraphId: meta.subgraphId,
    ...row,
  };
}

export async function queryCreator(
  protocol: ProtocolSlug,
  wallet: string,
): Promise<CreatorAccount> {
  const meta = LENDING_SUBGRAPHS[protocol];
  const id = wallet.toLowerCase();
  const data = await graphQuery<{
    account: {
      positionCount: number;
      openPositionCount: number;
      liquidationCount: number;
      positions: {
        id: string;
        side: string;
        balance: string;
        market: { name: string; inputToken: { symbol: string } };
      }[];
    } | null;
  }>(meta.subgraphId, ACCOUNT_QUERY, { id });

  const account = data.account;
  if (!account) {
    return {
      protocol,
      positionCount: 0,
      openPositionCount: 0,
      liquidationCount: 0,
      positions: [],
    };
  }

  return {
    protocol,
    positionCount: account.positionCount,
    openPositionCount: account.openPositionCount,
    liquidationCount: account.liquidationCount,
    positions: account.positions.map((position) => ({
      protocol,
      id: position.id,
      side: position.side,
      balance: position.balance,
      market: position.market.name,
      symbol: position.market.inputToken.symbol,
      open: true,
    })),
  };
}

export async function queryStandardizedLending(wallet: string) {
  const protocols = Object.keys(LENDING_SUBGRAPHS) as ProtocolSlug[];
  const lending = await Promise.all(protocols.map((protocol) => queryLending(protocol)));
  const accounts = await Promise.all(
    protocols.map((protocol) => queryCreator(protocol, wallet)),
  );
  return { lending, accounts };
}
