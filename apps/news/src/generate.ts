import { readNews } from "@ai-es/content/news";
import { alert } from "./discord-api.ts";
import { runGrok, type Candidate } from "./grok.ts";
import { buildRecord, maxItems, postId } from "./record.ts";
import { commitRecord, log, syncMain, today } from "./repo.ts";
import { verifyPost } from "./verify.ts";

// A post already summarised in the last two weeks is not news again.
const memoryDays = 14;
const dryRun = process.argv.includes("--dry-run");

async function generate() {
  const date = today();
  if (!dryRun) await syncMain();
  const days = await readNews();
  if (!dryRun && days.some((day) => day.date === date)) {
    log(`El registro de ${date} ya existe; no se genera otra vez`);
    return;
  }
  const { candidates, cost } = await runGrok({ today: date, maxItems });
  log(`grok devolvió ${candidates.length} candidatas, coste aproximado ${cost ?? "?"} USD`);
  const verified: Candidate[] = [];
  for (const entry of candidates) {
    const url = await verifyPost(entry.url);
    if (url) verified.push({ ...entry, url });
    else log(`Descartada, no verificable: ${entry.url}`);
  }
  const seen = new Set(
    days.slice(0, memoryDays).flatMap((day) => day.items.flatMap((item) => postId(item.url) ?? [])),
  );
  const source = buildRecord({ date, candidates: verified, seen });
  if (!source) {
    log("Ninguna noticia nueva y verificada; hoy no hay registro");
    return;
  }
  if (dryRun) {
    console.log(source);
    return;
  }
  await commitRecord({ date, source });
  log(`Registro de ${date} publicado en main`);
}

try {
  await generate();
} catch (error) {
  const cause =
    error instanceof Error && error.cause instanceof Error ? ` (${error.cause.message})` : "";
  const message = `el generador falló: ${String(error)}${cause}`.slice(0, 600);
  log(`ERROR: ${message}`);
  if (!dryRun) await alert(message);
  process.exitCode = 1;
}
