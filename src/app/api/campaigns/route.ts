import { NextRequest, NextResponse } from "next/server";
import {
  isEvmAddress,
  toCatalogItem,
  type AssetClass,
} from "@/lib/campaigns";
import { createCampaign, loadCampaigns } from "@/lib/store";

export async function GET() {
  const campaigns = await loadCampaigns();
  return NextResponse.json({
    campaigns: campaigns.map(toCatalogItem),
  });
}

function asAssetClass(value: unknown): AssetClass | null {
  return value === "invoice-receivable" || value === "revenue-share" ? value : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const blurb = typeof body.blurb === "string" ? body.blurb.trim() : "";
  const story = typeof body.story === "string" ? body.story.trim() : "";
  const creatorName = typeof body.creatorName === "string" ? body.creatorName.trim() : "";
  const creatorWallet = typeof body.creatorWallet === "string" ? body.creatorWallet.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const tokenName = typeof body.tokenName === "string" ? body.tokenName.trim() : "";
  const tokenSymbol = typeof body.tokenSymbol === "string" ? body.tokenSymbol.trim().toUpperCase() : "";
  const assetClass = asAssetClass(body.assetClass);
  const goalHbar = Number(body.goalHbar);
  const daysLeft = Number(body.daysLeft);

  if (!title || !blurb || !story || !creatorName || !location || !tokenName || !tokenSymbol) {
    return NextResponse.json({ error: "Fill every field." }, { status: 400 });
  }
  if (!isEvmAddress(creatorWallet)) {
    return NextResponse.json(
      { error: "creatorWallet must be a 0x-prefixed 40-hex Ethereum address for Graph lookups." },
      { status: 400 },
    );
  }
  if (!assetClass) {
    return NextResponse.json({ error: "assetClass is required" }, { status: 400 });
  }
  if (!Number.isFinite(goalHbar) || goalHbar <= 0) {
    return NextResponse.json({ error: "goalHbar must be a positive number" }, { status: 400 });
  }
  if (!Number.isInteger(daysLeft) || daysLeft <= 0) {
    return NextResponse.json({ error: "daysLeft must be a positive integer" }, { status: 400 });
  }
  if (!/^[A-Z0-9]{2,8}$/.test(tokenSymbol)) {
    return NextResponse.json(
      { error: "tokenSymbol must be 2–8 letters or digits." },
      { status: 400 },
    );
  }

  const campaign = await createCampaign({
    title,
    blurb,
    story,
    creatorName,
    creatorWallet,
    goalHbar,
    daysLeft,
    location,
    assetClass,
    tokenName,
    tokenSymbol,
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
