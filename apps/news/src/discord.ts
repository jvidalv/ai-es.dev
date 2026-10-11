import { parseNewsDay } from "@ai-es/content/news";
import { z } from "zod";
import { alert, discord, discordConfig } from "./discord-api.ts";
import { isSent, renderEmbed } from "./embed.ts";
import { daysAgo, log, publishedRecords } from "./repo.ts";

// A record committed by hand a day or two late is still delivered.
const windowDays = 3;
const maxPages = 20;
// Discord sends null for the fields an embed does not have, such as a GIF's description.
const page = z.array(
  z.object({
    id: z.string(),
    timestamp: z.string(),
    embeds: z.array(z.object({ description: z.string().nullish() })).nullish(),
  }),
);
const dryRun = process.argv.includes("--dry-run");

// The channel is the only delivery state, read back to the first day the window covers.
async function sentTexts({ messages, since }: { messages: string; since: string }) {
  const texts: string[] = [];
  let before = "";
  for (let count = 0; count < maxPages; count++) {
    const query = before ? `?limit=100&before=${before}` : "?limit=100";
    const batch = page.parse(await discord({ method: "GET", path: `${messages}${query}` }));
    texts.push(
      ...batch.flatMap((message) =>
        (message.embeds ?? []).flatMap((entry) => entry.description ?? []),
      ),
    );
    const oldest = batch.at(-1);
    if (batch.length < 100 || !oldest || oldest.timestamp.slice(0, 10) < since) break;
    before = oldest.id;
  }
  return texts;
}

async function publish() {
  const since = daysAgo(windowDays - 1);
  const records = await publishedRecords(since);
  const days = records.flatMap(({ date, source }) => parseNewsDay({ source, date }) ?? []);
  if (days.length === 0) {
    log(`Sin registros en main desde ${since}; nada que publicar en Discord`);
    return;
  }
  const channelId = discordConfig().NEWS_CHANNEL_ID;
  if (!channelId) throw new Error("Falta NEWS_CHANNEL_ID");
  const messages = `/channels/${channelId}/messages`;
  for (const day of days) {
    // Read again right before each post, so a run that just finished elsewhere is seen.
    if (isSent({ day, texts: await sentTexts({ messages, since }) })) {
      log(`El resumen de ${day.date} ya está en Discord`);
      continue;
    }
    const embed = renderEmbed(day);
    if (dryRun) {
      console.log(JSON.stringify(embed, null, 2));
      continue;
    }
    await discord({
      method: "POST",
      path: messages,
      body: { embeds: [embed], allowed_mentions: { parse: [] } },
    });
    log(`Resumen de ${day.date} publicado en Discord`);
  }
}

try {
  await publish();
} catch (error) {
  const message = `el consumidor de Discord falló: ${String(error)}`.slice(0, 600);
  log(`ERROR: ${message}`);
  if (!dryRun) await alert(message);
  process.exitCode = 1;
}
