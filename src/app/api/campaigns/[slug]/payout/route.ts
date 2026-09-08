import { NextRequest, NextResponse } from "next/server";
import { getCampaign, patchCampaign } from "@/lib/campaigns";
import {
  approveFounder,
  approveOperator,
  getPayoutApprovals,
  payoutReady,
} from "@/lib/payouts";
import { getBackerAccountId, payCoupon } from "@/lib/hts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const body = (await request.json()) as { action?: string; wallet?: string };

  try {
    if (body.action === "approve-founder") {
      if (!body.wallet) {
        return NextResponse.json({ error: "wallet is required" }, { status: 400 });
      }
      return NextResponse.json({
        approvals: approveFounder(slug, body.wallet),
        payoutReady: payoutReady(slug),
      });
    }

    if (body.action === "approve-operator") {
      return NextResponse.json({
        approvals: approveOperator(slug),
        payoutReady: payoutReady(slug),
      });
    }

    if (body.action === "release") {
      if (campaign.tokenLifecycle !== "frozen") {
        return NextResponse.json(
          { error: "Freeze or pause the token before releasing the coupon." },
          { status: 400 },
        );
      }
      if (campaign.tokenLifecycle !== "frozen") {
        return NextResponse.json(
          { error: "Freeze or pause the token before releasing the coupon." },
          { status: 400 },
        );
      }
      if (!payoutReady(slug)) {
        return NextResponse.json(
          {
            error: "Need two approvals: Privy founder + treasury operator.",
            approvals: getPayoutApprovals(slug),
          },
          { status: 403 },
        );
      }
      const recipient =
        campaign.backerAccountId ||
        getBackerAccountId() ||
        process.env.HEDERA_PAY_TO_ACCOUNT ||
        "";
      if (!recipient) {
        return NextResponse.json(
          { error: "Set HEDERA_BACKER_ACCOUNT_ID or HEDERA_PAY_TO_ACCOUNT for the coupon." },
          { status: 400 },
        );
      }
      const paid = await payCoupon(recipient);
      const updated = patchCampaign(slug, {
        tokenLifecycle: "paid",
        payoutTxId: paid.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...paid });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
