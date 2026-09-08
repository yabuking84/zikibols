"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Command,
  Landmark,
  LayoutDashboard,
  Menu,
  Shield,
  Wallet,
} from "lucide-react";
import { CommandSearch } from "@/components/command-search";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { campaigns } from "@/lib/campaigns";
import { shortAddress } from "@/lib/money";
import { cn } from "cn";

const generalNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center gap-2 px-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Shield className="size-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">zikibols</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
      </div>
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

  const address = wallets[0]?.address;

  return (
    <div className="flex items-center gap-2">
      {address ? (
        <span className="hidden max-w-28 truncate font-mono text-xs text-muted-foreground sm:inline">
          {shortAddress(address)}
        </span>
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
  const campaign = campaigns.find(
    (item) => pathname === `/campaigns/${item.slug}`,
  );

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
            <Separator
              orientation="vertical"
              className="hidden h-4! w-px self-center md:block"
            />
            <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              <Link
                href="/"
                className={cn(
                  "truncate font-medium",
                  campaign
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-foreground",
                )}
              >
                Dashboard
              </Link>
              {campaign ? (
                <>
                  <span className="text-muted-foreground">/</span>
                  <span className="truncate font-medium">{campaign.title}</span>
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
