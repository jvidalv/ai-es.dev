import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const recordsPath = "packages/content/news/";
const recordPath = (date: string) => `${recordsPath}${date}.json`;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function log(message: string) {
  console.log(`[${new Date().toISOString().slice(0, 19)}] ${message}`);
}

async function tool({ command, args }: { command: string; args: string[] }) {
  try {
    return (await run(command, args, { cwd: root })).stdout.trim();
  } catch (error) {
    const stderr =
      error instanceof Error && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim().slice(-300)
        : "";
    // The child-process message repeats every argument, so only stderr reaches the alert.
    throw new Error(`${command} ${args[0] ?? ""} falló: ${stderr || "sin salida de error"}`);
  }
}

// Main is the only source: the generator and the consumers read records from it, never from files.
export async function publishedRecords(since: string) {
  await tool({ command: "git", args: ["fetch", "--quiet", "origin", "main"] });
  const files = await tool({
    command: "git",
    args: ["ls-tree", "--name-only", "origin/main", recordsPath],
  });
  const dates = files
    .split("\n")
    .flatMap((file) => /(\d{4}-\d{2}-\d{2})\.json$/.exec(file)?.[1] ?? [])
    .filter((date) => date >= since)
    .sort();
  return Promise.all(
    dates.map(async (date) => ({
      date,
      source: await tool({ command: "git", args: ["show", `origin/main:${recordPath(date)}`] }),
    })),
  );
}

export async function onMain() {
  return (await tool({ command: "git", args: ["rev-parse", "--abbrev-ref", "HEAD"] })) === "main";
}

// One commit made through the GitHub API: the checkout never holds a local commit to push,
// rebase or leave half done, and nothing but the record can reach main.
export async function publishRecord({ date, source }: { date: string; source: string }) {
  const args = [
    "api",
    "--silent",
    "--method",
    "PUT",
    `repos/{owner}/{repo}/contents/${recordPath(date)}`,
    "-f",
    `message=Add AI news for ${date}`,
    "-f",
    "branch=main",
    "-f",
    `content=${Buffer.from(source).toString("base64")}`,
  ];
  for (let attempt = 1; ; attempt++) {
    try {
      await tool({ command: "gh", args });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(10_000);
    }
  }
}
