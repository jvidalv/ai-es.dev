import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { newsDirectory } from "@ai-es/content/news";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../../", import.meta.url));
const recordPath = (date: string) => `packages/content/news/${date}.json`;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function log(message: string) {
  console.log(`[${new Date().toISOString().slice(0, 19)}] ${message}`);
}

export async function git(args: string[]) {
  const { stdout } = await run("git", ["-C", root, ...args]);
  return stdout.trim();
}

// Consumers read the record from main, never from the generator's working files.
export async function publishedRecord(date: string) {
  await git(["fetch", "--quiet", "origin", "main"]);
  try {
    return await git(["show", `origin/main:${recordPath(date)}`]);
  } catch {
    return null;
  }
}

export async function syncMain() {
  if ((await git(["rev-parse", "--abbrev-ref", "HEAD"])) !== "main") {
    throw new Error("El generador solo publica desde un checkout de main");
  }
  await git(["pull", "--quiet", "--ff-only", "origin", "main"]);
}

export async function commitRecord({ date, source }: { date: string; source: string }) {
  await writeFile(join(newsDirectory, `${date}.json`), source);
  await git(["add", recordPath(date)]);
  await git(["commit", "--quiet", "-m", `Add AI news for ${date}`, "--", recordPath(date)]);
  try {
    await git(["push", "--quiet", "origin", "HEAD:main"]);
  } catch {
    // Someone pushed to main during the search: replay the record on top and try once more.
    await git(["pull", "--quiet", "--rebase", "origin", "main"]);
    await git(["push", "--quiet", "origin", "HEAD:main"]);
  }
}
