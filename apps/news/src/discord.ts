import { parseNewsDay } from "@ai-es/content/news";
import { z } from "zod";
import { alert, discord, discordConfig } from "./discord-api.ts";
import { renderEmbed } from "./embed.ts";
import { log, publishedRecords } from "./repo.ts";

// A record that reached main late, after a failed push or a failed run, is still delivered.
const windowDays = 3;
const history = z.array(
  z.object({ embeds: z.array(z.object({ description: z.string().optional() })).default([]) }),
);
const dryRun = process.argv.includes("--dry-run");

async function publish() {
  const since = new Date(Date.now() - (windowDays - 1) * 86_400_000).toISOString().slice(0, 10);
  const records = await publishedRecords(since);
  const days = records.flatMap(({ date, source }) => parseNewsDay({ source, date }) ?? []);
  if (days.length === 0) {
    log(`Sin registros en main desde ${since}; nada que publicar en Discord`);
    return;
  }
  const channelId = discordConfig().NEWS_CHANNEL_ID;
  if (!channelId) throw new Error("Falta NEWS_CHANNEL_ID");
  const messages = `/channels/${channelId}/messages`;
  // The channel is the only delivery state, so the consumer can run again from anywhere.
  const sent = history
    .parse(await discord({ method: "GET", path: `${messages}?limit=100` }))
    .flatMap((message) => message.embeds.flatMap((entry) => entry.description ?? []));
  for (const day of days) {
    // Any link of the day counts, so correcting one line never sends the day again.
    if (day.items.some((item) => sent.some((text) => text.includes(`(${item.url})`)))) {
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
