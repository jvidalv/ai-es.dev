import { parseNewsDay } from "@ai-es/content/news";
import type { Candidate } from "./grok.ts";

export const maxItems = 4;
const hasWord = /[\p{L}\p{N}]/u;

export function postId(url: string) {
  return /\/status\/(\d+)$/.exec(url)?.[1];
}

// The record feeds Markdown exports and a Discord embed, so link syntax and dashes are flattened.
function clean({ text, limit }: { text: string; limit: number }) {
  const flat = text
    .replace(/\s*—\s*/g, ", ")
    .replaceAll("–", "-")
    .replaceAll("[", "(")
    .replaceAll("]", ")")
    .replaceAll("\\", "/")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .replace(/\.+$/, "");
  if (flat.length <= limit) return flat;
  // The limit counts UTF-16 units, so a cut must not leave half of an emoji behind.
  return `${flat
    .slice(0, limit - 1)
    .replace(/[\uD800-\uDBFF]$/, "")
    .trimEnd()}…`;
}

export function buildRecord({
  date,
  candidates,
  seen,
}: {
  date: string;
  candidates: Candidate[];
  seen: ReadonlySet<string>;
}) {
  const used = new Set(seen);
  const items: Candidate[] = [];
  for (const entry of candidates) {
    const id = postId(entry.url);
    const subject = clean({ text: entry.subject, limit: 40 });
    const fact = clean({ text: entry.fact, limit: 120 });
    // Text left with no letter or digit, such as a row of periods, is not a news line.
    if (!id || used.has(id) || !hasWord.test(subject) || !hasWord.test(fact)) continue;
    used.add(id);
    items.push({ subject, fact, url: entry.url });
    if (items.length === maxItems) break;
  }
  if (items.length === 0) return null;
  const source = `${JSON.stringify({ date, items }, null, 2)}\n`;
  // The exact bytes that get committed pass through the reader both consumers use.
  parseNewsDay({ source, date, today: date });
  return source;
}
