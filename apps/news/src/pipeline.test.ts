import { describe, expect, it } from "vite-plus/test";
import { renderEmbed } from "./embed.ts";
import { extractCandidates } from "./grok.ts";
import { buildRecord } from "./record.ts";

const post = (id: string, extra: Record<string, string> = {}) => ({
  subject: "Un modelo",
  fact: "publica pesos abiertos",
  url: `https://x.com/alguien/status/${id}`,
  ...extra,
});

describe("generator", () => {
  it("takes the final answer and ignores progress objects and braces inside strings", () => {
    const text = `{"status":"buscando {posts}"} texto {"items":[]} ${JSON.stringify({ items: [post("1")] })}`;
    expect(extractCandidates(text)).toEqual([post("1")]);
    const trailing = `${JSON.stringify({ items: [post("1")] })} {"debug":{"items":[]}}`;
    expect(extractCandidates(trailing)).toEqual([post("1")]);
    expect(extractCandidates("sin respuesta")).toBeNull();
  });
  it("never repeats a post from an earlier day or twice in the same day", () => {
    const source = buildRecord({
      date: "2026-01-02",
      candidates: [post("1"), post("2"), post("2"), post("3")],
      seen: new Set(["1"]),
    });
    expect(source).not.toContain("/status/1");
    expect(source?.match(/\/status\/2/g)).toHaveLength(1);
    expect(source).toContain("/status/3");
  });
  it("produces no record when nothing new survives", () => {
    expect(
      buildRecord({ date: "2026-01-02", candidates: [post("1")], seen: new Set(["1"]) }),
    ).toBeNull();
  });
  it("flattens text that would break the Markdown export or the build", () => {
    const source = buildRecord({
      date: "2026-01-02",
      candidates: [post("1", { subject: "Un [modelo]", fact: "publica\npesos — abiertos." })],
      seen: new Set(),
    });
    expect(source).toContain('"subject": "Un (modelo)"');
    expect(source).toContain('"fact": "publica pesos, abiertos"');
  });
});

describe("Discord consumer", () => {
  it("keeps each link reachable and shows formatting characters from posts as typed", () => {
    const embed = renderEmbed({
      date: "2026-01-02",
      items: [post("1", { subject: "**Un_modelo" }), post("2")],
    });
    const lines = embed.description.split("\n");
    expect(lines[0]).toContain(String.raw`[\*\*Un\_modelo](https://x.com/alguien/status/1)`);
    expect(lines[1]).toContain("(https://x.com/alguien/status/2)");
  });
});
