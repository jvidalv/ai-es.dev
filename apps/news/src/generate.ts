import { parseNewsDay } from "@ai-es/content/news";
import { alert } from "./discord-api.ts";
import { runGrok, type Candidate } from "./grok.ts";
import { buildRecord, maxItems, postId } from "./record.ts";
import { daysAgo, log, onMain, publishedRecords, publishRecord, today } from "./repo.ts";
import { verifyPost } from "./verify.ts";

// A post already summarised in one of the latest records is not news again.
const memoryRecords = 14;
const dryRun = process.argv.includes("--dry-run");

async function verified(candidates: Candidate[]) {
  // Grok is asked for a few items; a much longer answer is not worth a request per entry.
  const shortlist = candidates.slice(0, maxItems * 3);
  const checks = await Promise.allSettled(
    shortlist.map(async (entry) => ({ entry, url: await verifyPost(entry.url) })),
  );
  const unreachable = checks.filter((check) => check.status === "rejected").length;
  if (shortlist.length > 0 && unreachable === shortlist.length) {
    throw new Error("X no respondió al verificar ningún post");
  }
  return checks.flatMap((check) => {
    if (check.status === "fulfilled" && check.value.url) {
      return [{ ...check.value.entry, url: check.value.url }];
    }
    const url = check.status === "fulfilled" ? check.value.entry.url : "sin respuesta de X";
    log(`Descartada, no verificable: ${url}`);
    return [];
  });
}

async function generate() {
  const date = today();
  if (!dryRun && !(await onMain())) {
    throw new Error("El generador solo publica desde un checkout de main");
  }
  const records = await publishedRecords(daysAgo(30));
  if (!dryRun && records.some((record) => record.date === date)) {
    log(`El registro de ${date} ya está en main; no se genera otra vez`);
    return;
  }
  const { candidates, cost } = await runGrok({ today: date, maxItems });
  log(`grok devolvió ${candidates.length} candidatas, coste aproximado ${cost ?? "?"} USD`);
  const seen = new Set(
    records
      .slice(-memoryRecords)
      .flatMap((record) => parseNewsDay({ source: record.source, date: record.date }) ?? [])
      .flatMap((day) => day.items.flatMap((item) => postId(item.url) ?? [])),
  );
  const source = buildRecord({ date, candidates: await verified(candidates), seen });
  if (!source) {
    log("Ninguna noticia nueva y verificada; hoy no hay registro");
    return;
  }
  if (dryRun) {
    console.log(source);
    return;
  }
  await publishRecord({ date, source });
  log(`Registro de ${date} publicado en main`);
}

try {
  await generate();
} catch (error) {
  const message = `el generador falló: ${String(error)}`.slice(0, 600);
  log(`ERROR: ${message}`);
  if (!dryRun) await alert(message);
  process.exitCode = 1;
}
