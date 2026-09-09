import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import {
  getResourceServer,
  getRiskReportRouteConfig,
  isX402ClientConfigured,
  isX402ServerConfigured,
  resolveX402PayTo,
} from "@/lib/x402";
import { writeRiskNote } from "@/lib/risk-note";
import type { CreatorAccount, LendingSnapshot } from "@/lib/graph";
import type { FounderProfile } from "@/lib/founder-search";

async function handler(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as {
    campaignTitle?: string;
    creatorWallet?: string;
    lending?: LendingSnapshot[];
    accounts?: CreatorAccount[];
    profile?: FounderProfile | null;
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
    profile: body.profile,
  });

  return NextResponse.json({
    note,
    priced: true,
    source: "zikibols-risk-report",
  });
}

let paidHandler: ((request: NextRequest) => Promise<NextResponse>) | null = null;
let paidTo: string | null = null;

export async function POST(request: NextRequest) {
  if (!isX402ServerConfigured() && !isX402ClientConfigured()) {
    return NextResponse.json(
      {
        error:
          "x402 is not configured. Set HEDERA_PAY_TO_ACCOUNT so this endpoint can require Hedera payment.",
      },
      { status: 503 },
    );
  }

  const payTo = await resolveX402PayTo();
  if (!paidHandler || paidTo !== payTo) {
    paidHandler = withX402(
      handler,
      { "/api/risk-report": getRiskReportRouteConfig(payTo) },
      getResourceServer(),
    );
    paidTo = payTo;
  }
  return paidHandler(request);
}
