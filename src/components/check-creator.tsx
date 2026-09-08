"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentResult } from "@/lib/types";
import { usd } from "@/lib/money";
import { hashscanTopicUrl, hashscanTxUrl } from "@/lib/hedera";

export function CheckCreator({
  campaignTitle,
  creatorWallet,
  creatorName,
  creatorEmail,
  location,
  onResult,
}: {
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
          The agent reads live Aave v3, Compound v3, and Spark Lend, searches the
          public web for {creatorName}
          {creatorEmail ? ` and ${creatorEmail}` : ""}, pays Hedera x402 for a
          written risk note, then hashes that note onto HCS when operator keys are set.
        </p>
      </div>
      <Button onClick={run} disabled={loading}>
        {loading ? "Agent running…" : "Check this creator"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {result ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap gap-2">
            {result.steps.map((step) => (
              <Badge key={step.tool + step.detail} variant="outline">
                {step.tool}
              </Badge>
            ))}
            {result.usedLlm ? <Badge>LLM note</Badge> : <Badge variant="secondary">Heuristic note</Badge>}
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {result.steps.map((step) => (
              <li key={step.tool + step.detail}>{step.detail}</li>
            ))}
          </ul>
          <p className="text-sm leading-6">{result.summary}</p>
          {result.profile.profile ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Founder profile</h3>
              <p className="text-sm leading-6">{result.profile.profile}</p>
              {result.profile.sources.length ? (
                <ul className="space-y-1 text-xs">
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
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : result.profile.skipped ? (
            <p className="text-xs text-muted-foreground">{result.profile.skipped}</p>
          ) : null}
          <ul className="space-y-1 text-xs text-muted-foreground">
            {result.lending.map((row) => (
              <li key={row.protocol}>
                {row.label}: TVL {usd(row.totalValueLockedUSD)} · deposits{" "}
                {usd(row.totalDepositBalanceUSD)} · borrows {usd(row.totalBorrowBalanceUSD)}
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-xs text-muted-foreground">
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
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {result.payment?.transaction ? (
              <a
                className="inline-block text-sm text-primary underline-offset-4 hover:underline"
                href={hashscanTxUrl(result.payment.transaction)}
                target="_blank"
                rel="noreferrer"
              >
                Hedera payment tx
              </a>
            ) : null}
            {result.audit?.topicId ? (
              <a
                className="inline-block text-sm text-primary underline-offset-4 hover:underline"
                href={hashscanTopicUrl(result.audit.topicId)}
                target="_blank"
                rel="noreferrer"
              >
                HCS topic
              </a>
            ) : null}
            {result.audit?.transactionId ? (
              <a
                className="inline-block text-sm text-primary underline-offset-4 hover:underline"
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
