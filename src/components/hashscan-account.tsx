"use client";

import { useEffect, useState } from "react";
import { hashscanAccountUrl, hederaAccountFromEvm } from "@/lib/hedera";

export function HashScanAccount({
  evm,
  label = "Campaign treasury",
}: {
  evm: string;
  label?: string;
}) {
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hederaAccountFromEvm(evm)
      .then((id) => {
        if (!cancelled) setAccountId(id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [evm]);

  const explorerId = accountId ?? evm;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {accountId ? (
        <a
          className="block font-mono text-xs text-primary underline-offset-4 hover:underline"
          href={hashscanAccountUrl(accountId)}
          target="_blank"
          rel="noreferrer"
        >
          {accountId}
        </a>
      ) : null}
      <a
        className="block break-all font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        href={hashscanAccountUrl(explorerId)}
        target="_blank"
        rel="noreferrer"
      >
        {evm}
      </a>
    </div>
  );
}
