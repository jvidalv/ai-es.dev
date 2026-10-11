import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";

// GitHub Actions passes an unset variable as an empty string, so empty means absent.
const id = z.string().regex(/^\d*$/);
const env = z.object({
  DISCORD_TOKEN: z.string().min(1),
  NEWS_CHANNEL_ID: id.optional(),
  NEWS_ALERT_USER_ID: id.optional(),
});
const rateLimit = z.object({ retry_after: z.number() });
const channel = z.object({ id: z.string() });

export function discordConfig() {
  return env.parse(process.env);
}

export async function discord({
  method,
  path,
  body,
}: {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
}): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
      method,
      headers: {
        Authorization: `Bot ${discordConfig().DISCORD_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (https://ai-es.dev, 1)",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429 && attempt < 2) {
      const data: unknown = await response.json();
      const wait = rateLimit.safeParse(data);
      await sleep(((wait.success ? wait.data.retry_after : 2) + 0.5) * 1000);
      continue;
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      throw new Error(`Discord ${method} ${path}: ${response.status} ${detail}`);
    }
    return response.status === 204 ? null : response.json();
  }
}

// A failed alert must never hide the error that caused it.
export async function alert(message: string) {
  try {
    const recipient = discordConfig().NEWS_ALERT_USER_ID;
    if (!recipient) throw new Error("falta NEWS_ALERT_USER_ID");
    const dm = channel.parse(
      await discord({
        method: "POST",
        path: "/users/@me/channels",
        body: { recipient_id: recipient },
      }),
    );
    await discord({
      method: "POST",
      path: `/channels/${dm.id}/messages`,
      body: {
        content: `⚠️ Noticias IA (AI-ES): ${message.slice(0, 1800)}`,
        allowed_mentions: { parse: [] },
      },
    });
  } catch (error) {
    console.error(`No se pudo avisar por DM: ${String(error)}`);
  }
}
