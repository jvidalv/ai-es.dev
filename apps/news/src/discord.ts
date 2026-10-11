import { parseNewsDay } from "@ai-es/content/news";
import { z } from "zod";
import { alert, discord, discordConfig } from "./discord-api.ts";
import { renderEmbed } from "./embed.ts";
import { log, publishedRecord, today } from "./repo.ts";

const history = z.array(
  z.object({ embeds: z.array(z.object({ description: z.string().optional() })).default([]) }),
);
const dryRun = process.argv.includes("--dry-run");
const date = process.argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) ?? today();

async function publish() {
  const source = await publishedRecord(date);
  const day = source ? parseNewsDay({ source, date }) : null;
  const first = day?.items[0]?.url;
  if (!day || !first) {
    log(`Sin registro de ${date} en main; nada que publicar en Discord`);
    return;
  }
  const messages = `/channels/${discordConfig().NEWS_CHANNEL_ID}/messages`;
  // The channel is the only delivery state: a day whose first link is there was already sent.
  const sent = history
    .parse(await discord({ method: "GET", path: `${messages}?limit=50` }))
    .some((message) => message.embeds.some((entry) => entry.description?.includes(first)));
  if (sent) {
    log(`El resumen de ${date} ya está en Discord`);
    return;
  }
  const embed = renderEmbed(day);
  if (dryRun) {
    console.log(JSON.stringify(embed, null, 2));
    return;
  }
  await discord({
    method: "POST",
    path: messages,
    body: { embeds: [embed], allowed_mentions: { parse: [] } },
  });
  log(`Resumen de ${date} publicado en Discord`);
}

try {
  await publish();
} catch (error) {
  const message = `el consumidor de Discord falló: ${String(error)}`.slice(0, 600);
  log(`ERROR: ${message}`);
  if (!dryRun) await alert(message);
  process.exitCode = 1;
}
