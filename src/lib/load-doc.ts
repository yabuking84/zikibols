import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDoc, rewriteDocLinks, type DocPage } from "@/lib/docs";

export type LoadedDoc = DocPage & { source: string };

export async function loadDoc(slug: string): Promise<LoadedDoc | null> {
  const doc = getDoc(slug);
  if (!doc) return null;
  const source = await readFile(path.join(process.cwd(), doc.file), "utf8");
  return { ...doc, source: rewriteDocLinks(source) };
}
