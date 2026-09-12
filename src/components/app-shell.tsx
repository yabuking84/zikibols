"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Check,
  Command,
  Copy,
  Landmark,
  LayoutDashboard,
  Menu,
  Plus,
  Wallet,
  Wrench,
} from "lucide-react";
import { CommandSearch } from "@/components/command-search";
import { useCatalog } from "@/components/use-catalog";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { shortAddress } from "@/lib/money";
import { cn } from "cn";

const generalNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const LOGO = {
  src: "/zikibols-logo.jpg",
  width: 784,
  height: 1168,
} as const;

function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src={LOGO.src}
      alt="Zikibols"
      width={LOGO.width}
      height={LOGO.height}
      className={cn("h-9 w-auto rounded-lg object-contain", className)}
      priority
    />
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const campaigns = useCatalog();

  return (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex h-12 items-center gap-2 px-3" onClick={onNavigate}>
        <BrandLogo />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Zikibols</p>
          <p className="text-xs text-muted-foreground">Invest & Relax</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-2">
        <div className="space-y-1">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            General
          </p>
          {generalNav.map((item) => (
            <NavLink
              key={item.label}
              {...item}
              active={pathname === item.href}
              onClick={onNavigate}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            Campaigns
          </p>
          {campaigns.map((campaign) => (
            <NavLink
              key={campaign.slug}
              href={`/campaigns/${campaign.slug}`}
              label={campaign.tokenSymbol}
              icon={Landmark}
              active={pathname === `/campaigns/${campaign.slug}`}
              onClick={onNavigate}
            />
          ))}
          <NavLink
            href="/campaigns/new"
            label="Start a campaign"
            icon={Plus}
            active={pathname === "/campaigns/new"}
            onClick={onNavigate}
          />
        </div>
        <div className="space-y-1">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            Operator desk
          </p>
          {campaigns.map((campaign) => (
            <NavLink
              key={`${campaign.slug}-operate`}
              href={`/campaigns/${campaign.slug}/operate`}
              label={campaign.tokenSymbol}
              icon={Wrench}
              active={pathname === `/campaigns/${campaign.slug}/operate`}
              onClick={onNavigate}
            />
          ))}
        </div>
      </nav>
      <div className="mt-auto space-y-2 border-t border-sidebar-border p-3">
        <p className="px-1 text-xs font-medium text-muted-foreground">
          Sponsors
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-sidebar-accent px-2 py-1 text-xs text-sidebar-accent-foreground">
            <Command className="size-3" />
            The Graph
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sidebar-accent px-2 py-1 text-xs text-sidebar-accent-foreground">
            <Landmark className="size-3" />
            Hedera
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-sidebar-accent px-2 py-1 text-xs text-sidebar-accent-foreground">
            <Wallet className="size-3" />
            Privy
          </span>
        </div>
      </div>
    </div>
  );
}

function AuthControls() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const privy = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);

  const address = wallets[0]?.address;

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  if (!appId) {
    return (
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Set NEXT_PUBLIC_PRIVY_APP_ID
      </span>
    );
  }

  if (!privy.ready) {
    return <span className="text-xs text-muted-foreground">Connecting…</span>;
  }

  if (!privy.authenticated) {
    return (
      <Button size="sm" onClick={() => privy.login()}>
        Log in
      </Button>
    );
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {address ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="max-w-36 font-mono text-xs text-muted-foreground"
          onClick={copyAddress}
          title={copied ? "Copied" : address}
          aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
        >
          {copied ? <Check /> : <Copy />}
          <span className="truncate">{copied ? "Copied" : shortAddress(address)}</span>
        </Button>
      ) : null}
      <Button size="sm" variant="outline" onClick={() => privy.logout()}>
        Log out
      </Button>
    </div>
  );
}

function HeaderAuth() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Set NEXT_PUBLIC_PRIVY_APP_ID
      </span>
    );
  }
  return <AuthControls />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const campaigns = useCatalog();
  const creating = pathname === "/campaigns/new";
  const campaign = campaigns.find(
    (item) =>
      pathname === `/campaigns/${item.slug}` ||
      pathname === `/campaigns/${item.slug}/operate`,
  );
  const operating = Boolean(campaign && pathname.endsWith("/operate"));

  return (
    <div className="flex min-h-svh w-full" data-variant="inset">
      <aside className="hidden w-64 shrink-0 bg-sidebar md:flex md:flex-col">
        <SidebarBody />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 bg-sidebar shadow-lg">
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col md:p-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl md:border md:shadow-sm">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background px-3">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
            <Link href="/" className="shrink-0 md:hidden" aria-label="Zikibols home">
              <BrandLogo className="h-8" />
            </Link>
            <Separator
              orientation="vertical"
              className="hidden h-4! w-px self-center md:block"
            />
            <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              <Link
                href="/"
                className={cn(
                  "truncate font-medium",
                  campaign || creating
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-foreground",
                )}
              >
                Dashboard
              </Link>
              {creating ? (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate font-medium">New campaign</span>
                </>
              ) : null}
              {campaign ? (
                <>
                  <span className="text-muted-foreground">/</span>
                  {operating ? (
                    <Link
                      href={`/campaigns/${campaign.slug}`}
                      className="truncate font-medium text-muted-foreground hover:text-foreground"
                    >
                      {campaign.title}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{campaign.title}</span>
                  )}
                </>
              ) : null}
              {operating ? (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate font-medium">Operator</span>
                </>
              ) : null}
            </nav>
            <CommandSearch />
            <ThemeToggle />
            <HeaderAuth />
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
