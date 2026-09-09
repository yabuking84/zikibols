import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { loadCampaign, patchCampaign } from "@/lib/store";
import { getBackerAccountId } from "@/lib/hts";
import {
  controlListBacker,
  isBackerId,
  issueBond,
  mintToBacker,
  pauseBond,
} from "@/lib/ats";

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
          { error: "Backer can only be set before the share is minted." },
          { status: 400 },
        );
      }
      const accountId = body.accountId?.trim() ?? "";
      if (!isBackerId(accountId)) {
        return NextResponse.json(
          { error: "Backer must be a Privy 0x address or a Hedera account like 0.0.12345." },
          { status: 400 },
        );
      }
      const updated = await patchCampaign(slug, { backerAccountId: accountId });
      return NextResponse.json({ campaign: updated, backerAccountId: accountId });
    }

    if (body.action === "issue") {
      if (campaign.tokenId) {
        return NextResponse.json({ error: "Bond already issued" }, { status: 400 });
      }
      const issued = await issueBond(campaign);
      const updated = await patchCampaign(slug, {
        tokenId: issued.tokenId,
        tokenLifecycle: "issued",
        issueTxId: issued.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...issued });
    }

    if (body.action === "transfer") {
      if (campaign.tokenLifecycle !== "issued") {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      const recipient = campaign.backerAccountId || getBackerAccountId();
      if (!recipient) {
        return NextResponse.json(
          {
            error:
              "Set a backer Privy address (or Hedera 0.0.x / HEDERA_BACKER_ACCOUNT_ID) to mint one share.",
          },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      const transferred = await mintToBacker(campaign.tokenId, recipient);
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
          { error: "Mint a share first, or pause immediately after issue if there is no backer." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      if (holder) {
        try {
          await controlListBacker(campaign.tokenId, holder);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!/already in the control list/i.test(message)) throw error;
        }
      }
      const paused = await pauseBond(campaign.tokenId);
      const updated = await patchCampaign(slug, {
        tokenLifecycle: "frozen",
        freezeTxId: paused.transactionId,
        backerAccountId: holder || campaign.backerAccountId,
      });
      return NextResponse.json({ campaign: updated, ...paused, mode: "pause" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ATS token action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
