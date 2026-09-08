import { NextResponse } from "next/server";
import { loadCampaign } from "@/lib/store";
import { getPayoutApprovals, payoutReady } from "@/lib/payouts";
import { getBackerAccountId, isHederaOperatorConfigured } from "@/lib/hts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const approvals = await getPayoutApprovals(slug);
  const backerAccountId = campaign.backerAccountId || getBackerAccountId() || null;
  return NextResponse.json({
    campaign,
    approvals,
    payoutReady: await payoutReady(slug),
    operatorConfigured: isHederaOperatorConfigured(),
    backerAccountId,
  });
}
