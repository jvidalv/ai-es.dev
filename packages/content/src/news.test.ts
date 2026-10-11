import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { parseNewsDay, readNews } from "./news.ts";

const source = (item: Record<string, string> = {}, date = "2026-01-01") =>
  JSON.stringify({
    date,
    items: [
      {
        subject: "Un modelo",
        fact: "publica pesos abiertos",
        url: "https://x.com/alguien/status/123",
        ...item,
      },
    ],
  });
describe("daily news boundary", () => {
  it("keeps a day dated in the future out of the generated site", () => {
    expect(parseNewsDay({ source: source(), date: "2026-01-01", today: "2025-12-31" })).toBeNull();
    expect(
      parseNewsDay({ source: source(), date: "2026-01-01", today: "2026-01-01" }),
    ).not.toBeNull();
  });
  it("rejects links that are not X posts before they reach a page", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://x.com/alguien/status/123",
      "https://x.com.evil.example/alguien/status/123",
      "https://x.com/alguien/status/123?ref=otro",
    ]) {
      expect(() => parseNewsDay({ source: source({ url }), date: "2026-01-01" })).toThrow();
    }
  });
  it("rejects a file whose content belongs to another day", () => {
    expect(() => parseNewsDay({ source: source(), date: "2026-01-02" })).toThrow();
  });
  it("rejects unknown fields and text that would publish a broken line", () => {
    const broken: Record<string, string>[] = [
      { author: "x" },
      { fact: "  " },
      { fact: "publica [pesos](https://example.com)" },
      { fact: "publica\n## Otro título" },
      { subject: "Un [modelo]" },
    ];
    for (const item of broken) {
      expect(() => parseNewsDay({ source: source(item), date: "2026-01-01" })).toThrow();
    }
  });
  it("rejects a day that lists the same post twice", () => {
    const item = { subject: "Un modelo", fact: "publica", url: "https://x.com/a/status/1" };
    const day = { date: "2026-01-01", items: [item, item] };
    expect(() => parseNewsDay({ source: JSON.stringify(day), date: "2026-01-01" })).toThrow();
  });
  it("lists the newest day first and skips future days and a missing directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ai-es-news-"));
    for (const date of ["2026-01-01", "2026-01-03", "2026-01-02"]) {
      await writeFile(join(directory, `${date}.json`), source({}, date));
    }
    const days = await readNews({ directory, today: "2026-01-02" });
    expect(days.map((day) => day.date)).toEqual(["2026-01-02", "2026-01-01"]);
    expect(await readNews({ directory: join(directory, "missing") })).toEqual([]);
  });
});
