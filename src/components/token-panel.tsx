"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign, TokenLifecycle } from "@/lib/campaigns";
import type { CampaignSettlement } from "@/lib/types";
import type { MintHolder } from "@/lib/mints";
import type { SettlementQuote } from "@/lib/settlement";
import { hashscanAccountUrl, hashscanContractUrl, hashscanTxUrl } from "@/lib/hedera";
import { HashScanAccount } from "@/components/hashscan-account";
import { hbar, hbarTinybars, shortAddress } from "@/lib/money";

type Snapshot = {
  campaign: Campaign;
  approvals: { founderWallet: string | null; operator: boolean };
  payoutReady: boolean;
  operatorConfigured: boolean;
  settlement: { quote: SettlementQuote; paid: CampaignSettlement };
  backerAccountId: string | null;
  holders: MintHolder[];
};

const LIFECYCLE_LABEL: Record<TokenLifecycle, string> = {
  draft: "Draft",
  issued: "Issued",
  transferred: "Transferred",
  frozen: "Paused",
  paid: "Coupon paid",
};

/** Issue / mint / pause talk to Hedera; 30–60s is normal. Abort so the desk does not spin forever. */
const ATS_WAIT_MS = 70_000;

function isAlreadyOnControlList(message: string) {
  return /already in the control list|20013/i.test(message);
}

function formatAtsError(action: string | undefined, raw: string) {
  if (isAlreadyOnControlList(raw)) {
    if (action === "freeze") {
      return "That wallet is already on the allowed list from mint. Refresh the desk — Pause may still have landed.";
    }
    return "This backer is already on the allowed list. Refresh the desk — their share may have minted, or mint the next pledger.";
  }
  if (/timeout|aborted|abort/i.test(raw)) {
    if (action === "issue") {
      return "Issue bond timed out waiting on Hedera. Refresh the desk and check HashScan before clicking Issue again.";
    }
    if (action === "transfer") {
      return "Mint share timed out waiting on Hedera. Refresh the desk and check HashScan before clicking Mint again.";
    }
    return "Hedera timed out. Refresh the desk — the transaction may still have landed.";
  }
  return raw;
}

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
  }, [slug]);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load");
    });
  }, [refresh]);

  async function post(path: string, body: Record<string, string>, busyKey = body.action) {
    setBusy(busyKey);
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ATS_WAIT_MS);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Request failed");
      setBusy(null);
      await refresh();
    } catch (err) {
      const raw =
        err instanceof DOMException && err.name === "AbortError"
          ? "timeout"
          : err instanceof Error
            ? err.message
            : "Request failed";
      setError(formatAtsError(body.action, raw));
      if (body.action === "issue" || body.action === "transfer") {
        await refresh().catch(() => undefined);
      }
    } finally {
      window.clearTimeout(timer);
      setBusy(null);
    }
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading ATS bond…</p>;
  }

  const {
    campaign,
    approvals,
    payoutReady,
    operatorConfigured,
    settlement,
    backerAccountId,
    holders,
  } = data;
  const lifecycle = campaign.tokenLifecycle;
  const mintedCount = holders.filter((holder) => holder.mint).length;
  const pendingCount = holders.filter((holder) => !holder.mint).length;
  const canIssue = lifecycle === "draft" && operatorConfigured;
  const canMint =
    operatorConfigured && (lifecycle === "issued" || lifecycle === "transferred");
  const canFreeze = lifecycle === "issued" || lifecycle === "transferred";
  const canApprove = lifecycle === "transferred" || lifecycle === "frozen";
  const canRelease = payoutReady && lifecycle === "frozen";
  const nextStep =
    lifecycle === "draft"
      ? "Next: issue the ATS bond."
      : lifecycle === "issued" && holders.length === 0
        ? "Next: wait for a pledge, or mint to an address below."
        : (lifecycle === "issued" || lifecycle === "transferred") && pendingCount > 0
          ? `Next: mint a share to each pledger (${mintedCount} of ${holders.length} done).`
          : lifecycle === "transferred" || lifecycle === "issued"
            ? "Next: pause the bond. Each mint already put that backer on the allowed list."
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
          disabled={Boolean(busy) || !canFreeze}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "freeze" })}
        >
          {busy === "freeze" ? "Pausing…" : "Pause bond"}
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Mint shares</h3>
          <Badge variant="secondary">
            {mintedCount}/{holders.length || 0} minted
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          One ATS unit per unique pledger of this same bond. Each mint takes 30–60
          seconds. The tiny coupon crumb still goes to the first minted address.
        </p>
        {holders.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No live pledges yet. After someone pledges they appear here, or mint to
            another address below.
          </p>
        ) : (
          <ul className="space-y-2">
            {holders.map((holder) => {
              const target = holder.accountId ?? holder.wallet;
              const rowBusy = busy === `transfer:${target}`;
              return (
                <li
                  key={holder.wallet}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-xs">{shortAddress(holder.wallet)}</p>
                    <p className="text-xs text-muted-foreground">
                      {holder.pledgedHbar > 0
                        ? `Pledged ${hbar(holder.pledgedHbar)}`
                        : "Minted without a pledge row"}
                      {holder.accountId ? ` · ${holder.accountId}` : ""}
                    </p>
                    {holder.mint ? (
                      <TxLink id={holder.mint.txId} label="Mint tx" />
                    ) : null}
                  </div>
                  {holder.mint ? (
                    <Badge variant="secondary">Minted</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={Boolean(busy) || !canMint || !target}
                      onClick={() =>
                        post(
                          `/api/campaigns/${slug}/token`,
                          {
                            action: "transfer",
                            accountId: target,
                            wallet: holder.wallet,
                          },
                          `transfer:${target}`,
                        )
                      }
                    >
                      {rowBusy ? "Minting…" : "Mint share"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="backer-account">Mint to another address</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="backer-account"
              value={backerDraft}
              onChange={(event) => setBackerDraft(event.target.value)}
              placeholder="0x… or 0.0.12345"
              className="min-w-48 flex-1 font-mono"
              disabled={!canMint}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(busy) || !canMint || !backerDraft.trim()}
              onClick={() =>
                post(
                  `/api/campaigns/${slug}/token`,
                  {
                    action: "transfer",
                    accountId: backerDraft.trim(),
                    wallet: backerDraft.trim(),
                  },
                  `transfer:${backerDraft.trim()}`,
                )
              }
            >
              {busy?.startsWith("transfer:") && busy === `transfer:${backerDraft.trim()}`
                ? "Minting…"
                : "Mint share"}
            </Button>
          </div>
        </div>
        {backerAccountId ? (
          <p className="text-xs text-muted-foreground">
            Coupon crumb recipient{" "}
            <a
              className="font-mono text-primary underline-offset-4 hover:underline"
              href={hashscanAccountUrl(backerAccountId)}
              target="_blank"
              rel="noreferrer"
            >
              {backerAccountId}
            </a>
          </p>
        ) : null}
      </div>
      {busy === "issue" || busy?.startsWith("transfer:") || busy === "freeze" ? (
        <p className="text-xs text-muted-foreground">
          Waiting on Hedera. Issue and mint often take 30–60 seconds. Do not click
          again — if this fails, the error will show here.
        </p>
      ) : null}
      {!operatorConfigured ? (
        <p className="text-xs text-muted-foreground">
          Set HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY (or the
          HEDERA_AGENT_* pair) to issue on testnet.
        </p>
      ) : null}
      <div className="space-y-1">
        <TxLink id={campaign.issueTxId} label="Issue tx" />
        <TxLink id={campaign.transferTxId} label="Latest mint tx" />
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
      <SettlementSection
        slug={slug}
        creatorWallet={campaign.creatorWallet}
        settlement={settlement}
        approved={payoutReady}
        busy={busy}
        onPay={post}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function SettlementSection({
  slug,
  creatorWallet,
  settlement,
  approved,
  busy,
  onPay,
}: {
  slug: string;
  creatorWallet: string;
  settlement: { quote: SettlementQuote; paid: CampaignSettlement };
  approved: boolean;
  busy: string | null;
  onPay: (path: string, body: Record<string, string>) => Promise<void>;
}) {
  const { quote, paid } = settlement;
  const path = `/api/campaigns/${slug}/payout`;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Settlement</h3>
        {paid.founder && paid.backers ? <Badge variant="secondary">Settled</Badge> : null}
      </div>
      {quote.raiseTinybars === 0 ? (
        <p className="text-xs text-muted-foreground">
          No live pledges yet — nothing to settle. Pledged totals on seed campaigns are
          fixtures and are never paid out.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Raised {hbarTinybars(quote.raiseTinybars)} from {quote.backers.length}{" "}
            {quote.backers.length === 1 ? "backer" : "backers"} · founder{" "}
            {hbarTinybars(quote.founderTinybars)} ({quote.founderPercent}%) · backers{" "}
            {hbarTinybars(quote.poolTinybars)} pro-rata.
          </p>
          <p className="text-xs text-muted-foreground">
            The raise leaves the treasury for {shortAddress(creatorWallet)}, the wallet on
            the listing. If that address has no Hedera account yet, the transfer creates
            one the same Ethereum key controls.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(busy) || !approved || Boolean(paid.founder)}
              onClick={() => onPay(path, { action: "release-founder" })}
            >
              {busy === "release-founder"
                ? "Paying…"
                : paid.founder
                  ? "Founder paid"
                  : `Pay founder ${hbarTinybars(quote.founderTinybars)}`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(busy) || !approved || Boolean(paid.backers)}
              onClick={() => onPay(path, { action: "release-backers" })}
            >
              {busy === "release-backers"
                ? "Paying…"
                : paid.backers
                  ? "Backers paid"
                  : `Pay backers ${hbarTinybars(quote.poolTinybars)}`}
            </Button>
          </div>
          {!approved ? (
            <p className="text-xs text-muted-foreground">
              Both approvals above are required before HBAR can leave the treasury.
            </p>
          ) : null}
          <div className="space-y-1">
            <TxLink id={paid.founder?.txId ?? null} label="Founder payout tx" />
            <TxLink id={paid.backers?.txId ?? null} label="Backer payout tx" />
          </div>
        </>
      )}
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
