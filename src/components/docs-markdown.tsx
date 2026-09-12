import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import Link from "next/link";
import {
  Children,
  isValidElement,
  type ReactNode,
} from "react";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { flattenHeadingText } from "@/lib/docs";
import { cn } from "cn";

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }
  return "";
}

function headingId(slugger: GithubSlugger, children: ReactNode) {
  return slugger.slug(flattenHeadingText(textFromNode(children)));
}

function MarkdownLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  if (!href) return <span>{children}</span>;
  const className = "font-medium text-primary underline-offset-4 hover:underline";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function createComponents(slugger: GithubSlugger): Components {
  const heading =
    (Tag: "h1" | "h2" | "h3" | "h4", className: string) =>
    ({ children }: { children?: ReactNode }) => {
      const id = headingId(slugger, children);
      return (
        <Tag id={id} className={className}>
          <a href={`#${id}`} className="no-underline hover:underline">
            {children}
          </a>
        </Tag>
      );
    };

  return {
    h1: heading("h1", "scroll-mt-16 text-2xl font-bold tracking-tight"),
    h2: heading(
      "h2",
      "mt-10 scroll-mt-16 border-t pt-6 text-xl font-semibold tracking-tight",
    ),
    h3: heading("h3", "mt-8 scroll-mt-16 text-lg font-semibold tracking-tight"),
    h4: heading("h4", "mt-6 scroll-mt-16 text-base font-semibold"),
    p: ({ children }) => (
      <p className="leading-relaxed text-muted-foreground [&:not(:first-child)]:mt-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-muted-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-8 border-border" />,
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <MarkdownLink href={href}>{children}</MarkdownLink>
    ),
    table: ({ children }) => (
      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full min-w-xl border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    tbody: ({ children }) => (
      <tbody className="divide-y">{children}</tbody>
    ),
    tr: ({ children }) => <tr className="align-top">{children}</tr>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-medium">{children}</th>
    ),
    td: ({ children }) => (
      <td className="px-3 py-2 text-muted-foreground">{children}</td>
    ),
    pre: ({ children, className }) => {
      const child = Children.toArray(children)[0];
      if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
        const lang = /language-(\w+)/.exec(child.props.className ?? "")?.[1];
        if (lang === "mermaid") {
          return (
            <div className="mt-4">
              <MermaidDiagram
                chart={String(child.props.children).replace(/\n$/, "")}
              />
            </div>
          );
        }
      }
      return (
        <pre
          className={cn(
            "mt-4 overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-relaxed",
            className,
          )}
        >
          {children}
        </pre>
      );
    },
    code: ({ className, children }) => {
      if (className) {
        return <code className={className}>{children}</code>;
      }
      return (
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {children}
        </code>
      );
    },
  };
}

export function DocsMarkdown({ source }: { source: string }) {
  const slugger = new GithubSlugger();
  return (
    <div className="max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} components={createComponents(slugger)}>
        {source}
      </Markdown>
    </div>
  );
}
