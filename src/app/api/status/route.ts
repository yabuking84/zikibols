import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/status";
import { listPledges } from "@/lib/pledges";
import { loadCampaigns } from "@/lib/store";

export async function GET() {
  const campaigns = await loadCampaigns();
  return NextResponse.json({
    integrations: getIntegrationStatus(),
    pledges: await listPledges(),
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
