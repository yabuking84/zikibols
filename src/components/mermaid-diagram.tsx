"use client";

import { useEffect, useId, useState } from "react";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDark());
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setSvg("");

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: dark ? "dark" : "neutral",
          securityLevel: "strict",
          fontFamily: "inherit",
        });
        const { svg: next } = await mermaid.render(
          `mermaid-${reactId}-${dark ? "dark" : "light"}`,
          chart,
        );
        if (!cancelled) setSvg(next);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, dark, reactId]);

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-xl border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        Drawing diagram…
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border bg-card p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
