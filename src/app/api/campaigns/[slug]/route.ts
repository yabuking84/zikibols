import { NextResponse } from "next/server";
import { getCampaign } from "@/lib/campaigns";
import { getPayoutApprovals, payoutReady } from "@/lib/payouts";
import { getBackerAccountId, isHederaOperatorConfigured } from "@/lib/hts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const approvals = getPayoutApprovals(slug);
  return NextResponse.json({
    campaign,
    approvals,
    payoutReady: payoutReady(slug),
    operatorConfigured: isHederaOperatorConfigured(),
    backerAccountId: getBackerAccountId() || null,
  });
}
