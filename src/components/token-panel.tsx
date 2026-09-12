"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign, TokenLifecycle } from "@/lib/campaigns";
import type { CampaignSettlement } from "@/lib/types";
import type { MintHolder } from "@/lib/mints";
import type { SettlementQuote } from "@/lib/settlement";
import { hashscanContractUrl, hashscanTxUrl } from "@/lib/hedera";
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
    if (action === "unpause") {
      return "Unpause bond timed out waiting on Hedera. Refresh the desk and check HashScan before clicking Unpause again.";
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
  const [pauseBlocked, setPauseBlocked] = useState(false);
  const [needIssue, setNeedIssue] = useState(false);

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

  const { campaign, operatorConfigured, settlement, holders } = data;
  const lifecycle = campaign.tokenLifecycle;
  const mintedCount = holders.filter((holder) => holder.mint).length;
  const pendingCount = holders.filter((holder) => !holder.mint).length;
  const canIssue = lifecycle === "draft" && operatorConfigured;
  const issued = Boolean(campaign.tokenId) && (lifecycle === "issued" || lifecycle === "transferred");
  const mintClosed = lifecycle === "frozen" || lifecycle === "paid";
  const canFreeze = lifecycle === "issued" || lifecycle === "transferred";
  const settled = Boolean(settlement.paid.founder || settlement.paid.backers);
  const canUnpause = lifecycle === "frozen" && !settled && operatorConfigured;
  const unmintedPledgers = settlement.quote.backers.filter(
    (backer) => !backer.minted && backer.pledgedTinybars > 0,
  );
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
              ? settled
                ? "Next: pay the founder and backers from the treasury."
                : "Next: pay the founder and backers from the treasury, or unpause to reopen the raise."
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
          loading={busy === "issue"}
          disabled={Boolean(busy) || !canIssue}
          onClick={() => post(`/api/campaigns/${slug}/token`, { action: "issue" })}
        >
          {busy === "issue" ? "Issuing…" : "Issue bond"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          loading={busy === "freeze"}
          disabled={Boolean(busy) || !canFreeze}
          onClick={() =>
            unmintedPledgers.length > 0
              ? setPauseBlocked(true)
              : post(`/api/campaigns/${slug}/token`, { action: "freeze" })
          }
        >
          {busy === "freeze" ? "Pausing…" : "Pause bond"}
        </Button>
        {lifecycle === "frozen" ? (
          <Button
            size="sm"
            variant="outline"
            loading={busy === "unpause"}
            disabled={Boolean(busy) || !canUnpause}
            onClick={() => post(`/api/campaigns/${slug}/token`, { action: "unpause" })}
          >
            {busy === "unpause" ? "Unpausing…" : "Unpause bond"}
          </Button>
        ) : null}
      </div>
      {canFreeze && unmintedPledgers.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Pause waits until every pledger holds a share. Mint the remaining{" "}
          {unmintedPledgers.length} first — pause closes minting.
        </p>
      ) : null}
      {lifecycle === "frozen" ? (
        <p className="text-xs text-muted-foreground">
          {settled
            ? "This raise is settled, so the bond stays paused. Unpausing would reopen it to pledges that no payout covers."
            : "Unpause lifts the compliance stamp: transfers resume, minting reopens, and the listing takes new pledges again. Settlement waits until it is paused."}
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Mint shares</h3>
          <Badge variant="secondary">
            {mintedCount}/{holders.length || 0} minted
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          One ATS unit per unique pledger of this same bond. Each mint takes 30–60
          seconds.
        </p>
        {!issued ? (
          <p className="text-xs text-muted-foreground">
            Issue the bond first. There is no contract to mint against until then.
          </p>
        ) : null}
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
                      loading={rowBusy}
                      disabled={Boolean(busy) || mintClosed || !target}
                      onClick={() => {
                        if (!issued) {
                          setNeedIssue(true);
                          return;
                        }
                        post(
                          `/api/campaigns/${slug}/token`,
                          {
                            action: "transfer",
                            accountId: target,
                            wallet: holder.wallet,
                          },
                          `transfer:${target}`,
                        );
                      }}
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
              disabled={mintClosed}
            />
            <Button
              size="sm"
              variant="outline"
              loading={busy === `transfer:${backerDraft.trim()}`}
              disabled={Boolean(busy) || mintClosed || !backerDraft.trim()}
              onClick={() => {
                if (!issued) {
                  setNeedIssue(true);
                  return;
                }
                post(
                  `/api/campaigns/${slug}/token`,
                  {
                    action: "transfer",
                    accountId: backerDraft.trim(),
                    wallet: backerDraft.trim(),
                  },
                  `transfer:${backerDraft.trim()}`,
                );
              }}
            >
              {busy?.startsWith("transfer:") && busy === `transfer:${backerDraft.trim()}`
                ? "Minting…"
                : "Mint share"}
            </Button>
          </div>
        </div>
      </div>
      {busy === "issue" ||
      busy?.startsWith("transfer:") ||
      busy === "freeze" ||
      busy === "unpause" ? (
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
        <TxLink id={campaign.unpauseTxId ?? null} label="Unpause tx" />
        <TxLink id={campaign.couponTxId} label="Coupon record tx" />
        <TxLink id={campaign.payoutTxId} label="Coupon HBAR tx" />
      </div>
      <SettlementSection
        slug={slug}
        creatorWallet={campaign.creatorWallet}
        settlement={settlement}
        paused={lifecycle === "frozen" || lifecycle === "paid"}
        busy={busy}
        onPay={post}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {needIssue ? <IssueFirstDialog onClose={() => setNeedIssue(false)} /> : null}
      {pauseBlocked ? (
        <UnmintedBackersDialog
          purpose="pause"
          backers={unmintedPledgers}
          total={settlement.quote.backers.length}
          onClose={() => setPauseBlocked(false)}
        />
      ) : null}
    </div>
  );
}

function SettlementSection({
  slug,
  creatorWallet,
  settlement,
  paused,
  busy,
  onPay,
}: {
  slug: string;
  creatorWallet: string;
  settlement: { quote: SettlementQuote; paid: CampaignSettlement };
  paused: boolean;
  busy: string | null;
  onPay: (path: string, body: Record<string, string>) => Promise<void>;
}) {
  const [blocked, setBlocked] = useState(false);
  const [needsPause, setNeedsPause] = useState(false);
  const { quote, paid } = settlement;
  const path = `/api/campaigns/${slug}/payout`;
  const unminted = quote.backers.filter(
    (backer) => !backer.minted && backer.pledgedTinybars > 0,
  );
  const mintedCount = quote.backers.length - unminted.length;

  function tryPay(action: "release-founder" | "release-backers") {
    if (!paused) {
      setNeedsPause(true);
      return;
    }
    if (action === "release-backers" && unminted.length > 0) {
      setBlocked(true);
      return;
    }
    onPay(path, { action });
  }

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
            {quote.backers.length === 1 ? "backer" : "backers"} ({mintedCount} of{" "}
            {quote.backers.length} hold a share) · founder{" "}
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
              loading={busy === "release-founder"}
              disabled={Boolean(busy) || Boolean(paid.founder)}
              onClick={() => tryPay("release-founder")}
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
              loading={busy === "release-backers"}
              disabled={Boolean(busy) || Boolean(paid.backers)}
              onClick={() => tryPay("release-backers")}
            >
              {busy === "release-backers"
                ? "Paying…"
                : paid.backers
                  ? "Backers paid"
                  : `Pay backers ${hbarTinybars(quote.poolTinybars)}`}
            </Button>
          </div>
          {!paused ? (
            <p className="text-xs text-muted-foreground">
              Pause the bond before paying the founder or backers. Pause closes minting
              and new pledges.
            </p>
          ) : unminted.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Only backers holding a share are paid. Mint the remaining{" "}
              {unminted.length} before Pay backers can run.
            </p>
          ) : null}
          <div className="space-y-1">
            <TxLink id={paid.founder?.txId ?? null} label="Founder payout tx" />
            <TxLink id={paid.backers?.txId ?? null} label="Backer payout tx" />
          </div>
          {needsPause ? (
            <PauseFirstDialog onClose={() => setNeedsPause(false)} />
          ) : null}
          {blocked ? (
            <UnmintedBackersDialog
              purpose="payout"
              backers={unminted}
              total={quote.backers.length}
              onClose={() => setBlocked(false)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function IssueFirstDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-first-title"
        className="relative z-10 w-full max-w-lg rounded-xl border bg-popover p-5 shadow-lg"
      >
        <h4 id="issue-first-title" className="text-sm font-medium">
          Issue the bond first
        </h4>
        <p className="mt-2 text-xs text-muted-foreground">
          Mint hands out a unit of this campaign’s ATS bond. There is no contract until
          you click Issue bond. Issue once, then mint a share to each pledger.
        </p>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PauseFirstDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-first-title"
        className="relative z-10 w-full max-w-lg rounded-xl border bg-popover p-5 shadow-lg"
      >
        <h4 id="pause-first-title" className="text-sm font-medium">
          Pause the campaign first
        </h4>
        <p className="mt-2 text-xs text-muted-foreground">
          Pay founder and Pay backers run after the bond is paused. Pause closes minting
          and stops new pledges, so the raise is locked before HBAR leaves the treasury.
          Mint every backer, click Pause bond, then settle.
        </p>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Hard stop: pause and Pay backers both wait until every pledger holds a share. */
function UnmintedBackersDialog({
  purpose,
  backers,
  total,
  onClose,
}: {
  purpose: "pause" | "payout";
  backers: SettlementQuote["backers"];
  total: number;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unminted-title"
        className="relative z-10 w-full max-w-lg rounded-xl border bg-popover p-5 shadow-lg"
      >
        <h4 id="unminted-title" className="text-sm font-medium">
          Not all backers have been issued a share
        </h4>
        <p className="mt-2 text-xs text-muted-foreground">
          {purpose === "pause"
            ? `Pause closes minting and stops new pledges. These ${backers.length} of ${total} pledged but have no share yet. Mint a share to each of them, then pause.`
            : `The backer pool is paid to wallets that hold a share of this bond. These ${backers.length} of ${total} pledged but have no share yet, so nothing has been paid out. Mint a share to each of them above, then run Pay backers again.`}
        </p>
        <ul className="mt-3 max-h-56 space-y-2 overflow-auto">
          {backers.map((backer) => (
            <li
              key={backer.wallet}
              className="rounded-lg border border-border px-3 py-2"
            >
              <p className="font-mono text-xs">{shortAddress(backer.wallet)}</p>
              <p className="text-xs text-muted-foreground">
                Pledged {hbarTinybars(backer.pledgedTinybars)}
                {backer.hederaAccountId ? ` · ${backer.hederaAccountId}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
