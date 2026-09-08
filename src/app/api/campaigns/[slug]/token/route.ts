import { NextRequest, NextResponse } from "next/server";
import { loadCampaign, patchCampaign } from "@/lib/store";
import { isHederaAccountId } from "@/lib/hedera";
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
  const campaign = await loadCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const body = (await request.json()) as { action?: string; accountId?: string };

  try {
    if (body.action === "set-backer") {
      if (campaign.tokenLifecycle !== "draft" && campaign.tokenLifecycle !== "issued") {
        return NextResponse.json(
          { error: "Backer account can only be set before the share is transferred." },
          { status: 400 },
        );
      }
      const accountId = body.accountId?.trim() ?? "";
      if (!isHederaAccountId(accountId)) {
        return NextResponse.json(
          { error: "Backer account must look like 0.0.12345." },
          { status: 400 },
        );
      }
      const updated = await patchCampaign(slug, { backerAccountId: accountId });
      return NextResponse.json({ campaign: updated, backerAccountId: accountId });
    }

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
      const updated = await patchCampaign(slug, {
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
      const recipient = campaign.backerAccountId || getBackerAccountId();
      if (!recipient) {
        return NextResponse.json(
          { error: "Set a backer Hedera account on this desk (or HEDERA_BACKER_ACCOUNT_ID) to airdrop one share." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the token first" }, { status: 400 });
      }
      const transferred = await transferCampaignToken(campaign.tokenId, recipient);
      const updated = await patchCampaign(slug, {
        tokenLifecycle: "transferred",
        transferTxId: transferred.transactionId,
        backerAccountId: recipient,
      });
      return NextResponse.json({ campaign: updated, ...transferred });
    }

    if (body.action === "freeze") {
      const holder = campaign.backerAccountId || getBackerAccountId() || "";
      const canFreeze =
        campaign.tokenLifecycle === "transferred" ||
        (campaign.tokenLifecycle === "issued" && !holder);
      if (!canFreeze) {
        return NextResponse.json(
          { error: "Airdrop a share first, or pause immediately after issue if there is no backer." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the token first" }, { status: 400 });
      }
      if (holder) {
        const frozen = await freezeCampaignHolder(campaign.tokenId, holder);
        const updated = await patchCampaign(slug, {
          tokenLifecycle: "frozen",
          freezeTxId: frozen.transactionId,
          backerAccountId: holder,
        });
        return NextResponse.json({ campaign: updated, ...frozen, mode: "account-freeze" });
      }
      const paused = await pauseCampaignToken(campaign.tokenId);
      const updated = await patchCampaign(slug, {
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
