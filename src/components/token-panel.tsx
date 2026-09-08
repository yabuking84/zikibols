"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Campaign, TokenLifecycle } from "@/lib/campaigns";
import { hashscanTokenUrl, hashscanTxUrl } from "@/lib/hedera";
import { shortAddress } from "@/lib/money";

type Snapshot = {
  campaign: Campaign;
  approvals: { founderWallet: string | null; operator: boolean };
  payoutReady: boolean;
  operatorConfigured: boolean;
  backerAccountId: string | null;
};

const LIFECYCLE_LABEL: Record<TokenLifecycle, string> = {
  draft: "Draft",
  issued: "Issued",
  transferred: "Transferred",
  frozen: "Frozen / paused",
  paid: "Coupon paid",
};

function TxLink({ id, label }: { id: string | null; label: string }) {
  if (!id) return null;
  return (
    <a
      className="block text-xs text-primary underline-offset-4 hover:underline"
      href={hashscanTxUrl(id)}
      target="_blank"
      rel="noreferrer"
    >
      {label}
    </a>
  );
}

export function TokenPanel({ slug }: { slug: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/campaigns/${slug}`);
    const json = (await response.json()) as Snapshot & { error?: string };
    if (!response.ok) throw new Error(json.error ?? "Failed to load campaign");
    setData(json);
  }, [slug]);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [refresh]);

  async function post(path: string, body: Record<string, string>) {
    setBusy(body.action);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Request failed");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading Hedera asset…</p>;
  }

  const { campaign, approvals, payoutReady, operatorConfigured, backerAccountId } = data;
  const lifecycle = campaign.tokenLifecycle;
  const canIssue = lifecycle === "draft" && operatorConfigured;
  const canTransfer = lifecycle === "issued" && Boolean(backerAccountId);
  const canFreeze =
    lifecycle === "transferred" || (lifecycle === "issued" && !backerAccountId);
  const canApprove = lifecycle === "transferred" || lifecycle === "frozen";
  const canRelease = payoutReady && lifecycle === "frozen";
  const nextStep =
    lifecycle === "draft"
      ? "Next: issue the HTS token."
      : lifecycle === "issued" && backerAccountId
        ? "Next: airdrop one share to the backer account."
        : lifecycle === "issued"
          ? "Next: pause the token, or set HEDERA_BACKER_ACCOUNT_ID to airdrop first."
          : lifecycle === "transferred"
            ? "Next: freeze that holder so the share cannot trade."
            : lifecycle === "frozen"
              ? "Next: both founders sign, then release the coupon."
              : "Coupon paid.";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium">Hedera asset</h2>
        <Badge variant="secondary">{LIFECYCLE_LABEL[lifecycle]}</Badge>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {campaign.tokenName} ({campaign.tokenSymbol}) is an invoice/revenue-share token
        with freeze and pause keys — a lifecycle like Asset Tokenization Studio, not a
        meme ticker.
      </p>
      <p className="text-xs font-medium">{nextStep}</p>
      {campaign.tokenId ? (
        <a
          className="block font-mono text-xs text-primary underline-offset-4 hover:underline"
          href={hashscanTokenUrl(campaign.tokenId)}
          target="_blank"
          rel="noreferrer"
        >
          {campaign.tokenId}
        </a>
      ) : (
        <p className="font-mono text-xs text-muted-foreground">No token id yet</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={Boolean(busy) || !canIssue}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "issue" })}
        >
          {busy === "issue" ? "Issuing…" : "Issue token"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy) || !canTransfer}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "transfer" })}
        >
          {busy === "transfer" ? "Transferring…" : "Transfer share"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy) || !canFreeze}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "freeze" })}
        >
          {busy === "freeze" ? "Freezing…" : "Freeze / pause"}
        </Button>
      </div>
      {!operatorConfigured ? (
        <p className="text-xs text-muted-foreground">
          Set HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY (or the
          HEDERA_AGENT_* pair) to issue on testnet.
        </p>
      ) : null}
      {!backerAccountId ? (
        <p className="text-xs text-muted-foreground">
          Set HEDERA_BACKER_ACCOUNT_ID to airdrop one share, then freeze that account.
          Without it, Freeze pauses the whole token instead.
        </p>
      ) : null}
      <div className="space-y-1">
        <TxLink id={campaign.issueTxId} label="Issue tx" />
        <TxLink id={campaign.transferTxId} label="Transfer tx" />
        <TxLink id={campaign.freezeTxId} label="Freeze / pause tx" />
        <TxLink id={campaign.payoutTxId} label="Coupon payout tx" />
      </div>
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="text-sm font-medium">Payout policy (2 of 2)</h3>
        <p className="text-xs text-muted-foreground">
          Founder 1 is the Privy wallet. Founder 2 is the Hedera treasury operator.
          Both must approve before a coupon can leave the campaign.
        </p>
        <p className="text-xs text-muted-foreground">
          Founder: {approvals.founderWallet ? shortAddress(approvals.founderWallet) : "pending"}{" "}
          · Operator: {approvals.operator ? "signed" : "pending"}
        </p>
        <PayoutButtons
          slug={slug}
          busy={busy}
          canApprove={canApprove}
          payoutReady={canRelease}
          onFounder={(wallet) =>
            post(`/api/campaigns/${slug}/payout`, {
              action: "approve-founder",
              wallet,
            })
          }
          onOperator={() =>
            post(`/api/campaigns/${slug}/payout`, { action: "approve-operator" })
          }
          onRelease={() => post(`/api/campaigns/${slug}/payout`, { action: "release" })}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function PayoutButtons({
  slug,
  busy,
  canApprove,
  payoutReady,
  onFounder,
  onOperator,
  onRelease,
}: {
  slug: string;
  busy: string | null;
  canApprove: boolean;
  payoutReady: boolean;
  onFounder: (wallet: string) => void;
  onOperator: () => void;
  onRelease: () => void;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled>
          Log in to approve as founder
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy) || !canApprove}
          onClick={onOperator}
        >
          {busy === "approve-operator" ? "Signing…" : "Co-sign as treasury"}
        </Button>
        <Button size="sm" disabled>
          Release coupon
        </Button>
      </div>
    );
  }
  return (
    <PayoutButtonsAuthed
      slug={slug}
      busy={busy}
      canApprove={canApprove}
      payoutReady={payoutReady}
      onFounder={onFounder}
      onOperator={onOperator}
      onRelease={onRelease}
    />
  );
}

function PayoutButtonsAuthed({
  busy,
  canApprove,
  payoutReady,
  onFounder,
  onOperator,
  onRelease,
}: {
  slug: string;
  busy: string | null;
  canApprove: boolean;
  payoutReady: boolean;
  onFounder: (wallet: string) => void;
  onOperator: () => void;
  onRelease: () => void;
}) {
  const privy = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0]?.address;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={Boolean(busy) || !wallet || !canApprove}
        onClick={() => {
          if (!privy.authenticated) {
            privy.login();
            return;
          }
          if (wallet) onFounder(wallet);
        }}
      >
        {busy === "approve-founder" ? "Signing…" : "Approve as founder"}
      </Button>
      <Button size="sm" variant="outline" disabled={Boolean(busy) || !canApprove} onClick={onOperator}>
        {busy === "approve-operator" ? "Signing…" : "Co-sign as treasury"}
      </Button>
      <Button size="sm" disabled={Boolean(busy) || !payoutReady} onClick={onRelease}>
        {busy === "release" ? "Paying…" : "Release coupon"}
      </Button>
    </div>
  );
}
