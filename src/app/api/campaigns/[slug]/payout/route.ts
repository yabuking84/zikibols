import { NextRequest, NextResponse } from "next/server";
import { loadCampaign, patchCampaign } from "@/lib/store";
import {
  approveFounder,
  approveOperator,
  getPayoutApprovals,
  getSettlement,
  payoutReady,
  recordBackerPayout,
  recordFounderPayout,
} from "@/lib/payouts";
import { getBackerAccountId, payHbarMany } from "@/lib/hts";
import { payCouponToBacker, payHbarTo, setCouponRecord, unpauseBond } from "@/lib/ats";
import { hederaAccountFromEvm } from "@/lib/hedera";
import { assertPayable, settlementQuote } from "@/lib/settlement";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }

  const body = (await request.json()) as { action?: string; wallet?: string };

  try {
    if (body.action === "approve-founder") {
      if (!body.wallet) {
        return NextResponse.json({ error: "wallet is required" }, { status: 400 });
      }
      const approvals = await approveFounder(slug, body.wallet);
      return NextResponse.json({
        approvals,
        payoutReady: await payoutReady(slug),
      });
    }

    if (body.action === "approve-operator") {
      const approvals = await approveOperator(slug);
      return NextResponse.json({
        approvals,
        payoutReady: await payoutReady(slug),
      });
    }

    if (body.action === "release") {
      if (campaign.tokenLifecycle !== "frozen") {
        return NextResponse.json(
          { error: "Pause the bond before releasing the coupon." },
          { status: 400 },
        );
      }
      if (!(await payoutReady(slug))) {
        return NextResponse.json(
          {
            error: "Need two approvals: Privy founder + treasury operator.",
            approvals: await getPayoutApprovals(slug),
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
          { error: "Set a backer address or HEDERA_PAY_TO_ACCOUNT for the coupon." },
          { status: 400 },
        );
      }
      if (!campaign.tokenId) {
        return NextResponse.json({ error: "Issue the ATS bond first" }, { status: 400 });
      }

      try {
        await unpauseBond(campaign.tokenId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!/not paused|already unpaused|Pausable/i.test(message)) throw error;
      }
      const couponRecord = await setCouponRecord(campaign.tokenId);
      const paid = await payCouponToBacker(recipient);
      const updated = await patchCampaign(slug, {
        tokenLifecycle: "paid",
        payoutTxId: paid.transactionId,
        couponTxId: couponRecord.transactionId,
      });
      return NextResponse.json({ campaign: updated, ...paid, coupon: couponRecord });
    }

    if (body.action === "release-founder" || body.action === "release-backers") {
      const settled = await getSettlement(slug);
      const quote = await settlementQuote(slug);
      const founderRun = body.action === "release-founder";

      if (founderRun && settled.founder) {
        return NextResponse.json(
          { error: "The raise has already been sent to the founder." },
          { status: 400 },
        );
      }
      if (!founderRun && settled.backers) {
        return NextResponse.json(
          { error: "Backers have already been paid for this campaign." },
          { status: 400 },
        );
      }

      // Backers are paid by ATS holding, so every pledger needs a minted unit
      // first. Refuse the whole run rather than quietly skipping people.
      if (!founderRun) {
        const unminted = quote.backers.filter(
          (backer) => !backer.minted && backer.pledgedTinybars > 0,
        );
        if (unminted.length > 0) {
          return NextResponse.json(
            {
              error:
                "Mint a share to every backer before paying them. Still without a share: " +
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
      }

      const amount = founderRun ? quote.founderTinybars : quote.poolTinybars;
      try {
        await assertPayable(amount);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payout is not allowed";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      if (founderRun) {
        const paid = await payHbarTo(
          campaign.creatorWallet,
          amount,
          `Zikibols raise payout ${slug}`,
        );
        const receipt = {
          to: paid.recipient,
          tinybars: amount,
          txId: paid.transactionId,
          at: new Date().toISOString(),
        };
        await recordFounderPayout(slug, receipt);
        return NextResponse.json({ founder: receipt, quote });
      }

      const recipients: { wallet: string; accountId: string | null; tinybars: number }[] = [];
      for (const backer of quote.backers) {
        if (!backer.minted || backer.tinybars <= 0) continue;
        recipients.push({
          wallet: backer.wallet,
          accountId: backer.hederaAccountId ?? (await hederaAccountFromEvm(backer.wallet)),
          tinybars: backer.tinybars,
        });
      }
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "The backer pool is too small to split. Pledge more, or raise PAYOUT_FOUNDER_PERCENT headroom." },
          { status: 400 },
        );
      }

      const memo = `Zikibols backer payout ${slug}`;
      const native = recipients.filter((entry) => entry.accountId);
      const txIds: string[] = [];
      if (native.length > 0) {
        const paid = await payHbarMany(
          native.map((entry) => ({ accountId: entry.accountId as string, tinybars: entry.tinybars })),
          memo,
        );
        txIds.push(paid.transactionId);
      }
      for (const entry of recipients.filter((row) => !row.accountId)) {
        const paid = await payHbarTo(entry.wallet, entry.tinybars, memo);
        txIds.push(paid.transactionId);
      }

      const receipt = {
        count: recipients.length,
        tinybars: recipients.reduce((sum, entry) => sum + entry.tinybars, 0),
        txId: txIds[0],
        at: new Date().toISOString(),
      };
      await recordBackerPayout(slug, receipt);
      return NextResponse.json({ backers: receipt, txIds, quote });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
