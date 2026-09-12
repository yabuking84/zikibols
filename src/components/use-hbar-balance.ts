"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, type Hex } from "viem";
import { hederaTestnet } from "@/lib/hedera";

const MIRROR = "https://testnet.mirrornode.hedera.com/api/v1/accounts/";
const WEI_PER_TINYBAR = BigInt("10000000000");

async function tinybarsFromMirror(address: string, signal: AbortSignal) {
  const response = await fetch(`${MIRROR}${address.toLowerCase()}`, {
    cache: "no-store",
    signal,
  });
  if (response.status === 404) return 0;
  if (!response.ok) throw new Error(`mirror ${response.status}`);
  const json = (await response.json()) as { balance?: { balance?: number } };
  return typeof json.balance?.balance === "number" ? json.balance.balance : 0;
}

async function tinybarsFromHashio(address: string) {
  const client = createPublicClient({
    chain: hederaTestnet,
    transport: http(hederaTestnet.rpcUrls.default.http[0], { timeout: 8_000 }),
  });
  const wei = await client.getBalance({ address: address as Hex });
  return Number(wei / WEI_PER_TINYBAR);
}

/**
 * Hedera testnet HBAR for a Privy 0x address. A wallet that has never received
 * HBAR has no Hedera account yet (mirror 404) — that is empty, not "unknown".
 */
export function useHbarBalance(address: string | undefined, refreshKey = 0) {
  const [tinybars, setTinybars] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!address) {
      setTinybars(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8_000);
    setReady(false);

    (async () => {
      try {
        let value: number;
        try {
          value = await tinybarsFromMirror(address, controller.signal);
        } catch {
          value = await tinybarsFromHashio(address);
        }
        if (!cancelled) {
          setTinybars(value);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setTinybars(0);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [address, refreshKey]);

  return {
    tinybars,
    empty: ready && tinybars === 0,
    ready,
  };
}
