import { NextResponse } from "next/server";
import { listPledges, loadCampaign } from "@/lib/store";
import { getPayoutApprovals, getSettlement, payoutReady } from "@/lib/payouts";
import { getBackerAccountId, isHederaOperatorConfigured } from "@/lib/hts";
import { hederaAccountFromEvm } from "@/lib/hedera";
import { settlementQuote } from "@/lib/settlement";
import { holdersFromPledges } from "@/lib/mints";

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
  const pledges = await listPledges(slug);
  const holders = holdersFromPledges(pledges, campaign.mints);
  for (const holder of holders) {
    if (!holder.accountId) {
      holder.accountId = await hederaAccountFromEvm(holder.wallet);
    }
  }
  return NextResponse.json({
    campaign,
    approvals,
    payoutReady: await payoutReady(slug),
    operatorConfigured: isHederaOperatorConfigured(),
    settlement: {
      quote: await settlementQuote(slug),
      paid: await getSettlement(slug),
    },
    backerAccountId,
    holders,
  });
}
