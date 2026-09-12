import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Landmark } from "lucide-react";
import { assetClassLabel } from "@/lib/campaigns";
import { loadCampaign } from "@/lib/store";
import { TokenPanel } from "@/components/token-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Operator desk</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{assetClassLabel(campaign.assetClass)}</Badge>
          <Badge variant="outline">{campaign.tokenSymbol}</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
        <p className="text-muted-foreground">
          {campaign.tokenLifecycle === "paid"
            ? "This campaign’s coupon is already on HashScan. Start a campaign to walk Issue → Mint → Pause → Coupon live."
            : "Issue the ATS bond, mint one unit to each pledger, pause it, then after founder + treasury sign-off release the coupon and settle the raise: most of it to the founder, the rest split pro-rata across backers. Backers pledge from the campaign page."}
        </p>
        <Link
          href={`/campaigns/${campaign.slug}`}
          className={`${buttonVariants({ variant: "outline", size: "sm" })} w-fit`}
        >
          <Landmark className="size-3.5" />
          Back to campaign
        </Link>
      </div>
      <section className="rounded-xl border bg-card p-5">
        <TokenPanel slug={campaign.slug} />
      </section>
    </main>
  );
}
