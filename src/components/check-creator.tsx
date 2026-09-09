"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentResult } from "@/lib/types";
import { usd } from "@/lib/money";
import { hashscanTopicUrl, hashscanTxUrl } from "@/lib/hedera";

function storageKey(slug: string) {
  return `zikibols-diligence:${slug}`;
}

const PAYMENT_LABEL: Record<AgentResult["payments"][number]["service"], string> = {
  "founder-search": "Paid founder search",
  "risk-report": "Paid risk note",
};

function tinybarsToHbar(tinybars: string) {
  const n = Number(tinybars);
  if (!Number.isFinite(n)) return tinybars;
  return (n / 1e8).toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function CheckCreator({
  slug,
  campaignTitle,
  creatorWallet,
  creatorName,
  creatorEmail,
  location,
  onResult,
}: {
  slug: string;
  campaignTitle: string;
  creatorWallet: string;
  creatorName: string;
  creatorEmail: string | null;
  location: string;
  onResult?: (result: AgentResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(slug));
      if (!raw) return;
      const saved = JSON.parse(raw) as AgentResult;
      if (saved?.summary && Array.isArray(saved.steps) && Array.isArray(saved.payments)) {
        setResult(saved);
        onResultRef.current?.(saved);
      }
    } catch {
      sessionStorage.removeItem(storageKey(slug));
    }
  }, [slug]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignTitle,
          creatorWallet,
          creatorName,
          creatorEmail,
          location,
        }),
      });
      const json = (await response.json()) as AgentResult & { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Agent failed");
      }
      setResult(json);
      onResult?.(json);
      sessionStorage.setItem(storageKey(slug), JSON.stringify(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium">Check this creator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The agent reads live Aave v3, Compound v3, and Spark Lend, then pays Hedera
          x402 twice: once for public-web research on {creatorName}
          {creatorEmail ? ` and ${creatorEmail}` : ""} (priced per query), once for a
          written risk note. Both payment ids and the note hash land on HCS when
          operator keys are set.
        </p>
      </div>
      <Button onClick={run} disabled={loading}>
        {loading ? "Agent running…" : result ? "Run check again" : "Check this creator"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {result ? (
        <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap gap-2">
            {result.steps.map((step) => (
              <Badge key={step.tool + step.detail} variant="outline">
                {step.tool}
              </Badge>
            ))}
            {result.usedLlm ? <Badge>LLM note</Badge> : <Badge variant="secondary">Heuristic note</Badge>}
          </div>
          <p className="text-sm leading-6">{result.summary}</p>
          {result.profile.profile ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Founder profile</h3>
              <p className="text-sm leading-6">{result.profile.profile}</p>
              {result.profile.sources.length ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.profile.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        className="text-primary underline-offset-4 hover:underline"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title}
                      </a>
                      {source.snippet ? ` — ${source.snippet}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : result.profile.skipped ? (
            <p className="text-xs text-muted-foreground">{result.profile.skipped}</p>
          ) : null}
          <div>
            <h3 className="text-sm font-medium">Lending books</h3>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {result.lending.map((row) => (
                <li key={row.protocol}>
                  {row.label}: TVL {usd(row.totalValueLockedUSD)} · deposits{" "}
                  {usd(row.totalDepositBalanceUSD)} · borrows {usd(row.totalBorrowBalanceUSD)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium">Wallet on Graph</h3>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {result.accounts.map((account) => (
                <li key={account.protocol}>
                  {account.protocol}: {account.openPositionCount} open ·{" "}
                  {account.liquidationCount} liquidations
                  {account.positions.length
                    ? ` · ${account.positions
                        .slice(0, 3)
                        .map((position) => position.symbol)
                        .join(", ")}`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3">
            {result.payments.length ? (
              result.payments.map((payment) => (
                <a
                  key={payment.transaction}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={hashscanTxUrl(payment.transaction)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {PAYMENT_LABEL[payment.service]} · {tinybarsToHbar(payment.amountTinybars)} ℏ
                </a>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No x402 payment tx</span>
            )}
            {result.audit?.topicId ? (
              <a
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={hashscanTopicUrl(result.audit.topicId)}
                target="_blank"
                rel="noreferrer"
              >
                HCS topic
              </a>
            ) : null}
            {result.audit?.transactionId ? (
              <a
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={hashscanTxUrl(result.audit.transactionId)}
                target="_blank"
                rel="noreferrer"
              >
                HCS message tx
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
