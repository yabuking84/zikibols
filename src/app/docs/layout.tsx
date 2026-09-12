import type { Metadata } from "next";
import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Docs",
  description: "How Zikibols works, from the same README files in the repo.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <div className="lg:sticky lg:top-4">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            Documentation
          </p>
          <div className="overflow-x-auto lg:overflow-visible">
            <div className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
              <DocsNav />
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
