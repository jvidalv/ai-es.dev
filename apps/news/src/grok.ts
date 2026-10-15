import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

const run = promisify(execFile);
// The cron job gives the whole run 1500 s; a normal search takes 200 to 300 s.
const timeoutSeconds = 1320;
// Grok reads untrusted posts as root: it keeps X search (a server tool) and todo_write, nothing else.
// An allowlist cannot do this: with x_search in --tools, grok 1.0.46 keeps all local tools.
const deniedTools = [
  "run_terminal_command",
  "run_terminal_cmd",
  "read_file",
  "write",
  "search_replace",
  "list_dir",
  "grep",
  "web_fetch",
  "workflow",
  "monitor",
  "image_edit",
  "image_gen",
  "image_to_video",
  "reference_to_video",
  "spawn_subagent",
  "Agent",
  "scheduler_create",
  "scheduler_delete",
  "scheduler_list",
  "get_command_or_subagent_output",
  "kill_command_or_subagent",
  "send_feedback",
  "ask_user_question",
  "enter_plan_mode",
  "exit_plan_mode",
  "search_tool",
  "use_tool",
];
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

// Grok prints other objects around the answer. The last list that holds real candidates wins,
// so a closing object with an empty or unrelated items list cannot erase it.
export function extractCandidates(text: string): Candidate[] | null {
  let found: Candidate[] | null = null;
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
    if (result.success) {
      const candidates = result.data.items.flatMap((entry) => {
        const item = candidate.safeParse(entry);
        return item.success ? [item.data] : [];
      });
      if (candidates.length > 0 || !found) found = candidates;
    }
    index = text.indexOf("{", next);
  }
  return found;
}

export function grokArgs(prompt: string) {
  return ["-p", prompt, "--output-format", "json", "--disallowed-tools", deniedTools.join(",")];
}

export async function runGrok({ today, maxItems }: { today: string; maxItems: number }) {
  const template = await readFile(new URL("../prompt.md", import.meta.url), "utf8");
  const prompt = template.replaceAll("{{TODAY}}", today).replaceAll("{{MAX}}", String(maxItems));
  // Grok runs outside the checkout so the agent has no reason to touch the repository.
  const cwd = join(tmpdir(), "ai-es-news-work");
  await mkdir(cwd, { recursive: true });
  let stdout: string;
  try {
    ({ stdout } = await run("grok", grokArgs(prompt), {
      cwd,
      // Grok gets no secret from this process, only PATH and HOME.
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
