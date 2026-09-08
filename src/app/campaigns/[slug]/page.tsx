import { connection } from "next/server";
import { notFound } from "next/navigation";
import { loadCampaign } from "@/lib/store";
import { CampaignWorkspace } from "@/components/campaign-workspace";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  return <CampaignWorkspace campaign={campaign} />;
}
