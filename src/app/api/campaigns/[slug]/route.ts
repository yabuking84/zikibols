import { NextResponse } from "next/server";
import { listPledges, loadCampaign } from "@/lib/store";
import { getPayoutApprovals, getSettlement, payoutReady } from "@/lib/payouts";
import { getBackerAccountId, isHederaOperatorConfigured } from "@/lib/hts";
import { hederaAccountFromEvm } from "@/lib/hedera";
import { settlementQuote } from "@/lib/settlement";

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
  const latest = (await listPledges(slug))[0];
  const suggestedBackerAccountId =
    latest?.hederaAccountId ||
    (latest ? await hederaAccountFromEvm(latest.wallet) : null);
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
    suggestedBacker: latest
      ? {
          wallet: latest.wallet,
          accountId: suggestedBackerAccountId,
          txHash: latest.txHash,
        }
      : null,
  });
}
