import { connection } from "next/server";
import { notFound } from "next/navigation";
import { campaigns, getCampaign } from "@/lib/campaigns";
import { CampaignWorkspace } from "@/components/campaign-workspace";

export function generateStaticParams() {
  return campaigns.map((campaign) => ({ slug: campaign.slug }));
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  return <CampaignWorkspace campaign={campaign} />;
}
