import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import {
  getFounderSearchRoutes,
  getResourceServer,
  isX402ClientConfigured,
  isX402ServerConfigured,
  resolveX402PayTo,
} from "@/lib/x402";
import { isSearchConfigured, searchFounder } from "@/lib/founder-search";
import { isPublicEmail } from "@/lib/campaigns";

/**
 * Paid public-web founder research. Metered by path segment:
 *   POST /api/founder-search/1  → name query only            (1 × base price)
 *   POST /api/founder-search/2  → name query + email query   (2 × base price)
 * The x402 paywall sits in front of `handler`; the Tavily check runs before the
 * paywall so a caller is never charged for a service that cannot run.
 */

function queriesFromPath(request: NextRequest): 1 | 2 | null {
  const last = request.nextUrl.pathname.split("/").filter(Boolean).pop();
  if (last === "1") return 1;
  if (last === "2") return 2;
  return null;
}

async function handler(request: NextRequest): Promise<NextResponse> {
  const queries = queriesFromPath(request);
  if (!queries) {
    return NextResponse.json(
      { error: "Use /api/founder-search/1 (name) or /api/founder-search/2 (name + email)." },
      { status: 404 },
    );
  }

  const body = (await request.json()) as {
    creatorName?: string;
    creatorEmail?: string | null;
    campaignTitle?: string;
    location?: string;
  };

  const creatorName = body.creatorName?.trim() ?? "";
  const campaignTitle = body.campaignTitle?.trim() ?? "";
  if (!creatorName || !campaignTitle) {
    return NextResponse.json(
      { error: "creatorName and campaignTitle are required" },
      { status: 400 },
    );
  }

  const emailRaw = body.creatorEmail?.trim() ?? "";
  const creatorEmail =
    queries === 2 && emailRaw && isPublicEmail(emailRaw) ? emailRaw.toLowerCase() : null;
  if (queries === 2 && !creatorEmail) {
    return NextResponse.json(
      { error: "/api/founder-search/2 needs a valid creatorEmail; use /1 for a name-only search." },
      { status: 400 },
    );
  }

  const profile = await searchFounder({
    creatorName,
    creatorEmail,
    campaignTitle,
    location: body.location?.trim() ?? "",
  });

  return NextResponse.json({
    profile,
    queries,
    priced: true,
    source: "zikibols-founder-search",
  });
}

let paidHandler: ((request: NextRequest) => Promise<NextResponse>) | null = null;
let paidTo: string | null = null;

export async function POST(request: NextRequest) {
  if (!isSearchConfigured()) {
    return NextResponse.json(
      {
        error: "Founder search is not configured. Set TAVILY_API_KEY to sell public-web research.",
        skipped: "Set TAVILY_API_KEY to search the public web for this founder",
      },
      { status: 503 },
    );
  }

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
    paidHandler = withX402(handler, getFounderSearchRoutes(payTo), getResourceServer());
    paidTo = payTo;
  }
  return paidHandler(request);
}
