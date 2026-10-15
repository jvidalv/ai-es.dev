import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

const run = promisify(execFile);
// The cron job gives the whole run 1500 s; a normal search takes 200 to 300 s.
const timeoutSeconds = 1320;
// Grok reads untrusted posts: it keeps X search (a server tool) and todo_write, nothing else.
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
// The tool list fails open on a new grok release, so as root grok also runs as this user in a sandbox.
const sandboxHome = "/var/lib/ai-es-grok";
const sandbox = [
  "User=ai-es-grok",
  `WorkingDirectory=${sandboxHome}`,
  `ReadWritePaths=${sandboxHome}`,
  "NoNewPrivileges=yes",
  "ProtectSystem=strict",
  "ProtectHome=yes",
  "PrivateTmp=yes",
  "PrivateDevices=yes",
  "InaccessiblePaths=/opt /srv -/etc/fail2ban -/var/lib/docker -/var/lib/containerd",
  // Local services such as the Caddy admin API ask for no password; only the DNS stub stays open.
  "IPAddressDeny=127.0.0.0/8 ::1/128 169.254.0.0/16 fe80::/10 224.0.0.0/4 ff00::/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 100.64.0.0/10 fc00::/7",
  "IPAddressAllow=127.0.0.53/32",
  // The client timeout fires first; this only stops a unit whose client was killed.
  `RuntimeMaxSec=${timeoutSeconds + 60}`,
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

export function grokCommand({ prompt, asRoot }: { prompt: string; asRoot: boolean }) {
  if (!asRoot) return { command: "grok", args: grokArgs(prompt) };
  // Without --expand-environment=no, systemd would replace ${...} inside the prompt.
  const options = ["--pipe", "--wait", "--collect", "--quiet", "--expand-environment=no"];
  return {
    command: "systemd-run",
    args: [
      ...options,
      ...sandbox.flatMap((property) => ["-p", property]),
      `${sandboxHome}/.grok/bin/grok`,
      ...grokArgs(prompt),
    ],
  };
}

export async function runGrok({ today, maxItems }: { today: string; maxItems: number }) {
  const template = await readFile(new URL("../prompt.md", import.meta.url), "utf8");
  const prompt = template.replaceAll("{{TODAY}}", today).replaceAll("{{MAX}}", String(maxItems));
  // Grok runs outside the checkout so the agent has no reason to touch the repository.
  const cwd = join(tmpdir(), "ai-es-news-work");
  await mkdir(cwd, { recursive: true });
  const { command, args } = grokCommand({ prompt, asRoot: process.getuid?.() === 0 });
  let stdout: string;
  try {
    ({ stdout } = await run(command, args, {
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
    // systemd-run reports a sandbox failure only as its exit status, such as 200 (CHDIR).
    const code = error instanceof Error && "code" in error ? ` ${String(error.code)}` : "";
    // The child-process message repeats the whole prompt, so only stderr reaches the alert.
    throw new Error(`grok terminó con el error${code}: ${stderr || "sin salida de error"}`);
  }
  const data: unknown = JSON.parse(stdout);
  const { text, total_cost_usd: cost } = output.parse(data);
  const candidates = extractCandidates(text);
  if (!candidates) throw new Error(`La respuesta de grok no trae noticias: ${text.slice(-300)}`);
  return { candidates, cost };
}
