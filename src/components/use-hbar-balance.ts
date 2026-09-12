"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, type Hex } from "viem";
import { hederaTestnet } from "@/lib/hedera";

export function useHbarBalance(address: string | undefined, refreshKey = 0) {
  const [wei, setWei] = useState<bigint | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!address) {
      setWei(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    setReady(false);

    const client = createPublicClient({
      chain: hederaTestnet,
      transport: http(hederaTestnet.rpcUrls.default.http[0]),
    });

    client
      .getBalance({ address: address as Hex })
      .then((value) => {
        if (!cancelled) {
          setWei(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWei(BigInt(0));
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  return {
    wei,
    empty: ready && wei === BigInt(0),
    ready,
  };
}
