import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { getSettlement, loadCampaign, patchCampaign, recordShareMint } from "@/lib/store";
import { getBackerAccountId } from "@/lib/hts";
import {
  controlListBacker,
  isBackerId,
  issueBond,
  mintToBacker,
  pauseBond,
  unpauseBond,
} from "@/lib/ats";
import { alreadyMinted } from "@/lib/mints";
import { settlementQuote } from "@/lib/settlement";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const body = (await request.json()) as {
    action?: string;
    accountId?: string;
    wallet?: string;
  };

  try {
    if (body.action === "set-backer") {
      if (campaign.tokenLifecycle === "frozen" || campaign.tokenLifecycle === "paid") {
        return NextResponse.json(
          { error: "Coupon recipient is locked after the bond is paused." },
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
      if (campaign.tokenLifecycle !== "issued" && campaign.tokenLifecycle !== "transferred") {
        return NextResponse.json(
          {
            error:
              campaign.tokenLifecycle === "draft"
                ? "Issue the ATS bond first"
                : "Minting is closed after the bond is paused.",
          },
          { status: 400 },
        );
      }
      const recipient =
        body.accountId?.trim() || campaign.backerAccountId || getBackerAccountId() || "";
      if (!isBackerId(recipient)) {
        return NextResponse.json(
          {
            error:
              "Pick a pledger, or type a Privy 0x / Hedera 0.0.x, to mint one share.",
          },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      if (alreadyMinted(campaign.mints, recipient, body.wallet)) {
        return NextResponse.json(
          { error: "This backer already has a share. Mint to another pledger." },
          { status: 400 },
        );
      }
      const transferred = await mintToBacker(campaign.tokenId, recipient);
      const mint = {
        wallet: body.wallet?.trim() || recipient,
        accountId: recipient,
        txId: transferred.transactionId,
        at: new Date().toISOString(),
      };
      const updated = await recordShareMint(slug, mint);
      return NextResponse.json({ campaign: updated, ...transferred, mint });
    }

    if (body.action === "freeze") {
      const canFreeze =
        campaign.tokenLifecycle === "transferred" ||
        campaign.tokenLifecycle === "issued";
      if (!canFreeze) {
        return NextResponse.json(
          { error: "Issue the ATS bond first, then pause it." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      const quote = await settlementQuote(slug);
      const unminted = quote.backers.filter(
        (backer) => !backer.minted && backer.pledgedTinybars > 0,
      );
      if (unminted.length > 0) {
        return NextResponse.json(
          {
            error:
              "Mint a share to every backer before pausing. Pause closes minting. Still without a share: " +
              `${unminted.length} of ${quote.backers.length}.`,
            unminted: unminted.map((backer) => ({
              wallet: backer.wallet,
              accountId: backer.hederaAccountId,
              pledgedTinybars: backer.pledgedTinybars,
            })),
          },
          { status: 409 },
        );
      }
      // Mint already put each holder on the allowed list. Only list leftovers
      // (saved / env backer) so Pause does not re-add and trip SDK error 20013.
      const leftovers = [campaign.backerAccountId || getBackerAccountId() || ""].filter(
        (id) => id && !alreadyMinted(campaign.mints, id),
      );
      for (const holder of leftovers) {
        await controlListBacker(campaign.tokenId, holder);
      }
      const paused = await pauseBond(campaign.tokenId);
      const updated = await patchCampaign(slug, {
        tokenLifecycle: "frozen",
        freezeTxId: paused.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...paused, mode: "pause" });
    }

    if (body.action === "unpause") {
      if (campaign.tokenLifecycle !== "frozen") {
        return NextResponse.json(
          {
            error:
              campaign.tokenLifecycle === "paid"
                ? "This bond was already released through the coupon payout."
                : "The bond is not paused.",
          },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }
      // Unpause reopens pledges, so a raise that already paid out can never come
      // back — new pledges would arrive after their share of the split was sent.
      const settled = await getSettlement(slug);
      if (settled.founder || settled.backers) {
        const done = [settled.founder && "the founder", settled.backers && "the backers"]
          .filter(Boolean)
          .join(" and ");
        return NextResponse.json(
          {
            error: `A payout has already run for ${done}. Unpausing would reopen the raise to pledges that no payout covers.`,
          },
          { status: 409 },
        );
      }
      const unpaused = await unpauseBond(campaign.tokenId);
      const updated = await patchCampaign(slug, {
        tokenLifecycle: campaign.mints.length > 0 ? "transferred" : "issued",
        unpauseTxId: unpaused.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...unpaused, mode: "unpause" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ATS token action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
