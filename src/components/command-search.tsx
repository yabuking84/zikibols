"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { campaigns } from "@/lib/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pages = [
      { href: "/", title: "Dashboard", hint: "Overview and live campaigns" },
      ...campaigns.map((campaign) => ({
        href: `/campaigns/${campaign.slug}`,
        title: campaign.title,
        hint: `${campaign.tokenSymbol} · ${campaign.location}`,
      })),
    ];
    if (!needle) return pages;
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(needle) ||
        page.hint.toLowerCase().includes(needle),
    );
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden text-muted-foreground sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search />
        Search
        <kbd className="pointer-events-none ml-2 hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          ⌘K
        </kbd>
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close search"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-[15vh] w-full max-w-lg rounded-xl border bg-popover p-2 shadow-lg">
            <Input
              autoFocus
              placeholder="Search campaigns…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && results[0]) go(results[0].href);
              }}
            />
            <ul className="mt-2 max-h-72 overflow-auto">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matches
                </li>
              ) : (
                results.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "block rounded-md px-3 py-2 hover:bg-muted",
                      )}
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
