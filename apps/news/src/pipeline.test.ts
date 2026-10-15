import { describe, expect, it } from "vite-plus/test";
import { isSent, renderEmbed } from "./embed.ts";
import { extractCandidates, grokArgs, grokCommand } from "./grok.ts";
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
    for (const closing of ['{"items":[]}', '{"items":[{"status":"done"}]}']) {
      const answer = `${JSON.stringify({ items: [post("1")] })} ${closing}`;
      expect(extractCandidates(answer)).toEqual([post("1")]);
    }
    expect(extractCandidates('{"items":[]}')).toEqual([]);
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
  it("drops lines with no words and never cuts an emoji in half", () => {
    const long = `${"a".repeat(118)}😀 y sigue`;
    const source = buildRecord({
      date: "2026-01-02",
      candidates: [post("1", { fact: ".".repeat(200) }), post("2", { fact: long })],
      seen: new Set(),
    });
    expect(source).not.toContain("/status/1");
    expect(source).toContain(`"fact": "${"a".repeat(118)}…"`);
  });
});

describe("grok", () => {
  it("removes the local tools that could run commands or read secrets", () => {
    const args = grokArgs("prompt");
    const denied = args[args.indexOf("--disallowed-tools") + 1]?.split(",") ?? [];
    expect(denied).toEqual(
      expect.arrayContaining(["run_terminal_command", "read_file", "write", "search_replace"]),
    );
    // With x_search in --tools, grok keeps every local tool.
    expect(args).not.toContain("--tools");
  });
  it("never runs grok as root, where it could read the generator's secrets", () => {
    const { command, args } = grokCommand({ prompt: "prompt", asRoot: true });
    expect(command).toBe("systemd-run");
    expect(args).toEqual(
      expect.arrayContaining(["User=ai-es-grok", "ProtectHome=yes", "--expand-environment=no"]),
    );
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
  it("recognises a day it already sent and does not confuse a longer post id", () => {
    const day = { date: "2026-01-02", items: [post("12"), post("34")] };
    expect(isSent({ day, texts: [renderEmbed(day).description] })).toBe(true);
    expect(isSent({ day, texts: [renderEmbed({ ...day, items: [post("34")] }).description] })).toBe(
      true,
    );
    const other = { date: "2026-01-02", items: [post("123")] };
    expect(isSent({ day, texts: [renderEmbed(other).description, "charla sin enlaces"] })).toBe(
      false,
    );
  });
});
