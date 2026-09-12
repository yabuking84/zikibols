"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_PAGES } from "@/lib/docs";
import { cn } from "cn";

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 lg:flex-col">
      <Link
        href="/docs"
        className={cn(
          "whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          pathname === "/docs"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        All docs
      </Link>
      {DOC_PAGES.map((page) => {
        const href = `/docs/${page.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={page.slug}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {page.title}
          </Link>
        );
      })}
    </nav>
  );
}
