import { NextRequest, NextResponse } from "next/server";
import { getCampaign, patchCampaign } from "@/lib/campaigns";
import {
  freezeCampaignHolder,
  getBackerAccountId,
  issueCampaignToken,
  pauseCampaignToken,
  transferCampaignToken,
} from "@/lib/hts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const body = (await request.json()) as { action?: string };

  try {
    if (body.action === "issue") {
      if (campaign.tokenId) {
        return NextResponse.json({ error: "Token already issued" }, { status: 400 });
      }
      const issued = await issueCampaignToken({
        name: campaign.tokenName,
        symbol: campaign.tokenSymbol,
        memo: `zikibols ${campaign.assetClass} ${campaign.slug}`,
        supply: 1000,
      });
      const updated = patchCampaign(slug, {
        tokenId: issued.tokenId,
        tokenLifecycle: "issued",
        issueTxId: issued.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...issued });
    }

    if (body.action === "transfer") {
      if (campaign.tokenLifecycle !== "issued") {
        return NextResponse.json({ error: "Issue the token first" }, { status: 400 });
      }
      const recipient = getBackerAccountId();
      if (!recipient) {
        return NextResponse.json(
          { error: "Set HEDERA_BACKER_ACCOUNT_ID to airdrop one share to a backer." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the token first" }, { status: 400 });
      }
      const transferred = await transferCampaignToken(campaign.tokenId, recipient);
      const updated = patchCampaign(slug, {
        tokenLifecycle: "transferred",
        transferTxId: transferred.transactionId,
        backerAccountId: recipient,
      });
      return NextResponse.json({ campaign: updated, ...transferred });
    }

    if (body.action === "freeze") {
      const canFreeze =
        campaign.tokenLifecycle === "transferred" ||
        (campaign.tokenLifecycle === "issued" && !campaign.backerAccountId);
      if (!canFreeze) {
        return NextResponse.json(
          { error: "Airdrop a share first, or pause immediately after issue if there is no backer." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the token first" }, { status: 400 });
      }
      if (campaign.backerAccountId) {
        const frozen = await freezeCampaignHolder(
          campaign.tokenId,
          campaign.backerAccountId,
        );
        const updated = patchCampaign(slug, {
          tokenLifecycle: "frozen",
          freezeTxId: frozen.transactionId,
        });
        return NextResponse.json({ campaign: updated, ...frozen, mode: "account-freeze" });
      }
      const paused = await pauseCampaignToken(campaign.tokenId);
      const updated = patchCampaign(slug, {
        tokenLifecycle: "frozen",
        freezeTxId: paused.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...paused, mode: "pause" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Hedera token action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
