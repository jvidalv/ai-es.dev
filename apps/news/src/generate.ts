import { readNews } from "@ai-es/content/news";
import { alert } from "./discord-api.ts";
import { runGrok, type Candidate } from "./grok.ts";
import { buildRecord, maxItems, postId } from "./record.ts";
import { commitRecord, log, syncMain, today } from "./repo.ts";
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
    log(
      `Descartada, no verificable: ${check.status === "fulfilled" ? check.value.entry.url : "sin respuesta de X"}`,
    );
    return [];
  });
}

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
  const seen = new Set(
    days
      .slice(0, memoryRecords)
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
  await commitRecord({ date, source });
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
