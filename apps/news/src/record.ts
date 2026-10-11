import { parseNewsDay } from "@ai-es/content/news";
import type { Candidate } from "./grok.ts";

export const maxItems = 4;

export function postId(url: string) {
  return /\/status\/(\d+)$/.exec(url)?.[1];
}

// The record feeds Markdown exports and a Discord embed, so link syntax and dashes are flattened.
export function clean({ text, limit }: { text: string; limit: number }) {
  const flat = text
    .replaceAll("—", ",")
    .replaceAll("–", "-")
    .replaceAll("[", "(")
    .replaceAll("]", ")")
    .replaceAll("\\", "/")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
  return flat.length <= limit ? flat : `${flat.slice(0, limit - 1).trimEnd()}…`;
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
    const fact = clean({ text: entry.fact, limit: 120 }).replace(/\.+$/, "");
    if (!id || used.has(id) || !subject || !fact) continue;
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
