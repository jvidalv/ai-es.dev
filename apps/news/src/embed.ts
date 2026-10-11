import { dayLabel, newsSentence } from "@ai-es/content/news-text";
import type { NewsDay } from "@ai-es/content/types";

// The text comes from posts on X: Discord formatting characters must show as typed.
const plain = (text: string) => text.replace(/[*_`~|<>]/g, "\\$&");

export function renderEmbed(day: NewsDay) {
  return {
    author: { name: "RESUMEN DEL DÍA" },
    title: dayLabel(day.date),
    description: day.items
      .map(
        (item) => `• **[${plain(item.subject)}](${item.url})** ${plain(newsSentence(item.fact))}`,
      )
      .join("\n"),
    color: 0xe5bb6f,
    footer: { text: "Fuente: posts en X" },
  };
}

// Any link of the day counts, so correcting one line of a record never sends the day again.
export function isSent({ day, texts }: { day: NewsDay; texts: string[] }) {
  return day.items.some((item) => texts.some((text) => text.includes(`(${item.url})`)));
}
