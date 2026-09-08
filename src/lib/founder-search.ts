export type FounderSource = {
  title: string;
  url: string;
  snippet: string;
};

export type FounderProfile = {
  queried: string[];
  sources: FounderSource[];
  profile: string | null;
  skipped: string | null;
};

const MAX_SOURCES = 5;

export function isSearchConfigured() {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

function skipped(reason: string, queried: string[] = []): FounderProfile {
  return { queried, sources: [], profile: null, skipped: reason };
}

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

async function tavilySearch(query: string): Promise<FounderSource[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: MAX_SOURCES,
      include_answer: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed (${response.status})`);
  }

  const json = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };

  return (json.results ?? [])
    .map((row) => ({
      title: clip(row.title ?? "", 120),
      url: (row.url ?? "").trim(),
      snippet: clip(row.content ?? "", 280),
    }))
    .filter((row) => row.url.startsWith("http") && row.title);
}

function uniqueSources(rows: FounderSource[]) {
  const seen = new Set<string>();
  const out: FounderSource[] = [];
  for (const row of rows) {
    const key = row.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

function heuristicProfile(
  name: string,
  email: string | null,
  title: string,
  location: string,
  sources: FounderSource[],
) {
  if (sources.length === 0) return null;
  const who = email ? `${name} <${email}>` : name;
  const hits = sources
    .map((source, index) => `${index + 1}. ${source.title} — ${source.snippet}`)
    .join(" ");
  return [
    `Public-web sketch of ${who} for ${title} (${location}).`,
    `${sources.length} indexed page(s) matched the name${email ? " or email" : ""}; identity is unconfirmed unless a source clearly names the same entity.`,
    hits,
    "This is not KYC. Treat thin, generic, or mismatched hits as unknown risk, not a green light.",
  ].join(" ");
}

async function llmProfile(
  name: string,
  email: string | null,
  title: string,
  location: string,
  sources: FounderSource[],
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || sources.length === 0) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You compile a cautious public-web founder profile for crowdfunding backers. Use ONLY the provided search snippets. Write 5-8 short sentences. Cite source titles in parentheses. If the snippets do not clearly identify the same person or company as the campaign, say identity is unconfirmed. Never invent URLs, employers, headlines, or emails. Do not use leak sites or private records. Public web only.",
        },
        {
          role: "user",
          content: JSON.stringify({ name, email, title, location, sources }),
        },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) return null;
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

export async function searchFounder(input: {
  creatorName: string;
  creatorEmail: string | null;
  campaignTitle: string;
  location: string;
}): Promise<FounderProfile> {
  const name = input.creatorName.trim();
  const email = input.creatorEmail?.trim() || null;
  if (!name) {
    return skipped("No founder name on this campaign");
  }
  if (!isSearchConfigured()) {
    return skipped(
      "Set TAVILY_API_KEY to search the public web for this founder",
    );
  }

  const queried = [
    `"${name}" ${input.location} ${input.campaignTitle}`.replace(/\s+/g, " ").trim(),
  ];
  if (email) queried.push(`"${email}" "${name}"`);

  try {
    const batches = await Promise.all(queried.map((query) => tavilySearch(query)));
    const sources = uniqueSources(batches.flat());
    if (sources.length === 0) {
      return skipped("No public-web profile", queried);
    }
    const profile =
      (await llmProfile(name, email, input.campaignTitle, input.location, sources)) ??
      heuristicProfile(name, email, input.campaignTitle, input.location, sources);
    return { queried, sources, profile, skipped: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "search failed";
    return skipped(`Public-web search skipped: ${message}`, queried);
  }
}
