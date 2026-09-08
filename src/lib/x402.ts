import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactHederaScheme as ExactHederaClientScheme } from "@x402/hedera/exact/client";
import { ExactHederaScheme as ExactHederaServerScheme } from "@x402/hedera/exact/server";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import type { RouteConfig, RoutesConfig } from "@x402/next";
import {
  BLOCKY402_TESTNET_URL,
  HBAR_ASSET_ID,
  HEDERA_TESTNET_CAIP2,
  X402_PRICE_TINYBARS,
} from "@/lib/hedera";
import { createReceiverAccount, isHederaOperatorConfigured } from "@/lib/hts";
import { getX402PayToAccountId, setX402PayToAccountId } from "@/lib/store";

/** Paid services this app sells to its own agent (and to anyone else with HBAR). */
export const RISK_REPORT_PATH = "/api/risk-report";
export const FOUNDER_SEARCH_PATH = "/api/founder-search";

export type X402Service = "founder-search" | "risk-report";

export type X402Payment = {
  service: X402Service;
  success: boolean;
  transaction: string;
  network: string;
  payer?: string;
  /** Price the route advertised, in tinybars. */
  amountTinybars: string;
};

export function isX402ServerConfigured() {
  return Boolean(process.env.HEDERA_PAY_TO_ACCOUNT);
}

export function isX402ClientConfigured() {
  return Boolean(
    process.env.HEDERA_AGENT_ACCOUNT_ID && process.env.HEDERA_AGENT_PRIVATE_KEY,
  );
}

export function isX402PayToDistinct() {
  const payTo = process.env.HEDERA_PAY_TO_ACCOUNT?.trim();
  const agent = process.env.HEDERA_AGENT_ACCOUNT_ID?.trim();
  return Boolean(payTo && agent && payTo !== agent);
}

/** True when the agent can actually complete a paid request end to end. */
export function isX402Ready() {
  return isX402ClientConfigured() && (isX402PayToDistinct() || isHederaOperatorConfigured());
}

/** Base price per paid request (one risk note, or one founder-search query). */
export function basePriceTinybars() {
  const raw = process.env.X402_PRICE_TINYBARS ?? X402_PRICE_TINYBARS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : Number(X402_PRICE_TINYBARS);
}

/** Founder search is metered per query: 1 (name) or 2 (name + email). */
export function founderSearchQueryCount(creatorEmail: string | null | undefined) {
  return creatorEmail ? 2 : 1;
}

export function founderSearchPath(queries: 1 | 2) {
  return `${FOUNDER_SEARCH_PATH}/${queries}`;
}

let resolvingPayTo: Promise<string> | null = null;

export async function resolveX402PayTo() {
  if (!resolvingPayTo) {
    resolvingPayTo = resolveX402PayToInner().catch((error) => {
      resolvingPayTo = null;
      throw error;
    });
  }
  return resolvingPayTo;
}

async function resolveX402PayToInner() {
  const envPayTo = process.env.HEDERA_PAY_TO_ACCOUNT?.trim() ?? "";
  const agent = process.env.HEDERA_AGENT_ACCOUNT_ID?.trim() ?? "";
  if (envPayTo && envPayTo !== agent) return envPayTo;

  const stored = await getX402PayToAccountId();
  if (stored && stored !== agent) return stored;

  if (!isHederaOperatorConfigured()) {
    throw new Error(
      "HEDERA_PAY_TO_ACCOUNT must differ from HEDERA_AGENT_ACCOUNT_ID, or set operator/agent keys so zikibols can create a dedicated x402 receiver.",
    );
  }

  const created = await createReceiverAccount("zikibols x402 payTo");
  await setX402PayToAccountId(created.accountId);
  return created.accountId;
}

export function getResourceServer() {
  const facilitator = new HTTPFacilitatorClient({
    url: process.env.X402_FACILITATOR_URL ?? BLOCKY402_TESTNET_URL,
  });

  return new x402ResourceServer(facilitator).register(
    "hedera:*",
    new ExactHederaServerScheme({
      defaultAssets: {
        [HEDERA_TESTNET_CAIP2]: { asset: HBAR_ASSET_ID, decimals: 8 },
      },
    }),
  );
}

function routeConfig(payTo: string, multiplier: number, description: string): RouteConfig {
  return {
    accepts: {
      scheme: "exact",
      network: HEDERA_TESTNET_CAIP2,
      payTo,
      price: {
        asset: HBAR_ASSET_ID,
        amount: String(basePriceTinybars() * multiplier),
      },
    },
    description,
    mimeType: "application/json",
  };
}

export function getRiskReportRouteConfig(payTo: string): RouteConfig {
  return routeConfig(
    payTo,
    1,
    "Paid due-diligence risk paragraph for a zikibols campaign",
  );
}

/** Two route patterns, two prices: metered by the number of public-web queries. */
export function getFounderSearchRoutes(payTo: string): RoutesConfig {
  return {
    [founderSearchPath(1)]: routeConfig(
      payTo,
      1,
      "Public-web founder profile for a zikibols campaign (1 query: name)",
    ),
    [founderSearchPath(2)]: routeConfig(
      payTo,
      2,
      "Public-web founder profile for a zikibols campaign (2 queries: name + email)",
    ),
  };
}

function agentClient() {
  const rawKey = process.env.HEDERA_AGENT_PRIVATE_KEY!;
  const privateKey = rawKey.startsWith("0x")
    ? PrivateKey.fromStringECDSA(rawKey)
    : PrivateKey.fromString(rawKey);

  const signer = createClientHederaSigner(
    process.env.HEDERA_AGENT_ACCOUNT_ID!,
    privateKey,
    { network: HEDERA_TESTNET_CAIP2 },
  );

  return new x402Client()
    .register("hedera:*", new ExactHederaClientScheme(signer))
    .setSpendControls({
      allowedAssets: [
        {
          network: HEDERA_TESTNET_CAIP2,
          asset: HBAR_ASSET_ID,
        },
      ],
      maxAmountPerPayment: false,
    });
}

/**
 * Pay x402 for one of this app's services and return the JSON body plus settlement.
 * Throws with the server's reason when the request fails (including 503 from an
 * unconfigured service, so the agent never pays for nothing).
 */
export async function payForService<T extends Record<string, unknown>>(
  origin: string,
  service: X402Service,
  path: string,
  body: unknown,
  amountTinybars: string,
): Promise<{ report: T; payment: X402Payment | null }> {
  if (!isX402ClientConfigured()) {
    throw new Error(
      "HEDERA_AGENT_ACCOUNT_ID and HEDERA_AGENT_PRIVATE_KEY are required for the agent to pay x402.",
    );
  }
  await resolveX402PayTo();

  const fetchWithPay = wrapFetchWithPayment(fetch, agentClient());
  const response = await fetchWithPay(`${origin}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const paymentHeader =
    response.headers.get("PAYMENT-RESPONSE") ??
    response.headers.get("payment-response");
  const settlement = paymentHeader
    ? decodePaymentResponseHeader(paymentHeader)
    : null;

  if (!response.ok) {
    const requiredHeader =
      response.headers.get("PAYMENT-REQUIRED") ??
      response.headers.get("payment-required");
    let challenge = "";
    if (requiredHeader) {
      try {
        const json = JSON.parse(
          Buffer.from(requiredHeader, "base64url").toString("utf8"),
        ) as { error?: string };
        challenge = json.error ?? "payment required";
      } catch {
        challenge = "unreadable payment-required header";
      }
    }
    let text = "";
    try {
      const json = (await response.json()) as { error?: string };
      text = json.error ?? "";
    } catch {
      text = "";
    }
    throw new Error(
      `${service} request failed (${response.status}): ${challenge || text || "empty body"}`,
    );
  }

  const report = (await response.json()) as T;
  return {
    report,
    payment: settlement
      ? {
          service,
          success: settlement.success,
          transaction: settlement.transaction,
          network: settlement.network,
          payer: settlement.payer,
          amountTinybars,
        }
      : null,
  };
}

export async function buyRiskReport(origin: string, body: unknown) {
  return payForService<{ note?: string }>(
    origin,
    "risk-report",
    RISK_REPORT_PATH,
    body,
    String(basePriceTinybars()),
  );
}

export async function buyFounderProfile(
  origin: string,
  body: {
    creatorName: string;
    creatorEmail: string | null;
    campaignTitle: string;
    location: string;
  },
) {
  const queries = founderSearchQueryCount(body.creatorEmail);
  return payForService<{ profile?: unknown; queries?: number }>(
    origin,
    "founder-search",
    founderSearchPath(queries),
    body,
    String(basePriceTinybars() * queries),
  );
}
