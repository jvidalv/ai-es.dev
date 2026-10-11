import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

const run = promisify(execFile);
// The cron job gives the whole run 1500 s; normal searches take between 450 and 900 s.
const timeoutSeconds = 1320;
const output = z.object({ text: z.string(), total_cost_usd: z.number().optional() });
const answer = z.object({ items: z.array(z.unknown()) });
const candidate = z.object({ subject: z.string(), fact: z.string(), url: z.string() });
export type Candidate = z.infer<typeof candidate>;

function objectEnd(text: string, start: number) {
  let depth = 0;
  let inString = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (char === "\\") index++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return index + 1;
  }
  return -1;
}

// Grok sometimes prints progress objects before the answer, so the last one with items wins.
export function extractCandidates(text: string): Candidate[] | null {
  let found: unknown[] | null = null;
  let index = text.indexOf("{");
  while (index !== -1) {
    const end = objectEnd(text, index);
    let parsed: unknown;
    let next = index + 1;
    try {
      if (end !== -1) {
        parsed = JSON.parse(text.slice(index, end));
        // A whole object was read, so its nested objects are not answers of their own.
        next = end;
      }
    } catch {
      parsed = undefined;
    }
    const result = answer.safeParse(parsed);
    if (result.success) found = result.data.items;
    index = text.indexOf("{", next);
  }
  return (
    found?.flatMap((entry) => {
      const result = candidate.safeParse(entry);
      return result.success ? [result.data] : [];
    }) ?? null
  );
}

export async function runGrok({ today, maxItems }: { today: string; maxItems: number }) {
  const template = await readFile(new URL("../prompt.md", import.meta.url), "utf8");
  const prompt = template.replaceAll("{{TODAY}}", today).replaceAll("{{MAX}}", String(maxItems));
  // Grok runs outside the checkout so the agent has no reason to touch the repository.
  const cwd = join(tmpdir(), "ai-es-news-work");
  await mkdir(cwd, { recursive: true });
  let stdout: string;
  try {
    ({ stdout } = await run("grok", ["-p", prompt, "--output-format", "json"], {
      cwd,
      // Grok reads untrusted posts and can run commands: it gets no secret from this process.
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
      timeout: timeoutSeconds * 1000,
      maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (error) {
    if (error instanceof Error && "killed" in error && error.killed === true) {
      throw new Error(`grok no terminó en ${timeoutSeconds} s`);
    }
    const stderr =
      error instanceof Error && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim().slice(-300)
        : "";
    // The child-process message repeats the whole prompt, so only stderr reaches the alert.
    throw new Error(`grok terminó con un error: ${stderr || "sin salida de error"}`);
  }
  const data: unknown = JSON.parse(stdout);
  const { text, total_cost_usd: cost } = output.parse(data);
  const candidates = extractCandidates(text);
  if (!candidates) throw new Error(`La respuesta de grok no trae noticias: ${text.slice(-300)}`);
  return { candidates, cost };
}
