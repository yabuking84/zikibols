"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  assetClassLabel,
  fundedPercent,
  isSeedCatalog,
  type Campaign,
} from "@/lib/campaigns";
import type { AgentResult } from "@/lib/types";
import { hbar } from "@/lib/money";
import { hashscanContractUrl } from "@/lib/hedera";
import { HashScanAccount } from "@/components/hashscan-account";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { CheckCreator } from "@/components/check-creator";
import { PledgePanel } from "@/components/pledge-panel";
import { RecentPledges } from "@/components/recent-pledges";
import { cn } from "cn";

export function CampaignWorkspace({ campaign: initial }: { campaign: Campaign }) {
  const [campaign, setCampaign] = useState(initial);
  const [diligence, setDiligence] = useState<AgentResult | null>(null);
  const [skippedCheck, setSkippedCheck] = useState(false);
  const [pledgeTick, setPledgeTick] = useState(0);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/campaigns/${initial.slug}`);
    const json = (await response.json()) as { campaign?: Campaign };
    if (json.campaign) setCampaign(json.campaign);
  }, [initial.slug]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const funded = fundedPercent(campaign);
  const closed =
    campaign.tokenLifecycle === "frozen" || campaign.tokenLifecycle === "paid";
  const canPledge = !closed && (Boolean(diligence) || skippedCheck);
  const tokenized = campaign.tokenLifecycle !== "draft";

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="space-y-6">
        <ol className="flex flex-wrap gap-2 text-xs">
          {[
            { n: "1", label: "Diligence", on: Boolean(diligence) },
            { n: "2", label: "Pledge", on: canPledge },
            { n: "3", label: "Tokenize", on: tokenized },
          ].map((step) => (
            <li
              key={step.label}
              className={cn(
                "rounded-full border px-2.5 py-1",
                step.on
                  ? "border-foreground/20 bg-muted font-medium"
                  : "text-muted-foreground",
              )}
            >
              {step.n} {step.label}
            </li>
          ))}
        </ol>
        <div className="space-y-2">
          <Badge variant="secondary">{assetClassLabel(campaign.assetClass)}</Badge>
          {closed ? <Badge variant="outline">Paused — not accepting pledges</Badge> : null}
          <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.blurb}</p>
        </div>
        <div className="space-y-2">
          <div className="flex text-sm">
            <span className="font-medium">
              {hbar(campaign.pledgedHbar)} of {hbar(campaign.goalHbar)}
            </span>
            <span className="ml-auto text-muted-foreground tabular-nums">{funded}%</span>
          </div>
          <Progress value={funded} />
        </div>
        <p className="text-sm text-muted-foreground">
          {campaign.backers} backers · {campaign.daysLeft} days left · {campaign.location}
          {isSeedCatalog(campaign.slug)
            ? " · pledged total includes a seed book plus any live Privy pledges"
            : ""}
        </p>
        <Separator />
        <section className="space-y-3">
          <h2 className="text-base font-medium">Story</h2>
          <p className="leading-7 text-pretty">{campaign.story}</p>
          <p className="text-sm text-muted-foreground">
            {campaign.creatorName}
            {campaign.creatorEmail ? ` · ${campaign.creatorEmail}` : ""}
          </p>
          <a
            className="inline-block break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
            href={`https://etherscan.io/address/${campaign.creatorWallet}`}
            target="_blank"
            rel="noreferrer"
          >
            {campaign.creatorWallet}
          </a>
          <p className="text-xs text-muted-foreground">
            Ethereum wallet for The Graph diligence — not the Hedera campaign treasury.
          </p>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-base font-medium">Recent pledges</h2>
          <RecentPledges campaignSlug={campaign.slug} refreshKey={pledgeTick} />
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-medium">On Hedera</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pledges go to this treasury. {campaign.tokenName} ({campaign.tokenSymbol})
            is issued from the operator desk as an ATS bond.
          </p>
          <div className="mt-3 space-y-3">
            <HashScanAccount evm={campaign.treasuryEvm} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bond contract</p>
              {campaign.tokenId ? (
                <a
                  className="block break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
                  href={hashscanContractUrl(campaign.tokenId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {campaign.tokenId}
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Not issued yet. Open the operator desk to put the bond on HashScan.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-xs font-medium">
                {campaign.tokenLifecycle === "frozen"
                  ? "Paused — raise closed"
                  : campaign.tokenLifecycle === "paid"
                    ? "Settled — raise closed"
                    : campaign.tokenLifecycle}
              </p>
            </div>
          </div>
          <Link
            href={`/campaigns/${campaign.slug}/operate`}
            className={`${buttonVariants({ size: "sm" })} mt-4 w-fit`}
          >
            Open operator desk
          </Link>
        </section>
      </article>
      <aside className="space-y-6 self-start rounded-xl border bg-card p-5 lg:sticky lg:top-16">
        <CheckCreator
          slug={campaign.slug}
          campaignTitle={campaign.title}
          creatorWallet={campaign.creatorWallet}
          creatorName={campaign.creatorName}
          creatorEmail={campaign.creatorEmail}
          location={campaign.location}
          onResult={setDiligence}
        />
        <Separator />
        <PledgePanel
          campaign={campaign}
          diligenceDone={canPledge}
          refreshKey={pledgeTick}
          onSkip={() => setSkippedCheck(true)}
          onPledged={() => {
            setPledgeTick((value) => value + 1);
            refresh().catch(() => undefined);
          }}
        />
      </aside>
    </main>
  );
}
