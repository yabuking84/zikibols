import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GithubSlugger from "github-slugger";
import { DocsMarkdown } from "@/components/docs-markdown";
import { buttonVariants } from "@/components/ui/button";
import { DOC_PAGES, flattenHeadingText, getDoc } from "@/lib/docs";
import { loadDoc } from "@/lib/load-doc";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} · Docs`,
    description: doc.description,
  };
}

function extractHeadings(source: string) {
  const slugger = new GithubSlugger();
  return [...source.matchAll(/^(#{1,4})\s+(.+)$/gm)].map((match) => {
    const title = flattenHeadingText(match[2]);
    return {
      depth: match[1].length,
      title,
      id: slugger.slug(title),
    };
  });
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await loadDoc(slug);
  if (!doc) notFound();

  const headings = extractHeadings(doc.source).filter((heading) => heading.depth === 2);
  const index = DOC_PAGES.findIndex((page) => page.slug === slug);
  const previous = index > 0 ? DOC_PAGES[index - 1] : undefined;
  const next = index >= 0 ? DOC_PAGES[index + 1] : undefined;

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{doc.file}</p>
          <DocsMarkdown source={doc.source} />
        </div>
        {headings.length > 2 ? (
          <aside className="hidden w-52 shrink-0 xl:block">
            <div className="sticky top-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                On this page
              </p>
              <nav className="flex flex-col gap-1.5">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {heading.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        {previous ? (
          <Link
            href={`/docs/${previous.slug}`}
            className={`${buttonVariants({ variant: "outline", size: "sm" })} w-fit`}
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className={`${buttonVariants({ variant: "outline", size: "sm" })} w-fit`}
          >
            {next.title} →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
