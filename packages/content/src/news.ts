import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { newsDay } from "./content-schema.ts";

export function parseNewsDay({
  source,
  date,
  today = new Date().toISOString().slice(0, 10),
}: {
  source: string;
  date: string;
  today?: string;
}) {
  const data: unknown = JSON.parse(source);
  const day = newsDay.parse(data);
  if (day.date !== date) throw new Error(`News date does not match its filename: ${date}`);
  return day.date > today ? null : day;
}

export const newsDirectory = fileURLToPath(new URL("../news/", import.meta.url));

export async function readNews({
  directory = newsDirectory,
  today,
}: { directory?: string; today?: string } = {}) {
  // Git drops an empty directory, so a repository without news has no folder to read.
  const entries = await readdir(directory).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  });
  const files = entries.filter((file) => file.endsWith(".json"));
  const days = await Promise.all(
    files.map(async (file) => {
      try {
        return parseNewsDay({
          source: await readFile(join(directory, file), "utf8"),
          date: file.slice(0, -5),
          today,
        });
      } catch (error) {
        throw new Error(`Invalid news in ${file}`, { cause: error });
      }
    }),
  );
  return days.filter((day) => day !== null).sort((a, b) => b.date.localeCompare(a.date));
}
