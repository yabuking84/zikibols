import { NextRequest, NextResponse } from "next/server";
import { addPledge, listPledges } from "@/lib/pledges";
import { loadCampaign } from "@/lib/store";
import { hederaAccountFromEvm } from "@/lib/hedera";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("campaign");
  return NextResponse.json({ pledges: await listPledges(slug ?? undefined) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    campaignSlug?: string;
    wallet?: string;
    amountHbar?: number;
    txHash?: string | null;
  };

  if (!body.campaignSlug || !body.wallet || !body.amountHbar) {
    return NextResponse.json(
      { error: "campaignSlug, wallet, and amountHbar are required" },
      { status: 400 },
    );
  }

  const campaign = await loadCampaign(body.campaignSlug);
  if (!campaign) {
    return NextResponse.json({ error: "Unknown campaign" }, { status: 404 });
  }
  if (campaign.tokenLifecycle === "frozen" || campaign.tokenLifecycle === "paid") {
    return NextResponse.json(
      {
        error:
          "This campaign is paused and is not accepting new pledges. The raise is closed.",
      },
      { status: 409 },
    );
  }

  const pledge = await addPledge({
    campaignSlug: body.campaignSlug,
    wallet: body.wallet,
    hederaAccountId: await hederaAccountFromEvm(body.wallet),
    amountHbar: body.amountHbar,
    txHash: body.txHash ?? null,
  });

  return NextResponse.json({ pledge });
}
