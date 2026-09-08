import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import {
  getResourceServer,
  getRiskReportRouteConfig,
  isX402ServerConfigured,
} from "@/lib/x402";
import { writeRiskNote } from "@/lib/risk-note";
import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";

async function handler(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    campaignTitle?: string;
    creatorWallet?: string;
    lending?: LendingSnapshot[];
    accounts?: CreatorAccount[];
  };

  if (!body.campaignTitle || !body.creatorWallet || !body.lending || !body.accounts) {
    return NextResponse.json(
      { error: "campaignTitle, creatorWallet, lending, and accounts are required" },
      { status: 400 },
    );
  }

  const note = writeRiskNote({
    campaignTitle: body.campaignTitle,
    creatorWallet: body.creatorWallet,
    lending: body.lending,
    accounts: body.accounts,
  });

  return NextResponse.json({
    note,
    priced: true,
    source: "zikibols-risk-report",
  });
}

export const POST = isX402ServerConfigured()
  ? withX402(
      handler,
      { "/api/risk-report": getRiskReportRouteConfig() },
      getResourceServer(),
    )
  : async () =>
      NextResponse.json(
        {
          error:
            "x402 is not configured. Set HEDERA_PAY_TO_ACCOUNT so this endpoint can require Hedera payment.",
        },
        { status: 503 },
      );
