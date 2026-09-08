"use client";

import { useEffect, useState } from "react";
import type { IntegrationStatus as Status } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LABELS: { key: keyof Status; label: string; hint: string }[] = [
  { key: "privy", label: "Privy", hint: "Login and embedded wallet pledges" },
  { key: "graph", label: "The Graph", hint: "Live Aave v3 + Compound v3 + Spark" },
  { key: "search", label: "Founder search", hint: "Public web name + email, sold over x402" },
  { key: "x402", label: "Hedera x402", hint: "Agent pays per query and per risk note" },
  { key: "hts", label: "Hedera ATS", hint: "Issue bond, mint, pause, coupon" },
];

export function IntegrationStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((json: { integrations: Status }) => setStatus(json.integrations))
      .catch(() => setStatus(null));
  }, []);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {LABELS.map((item) => {
        const live = status?.[item.key];
        return (
          <Card key={item.key} size="sm">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-base">
                {status ? (live ? "Ready" : "Needs env") : "Checking…"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{item.hint}</p>
              <Badge variant={live ? "default" : "secondary"}>
                {live ? "Live" : "Setup"}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
