"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign, TokenLifecycle } from "@/lib/campaigns";
import { hashscanAccountUrl, hashscanContractUrl, hashscanTxUrl } from "@/lib/hedera";
import { HashScanAccount } from "@/components/hashscan-account";
import { shortAddress } from "@/lib/money";

type Snapshot = {
  campaign: Campaign;
  approvals: { founderWallet: string | null; operator: boolean };
  payoutReady: boolean;
  operatorConfigured: boolean;
  backerAccountId: string | null;
  suggestedBacker: {
    wallet: string;
    accountId: string | null;
    txHash: string | null;
  } | null;
};

const LIFECYCLE_LABEL: Record<TokenLifecycle, string> = {
  draft: "Draft",
  issued: "Issued",
  transferred: "Transferred",
  frozen: "Paused",
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
  const [backerDraft, setBackerDraft] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/campaigns/${slug}`);
    const json = (await response.json()) as Snapshot & { error?: string };
    if (!response.ok) throw new Error(json.error ?? "Failed to load campaign");
    setData(json);
    if (json.backerAccountId) setBackerDraft(json.backerAccountId);
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
    return <p className="text-sm text-muted-foreground">Loading ATS bond…</p>;
  }

  const { campaign, approvals, payoutReady, operatorConfigured, backerAccountId, suggestedBacker } = data;
  const lifecycle = campaign.tokenLifecycle;
  const canIssue = lifecycle === "draft" && operatorConfigured;
  const canTransfer = lifecycle === "issued" && Boolean(backerAccountId);
  const canFreeze =
    lifecycle === "transferred" || (lifecycle === "issued" && !backerAccountId);
  const canApprove = lifecycle === "transferred" || lifecycle === "frozen";
  const canRelease = payoutReady && lifecycle === "frozen";
  const nextStep =
    lifecycle === "draft"
      ? "Next: issue the ATS bond."
      : lifecycle === "issued" && backerAccountId
        ? "Next: mint one share to the backer."
        : lifecycle === "issued"
          ? "Next: pause the bond, or save a backer 0x / 0.0.x to mint first."
          : lifecycle === "transferred"
            ? "Next: pause the bond (compliance control)."
            : lifecycle === "frozen"
              ? "Next: both founders sign, then release the coupon."
              : "Coupon paid.";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium">ATS bond</h2>
        <Badge variant="secondary">{LIFECYCLE_LABEL[lifecycle]}</Badge>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {campaign.tokenName} ({campaign.tokenSymbol}) is an Asset Tokenization Studio
        bond (ERC-1400/3643 diamond) with a whitelist and pause — not a meme ticker.
      </p>
      <p className="text-xs font-medium">{nextStep}</p>
      <HashScanAccount evm={campaign.treasuryEvm} />
      {campaign.tokenId ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Bond contract</p>
          <a
            className="block break-all font-mono text-xs text-primary underline-offset-4 hover:underline"
            href={hashscanContractUrl(campaign.tokenId)}
            target="_blank"
            rel="noreferrer"
          >
            {campaign.tokenId}
          </a>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No bond contract yet — Issue bond to get a HashScan id.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="backer-account">Backer address</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="backer-account"
            value={backerDraft}
            onChange={(event) => setBackerDraft(event.target.value)}
            placeholder="0x… or 0.0.12345"
            className="min-w-48 flex-1 font-mono"
            disabled={lifecycle !== "draft" && lifecycle !== "issued"}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={
              Boolean(busy) ||
              (lifecycle !== "draft" && lifecycle !== "issued")
            }
            onClick={() =>
              post(`/api/campaigns/${slug}/token`, {
                action: "set-backer",
                accountId: backerDraft,
              })
            }
          >
            {busy === "set-backer" ? "Saving…" : "Save backer"}
          </Button>
        </div>
        {suggestedBacker ? (
          <p className="text-xs text-muted-foreground">
            Latest Privy pledger {shortAddress(suggestedBacker.wallet)}
            {suggestedBacker.accountId
              ? ` maps to ${suggestedBacker.accountId}`
              : " — mint goes to this 0x address"}
            .
            {(suggestedBacker.accountId && suggestedBacker.accountId !== backerAccountId) ||
            suggestedBacker.wallet.toLowerCase() !== (backerAccountId ?? "").toLowerCase() ? (
              <>
                {" "}
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  disabled={
                    Boolean(busy) ||
                    (lifecycle !== "draft" && lifecycle !== "issued")
                  }
                  onClick={() => {
                    const accountId = suggestedBacker.accountId ?? suggestedBacker.wallet;
                    if (!accountId) return;
                    setBackerDraft(accountId);
                    post(`/api/campaigns/${slug}/token`, {
                      action: "set-backer",
                      accountId,
                    }).catch(() => undefined);
                  }}
                >
                  Use this address
                </button>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Mint one share here, then pause the bond. After a Privy pledge, this desk
            can use that wallet directly — no Hedera 0.0.x mapping required. Env
            HEDERA_BACKER_ACCOUNT_ID still works as a fallback.
          </p>
        )}
        {backerAccountId ? (
          <a
            className="inline-block font-mono text-xs text-primary underline-offset-4 hover:underline"
            href={hashscanAccountUrl(backerAccountId)}
            target="_blank"
            rel="noreferrer"
          >
            {backerAccountId} on HashScan
          </a>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={Boolean(busy) || !canIssue}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "issue" })}
        >
          {busy === "issue" ? "Issuing…" : "Issue bond"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy) || !canTransfer}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "transfer" })}
        >
          {busy === "transfer" ? "Minting…" : "Mint share"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(busy) || !canFreeze}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "freeze" })}
        >
          {busy === "freeze" ? "Pausing…" : "Pause / control list"}
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
          Without a backer address, Pause still pauses the whole bond.
        </p>
      ) : null}
      <div className="space-y-1">
        <TxLink id={campaign.issueTxId} label="Issue tx" />
        <TxLink id={campaign.transferTxId} label="Mint tx" />
        <TxLink id={campaign.freezeTxId} label="Pause tx" />
        <TxLink id={campaign.couponTxId} label="Coupon record tx" />
        <TxLink id={campaign.payoutTxId} label="Coupon HBAR tx" />
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
        {lifecycle === "paid" ? (
          <p className="text-xs text-muted-foreground">
            Coupon already released. HashScan links for the record and the HBAR
            transfer are above.
          </p>
        ) : (
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
        )}
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
