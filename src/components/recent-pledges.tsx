"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Pledge } from "@/lib/types";
import { useCatalog } from "@/components/use-catalog";
import { hbar, shortAddress } from "@/lib/money";
import { hashscanTxUrl } from "@/lib/hedera";

export function RecentPledges({
  campaignSlug,
  refreshKey = 0,
}: {
  campaignSlug?: string;
  refreshKey?: number;
}) {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const campaigns = useCatalog();

  const load = useCallback(async () => {
    const query = campaignSlug ? `?campaign=${campaignSlug}` : "";
    const response = await fetch(`/api/pledges${query}`);
    const json = (await response.json()) as { pledges?: Pledge[] };
    setPledges(json.pledges ?? []);
  }, [campaignSlug]);

  useEffect(() => {
    load().catch(() => setPledges([]));
  }, [load, refreshKey]);

  if (pledges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pledges yet. Check the creator, then send HBAR from a Privy wallet.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {pledges.slice(0, 8).map((pledge) => {
        const campaign = campaigns.find((item) => item.slug === pledge.campaignSlug);
        return (
          <li key={pledge.id} className="flex items-center gap-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              {campaignSlug ? null : (
                <Link
                  href={`/campaigns/${pledge.campaignSlug}`}
                  className="block truncate font-medium hover:underline"
                >
                  {campaign?.title ?? pledge.campaignSlug}
                </Link>
              )}
              <p className="truncate font-mono text-xs text-muted-foreground">
                {shortAddress(pledge.wallet)}
                {pledge.hederaAccountId ? ` · ${pledge.hederaAccountId}` : ""}
              </p>
            </div>
            <span className="tabular-nums">{hbar(pledge.amountHbar)}</span>
            {pledge.txHash ? (
              <a
                className="text-xs text-primary underline-offset-4 hover:underline"
                href={hashscanTxUrl(pledge.txHash)}
                target="_blank"
                rel="noreferrer"
              >
                tx
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
