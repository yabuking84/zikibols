export type DocPage = {
  slug: string;
  file: string;
  title: string;
  description: string;
};

export const DOC_PAGES: DocPage[] = [
  {
    slug: "overview",
    file: "README.md",
    title: "Overview",
    description: "What Zikibols is, the hackathon tracks, and how to run it.",
  },
  {
    slug: "how-it-works",
    file: "README-non-technical.md",
    title: "How it works",
    description: "The product in plain English — founders, backers, and the office.",
  },
  {
    slug: "flow",
    file: "README-flow.md",
    title: "How the app flows",
    description: "Maps of who does what, from listing to settlement.",
  },
  {
    slug: "creator-lookup",
    file: "README-creator-lookup.md",
    title: "Check this creator",
    description: "What the diligence button does, step by step.",
  },
  {
    slug: "ats",
    file: "README-ats.md",
    title: "ATS",
    description: "What Asset Tokenization Studio is and what the operator desk can do.",
  },
  {
    slug: "limitations",
    file: "README-limitations.md",
    title: "Limits",
    description: "What this prototype can and cannot do.",
  },
  {
    slug: "plan",
    file: "PLAN.md",
    title: "Plan",
    description: "Prize mapping, schedule, and known gaps.",
  },
];

const FILE_TO_HREF = new Map(
  DOC_PAGES.flatMap((page) => [
    [page.file, `/docs/${page.slug}`],
    [`./${page.file}`, `/docs/${page.slug}`],
  ]),
);

export function getDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}

export function rewriteDocLinks(source: string): string {
  return source.replace(
    /\]\((\.\/)?((?:README(?:-[A-Za-z0-9]+)*)|PLAN)\.md(#[^)]*)?\)/g,
    (match, _dot, file, hash = "") => {
      const href = FILE_TO_HREF.get(`${file}.md`) ?? FILE_TO_HREF.get(`./${file}.md`);
      if (!href) return match;
      return `](${href}${hash})`;
    },
  );
}

export function flattenHeadingText(value: string): string {
  return value.replace(/[*_`[\]]/g, "").trim();
}
