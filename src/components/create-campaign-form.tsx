"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssetClass } from "@/lib/campaigns";

const ASSET_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: "invoice-receivable", label: "Invoice receivable bond" },
  { value: "revenue-share", label: "Harvest revenue share" },
];

export function CreateCampaignForm() {
  const router = useRouter();
  const [assetClass, setAssetClass] = useState<AssetClass>("invoice-receivable");
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorWallet, setCreatorWallet] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [location, setLocation] = useState("");
  const [goalHbar, setGoalHbar] = useState("5000");
  const [daysLeft, setDaysLeft] = useState("21");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [blurb, setBlurb] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          creatorName,
          creatorWallet,
          creatorEmail: creatorEmail.trim() || null,
          location,
          goalHbar: Number(goalHbar),
          daysLeft: Number(daysLeft),
          tokenName,
          tokenSymbol,
          blurb,
          story,
          assetClass,
        }),
      });
      const json = (await response.json()) as {
        error?: string;
        campaign?: { slug: string };
      };
      if (!response.ok) throw new Error(json.error ?? "Could not create campaign");
      if (!json.campaign) throw new Error("Campaign was not returned");
      router.push(`/campaigns/${json.campaign.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create campaign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>Asset class</Label>
        <div className="flex flex-wrap gap-2">
          {ASSET_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={assetClass === option.value ? "default" : "outline"}
              onClick={() => setAssetClass(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="campaign-title">Title</Label>
          <Input
            id="campaign-title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Harbor Credit — invoice bond"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-creator">Creator name</Label>
          <Input
            id="campaign-creator"
            required
            value={creatorName}
            onChange={(event) => setCreatorName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-wallet">Creator wallet (Ethereum)</Label>
          <Input
            id="campaign-wallet"
            required
            value={creatorWallet}
            onChange={(event) => setCreatorWallet(event.target.value)}
            placeholder="0x…"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-email">Public creator email (optional)</Label>
          <Input
            id="campaign-email"
            type="email"
            value={creatorEmail}
            onChange={(event) => setCreatorEmail(event.target.value)}
            placeholder="desk@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-location">Location</Label>
          <Input
            id="campaign-location"
            required
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-goal">Goal (HBAR)</Label>
          <Input
            id="campaign-goal"
            required
            inputMode="decimal"
            value={goalHbar}
            onChange={(event) => setGoalHbar(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-days">Days left</Label>
          <Input
            id="campaign-days"
            required
            inputMode="numeric"
            value={daysLeft}
            onChange={(event) => setDaysLeft(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-token-name">Token name</Label>
          <Input
            id="campaign-token-name"
            required
            value={tokenName}
            onChange={(event) => setTokenName(event.target.value)}
            placeholder="Harbor Invoice Bond 2026-Q3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-token-symbol">Token symbol</Label>
          <Input
            id="campaign-token-symbol"
            required
            value={tokenSymbol}
            onChange={(event) => setTokenSymbol(event.target.value)}
            placeholder="HIB26"
            className="font-mono uppercase"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-blurb">Blurb</Label>
        <Textarea
          id="campaign-blurb"
          required
          value={blurb}
          onChange={(event) => setBlurb(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="campaign-story">Story</Label>
        <Textarea
          id="campaign-story"
          required
          value={story}
          onChange={(event) => setStory(event.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        The creator wallet is the Ethereum address The Graph looks up on Aave v3,
        Compound v3, and Spark Lend. Optional email is a public search query for the
        paid founder profile — not a mailbox to scrape. The raise still settles in
        HBAR on Hedera testnet.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create campaign"}
      </Button>
    </form>
  );
}
