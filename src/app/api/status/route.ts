import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/status";
import { listPledges } from "@/lib/pledges";
import { campaigns } from "@/lib/campaigns";

export async function GET() {
  return NextResponse.json({
    integrations: getIntegrationStatus(),
    pledges: listPledges(),
    campaigns: campaigns.map((campaign) => ({
      slug: campaign.slug,
      title: campaign.title,
      pledgedHbar: campaign.pledgedHbar,
      backers: campaign.backers,
      tokenLifecycle: campaign.tokenLifecycle,
      tokenId: campaign.tokenId,
    })),
  });
}
