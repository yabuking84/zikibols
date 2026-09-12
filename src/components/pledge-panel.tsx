"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  parseEther,
  type Hex,
} from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Campaign } from "@/lib/campaigns";
import type { Pledge } from "@/lib/types";
import { hbar, shortAddress } from "@/lib/money";
import {
  HEDERA_FAUCET_URL,
  hederaTestnet,
  hashscanAccountUrl,
  hashscanTxUrl,
} from "@/lib/hedera";
import { HashScanAccount } from "@/components/hashscan-account";
import { useHbarBalance } from "@/components/use-hbar-balance";

const PRESETS = [10, 50, 100];

export function PledgePanel({
  campaign,
  diligenceDone = true,
  refreshKey = 0,
  onSkip,
  onPledged,
}: {
  campaign: Campaign;
  diligenceDone?: boolean;
  refreshKey?: number;
  onSkip?: () => void;
  onPledged?: () => void;
}) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <div className="space-y-2">
        <h2 className="text-base font-medium">Pledge</h2>
        <p className="text-sm text-muted-foreground">
          Add NEXT_PUBLIC_PRIVY_APP_ID so backers can log in and send HBAR from an
          embedded wallet.
        </p>
      </div>
    );
  }

  return (
    <PledgeForm
      campaign={campaign}
      diligenceDone={diligenceDone}
      refreshKey={refreshKey}
      onSkip={onSkip}
      onPledged={onPledged}
    />
  );
}

function PledgeForm({
  campaign,
  diligenceDone,
  refreshKey,
  onSkip,
  onPledged,
}: {
  campaign: Campaign;
  diligenceDone: boolean;
  refreshKey: number;
  onSkip?: () => void;
  onPledged?: () => void;
}) {
  const privy = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("50");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<Pledge[]>([]);

  const wallet = wallets[0];
  const { empty: walletEmpty, ready: balanceReady } = useHbarBalance(
    wallet?.address,
    refreshKey,
  );
  const treasury = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_CAMPAIGN_TREASURY as Hex | undefined) ??
      campaign.treasuryEvm,
    [campaign.treasuryEvm],
  );
  const mineTotal = mine.reduce((sum, pledge) => sum + pledge.amountHbar, 0);
  const closed =
    campaign.tokenLifecycle === "frozen" || campaign.tokenLifecycle === "paid";

  useEffect(() => {
    if (!wallet?.address) {
      setMine([]);
      return;
    }
    const address = wallet.address.toLowerCase();
    fetch(`/api/pledges?campaign=${campaign.slug}`)
      .then((response) => response.json())
      .then((json: { pledges?: Pledge[] }) => {
        setMine(
          (json.pledges ?? []).filter(
            (pledge) => pledge.wallet.toLowerCase() === address,
          ),
        );
      })
      .catch(() => setMine([]));
  }, [campaign.slug, wallet?.address, refreshKey]);

  async function pledge() {
    if (closed) {
      setStatus("This campaign is paused and is not accepting new pledges.");
      return;
    }
    if (!privy.authenticated) {
      privy.login();
      return;
    }
    if (!wallet) {
      setStatus("No Privy wallet yet. Log in again so an embedded wallet can be created.");
      return;
    }
    if (walletEmpty) {
      setStatus("Your wallet is empty. Fund it with Hedera testnet HBAR, then pledge.");
      return;
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setStatus("Enter a positive HBAR amount.");
      return;
    }

    setBusy(true);
    setStatus("Sending pledge from your Privy wallet on Hedera testnet…");
    try {
      await wallet.switchChain(hederaTestnet.id);
      const provider = await wallet.getEthereumProvider();
      const client = createWalletClient({
        account: wallet.address as Hex,
        chain: hederaTestnet,
        transport: custom(provider),
      });
      const hash = await client.sendTransaction({
        to: treasury,
        value: parseEther(String(value)),
        chain: hederaTestnet,
      });
      setTxHash(hash);
      const recorded = await fetch("/api/pledges", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          wallet: wallet.address,
          amountHbar: value,
          txHash: hash,
        }),
      });
      if (!recorded.ok) {
        setStatus("On-chain pledge sent, but the campaign book could not be updated.");
      } else {
        setStatus("Pledge sent. This is a real Hedera transfer from your Privy wallet.");
      }
      onPledged?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pledge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium">Pledge</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {closed
            ? "This campaign is paused. New pledges are closed — the raise is locked for settlement."
            : "Log in with Privy, then send HBAR from the embedded wallet to the campaign treasury."}
        </p>
        <div className="mt-2">
          <HashScanAccount evm={treasury} />
        </div>
      </div>
      {closed ? (
        <p className="text-sm text-muted-foreground">
          The operator paused the bond. Existing pledges still count; this listing is not
          taking new backers.
        </p>
      ) : !diligenceDone ? (
        <p className="text-sm text-muted-foreground">
          Run due diligence first. The agent should check this creator on-chain before you
          pledge.
        </p>
      ) : null}
      {privy.authenticated && wallet?.address && !balanceReady ? (
        <p className="text-sm text-muted-foreground">Checking HBAR balance…</p>
      ) : null}
      {privy.authenticated && walletEmpty ? (
        <div
          role="status"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p className="font-medium">Your wallet is empty (0 ℏ).</p>
          <p className="mt-1 text-destructive/90">
            This Privy address has no Hedera testnet HBAR yet (or no Hedera account). Copy
            your address in the header, then fund it from the faucet.
          </p>
          <a
            className="mt-2 inline-block font-medium underline-offset-4 hover:underline"
            href={HEDERA_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Hedera faucet
          </a>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={amount === String(preset) ? "default" : "outline"}
            disabled={closed}
            onClick={() => setAmount(String(preset))}
          >
            {preset} ℏ
          </Button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pledge-amount">Amount (HBAR)</Label>
        <Input
          id="pledge-amount"
          inputMode="decimal"
          value={amount}
          disabled={closed}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
      <Button
        className="w-full"
        onClick={pledge}
        loading={busy}
        disabled={
          busy ||
          closed ||
          !diligenceDone ||
          walletEmpty ||
          Boolean(privy.authenticated && wallet && !balanceReady)
        }
      >
        {busy
          ? "Pledging…"
          : closed
            ? "Campaign is paused"
            : !diligenceDone
              ? "Check the creator first"
              : walletEmpty
                ? "Wallet is empty"
                : privy.authenticated
                  ? "Pledge with Privy wallet"
                  : "Log in to pledge"}
      </Button>
      {!closed && !diligenceDone && onSkip ? (
        <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
          Pledge anyway
        </Button>
      ) : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {txHash ? (
        <a
          className="inline-block text-sm text-primary underline-offset-4 hover:underline"
          href={hashscanTxUrl(txHash)}
          target="_blank"
          rel="noreferrer"
        >
          View pledge on HashScan
        </a>
      ) : null}
      {mine.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          <p className="font-medium">Your pledges</p>
          <p className="text-muted-foreground">
            {mine.length} from {shortAddress(wallet?.address ?? "")} · {hbar(mineTotal)}
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {mine.slice(0, 4).map((pledge) => (
              <li key={pledge.id} className="flex flex-wrap gap-x-3 gap-y-1">
                <span>{hbar(pledge.amountHbar)}</span>
                {pledge.hederaAccountId ? (
                  <a
                    className="font-mono text-primary underline-offset-4 hover:underline"
                    href={hashscanAccountUrl(pledge.hederaAccountId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {pledge.hederaAccountId}
                  </a>
                ) : null}
                {pledge.txHash ? (
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={hashscanTxUrl(pledge.txHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    HashScan
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
