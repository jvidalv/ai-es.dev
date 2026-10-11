import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { newsDirectory } from "@ai-es/content/news";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const recordsPath = "packages/content/news/";
const recordPath = (date: string) => `${recordsPath}${date}.json`;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function log(message: string) {
  console.log(`[${new Date().toISOString().slice(0, 19)}] ${message}`);
}

async function git(args: string[]) {
  const { stdout } = await run("git", ["-C", root, ...args]);
  return stdout.trim();
}

// Consumers read records from main, never from the generator's working files.
export async function publishedRecords(since: string) {
  await git(["fetch", "--quiet", "origin", "main"]);
  const files = await git(["ls-tree", "--name-only", "origin/main", recordsPath]);
  const dates = files
    .split("\n")
    .flatMap((file) => /(\d{4}-\d{2}-\d{2})\.json$/.exec(file)?.[1] ?? [])
    .filter((date) => date >= since)
    .sort();
  return Promise.all(
    dates.map(async (date) => ({
      date,
      source: await git(["show", `origin/main:${recordPath(date)}`]),
    })),
  );
}

async function rebaseOntoMain() {
  try {
    await git(["pull", "--quiet", "--rebase", "origin", "main"]);
  } catch (error) {
    // A rebase left half done detaches HEAD and would block every later run.
    await git(["rebase", "--abort"]).catch(() => undefined);
    throw error;
  }
}

export async function syncMain() {
  if ((await git(["rev-parse", "--abbrev-ref", "HEAD"])) !== "main") {
    throw new Error("El generador solo publica desde un checkout de main");
  }
  // A commit that exists only here is a record an earlier run could not push: publish it first.
  await rebaseOntoMain();
  await git(["push", "--quiet", "origin", "HEAD:main"]);
}

export async function commitRecord({ date, source }: { date: string; source: string }) {
  await writeFile(join(newsDirectory, `${date}.json`), source);
  await git(["add", recordPath(date)]);
  await git(["commit", "--quiet", "-m", `Add AI news for ${date}`, "--", recordPath(date)]);
  try {
    await git(["push", "--quiet", "origin", "HEAD:main"]);
  } catch {
    // Someone pushed to main during the search: replay the record on top and try once more.
    await rebaseOntoMain();
    await git(["push", "--quiet", "origin", "HEAD:main"]);
  }
}
