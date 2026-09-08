import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactHederaScheme as ExactHederaClientScheme } from "@x402/hedera/exact/client";
import { ExactHederaScheme as ExactHederaServerScheme } from "@x402/hedera/exact/server";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import type { RouteConfig } from "@x402/next";
import {
  BLOCKY402_TESTNET_URL,
  HBAR_ASSET_ID,
  HEDERA_TESTNET_CAIP2,
  X402_PRICE_TINYBARS,
} from "@/lib/hedera";
import { createReceiverAccount, isHederaOperatorConfigured } from "@/lib/hts";
import { getX402PayToAccountId, setX402PayToAccountId } from "@/lib/store";

export const RISK_REPORT_PATH = "/api/risk-report";

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

export function getRiskReportRouteConfig(payTo: string): RouteConfig {
  return {
    accepts: {
      scheme: "exact",
      network: HEDERA_TESTNET_CAIP2,
      payTo,
      price: {
        asset: HBAR_ASSET_ID,
        amount: process.env.X402_PRICE_TINYBARS ?? X402_PRICE_TINYBARS,
      },
    },
    description: "Paid due-diligence risk paragraph for a zikibols campaign",
    mimeType: "application/json",
  };
}

export async function buyRiskReport(origin: string, body: unknown) {
  if (!isX402ClientConfigured()) {
    throw new Error(
      "HEDERA_AGENT_ACCOUNT_ID and HEDERA_AGENT_PRIVATE_KEY are required for the agent to pay x402.",
    );
  }
  await resolveX402PayTo();

  const rawKey = process.env.HEDERA_AGENT_PRIVATE_KEY!;
  const privateKey = rawKey.startsWith("0x")
    ? PrivateKey.fromStringECDSA(rawKey)
    : PrivateKey.fromString(rawKey);

  const signer = createClientHederaSigner(
    process.env.HEDERA_AGENT_ACCOUNT_ID!,
    privateKey,
    { network: HEDERA_TESTNET_CAIP2 },
  );

  const client = new x402Client()
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

  const fetchWithPay = wrapFetchWithPayment(fetch, client);
  const response = await fetchWithPay(`${origin}${RISK_REPORT_PATH}`, {
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
    const text = await response.text();
    throw new Error(
      `Risk report request failed (${response.status}): ${challenge || text || "empty body"}`,
    );
  }

  const report = (await response.json()) as Record<string, unknown>;
  return {
    report,
    payment: settlement
      ? {
          success: settlement.success,
          transaction: settlement.transaction,
          network: settlement.network,
          payer: settlement.payer,
        }
      : null,
  };
}
