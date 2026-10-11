import { dayLabel, newsSentence } from "@ai-es/content/news-text";
import type { NewsDay } from "@ai-es/content/types";

export function renderEmbed(day: NewsDay) {
  return {
    author: { name: "RESUMEN DEL DÍA" },
    title: dayLabel(day.date),
    description: day.items
      .map((item) => `• **[${item.subject}](${item.url})** ${newsSentence(item.fact)}`)
      .join("\n"),
    color: 0xe5bb6f,
    footer: { text: "Fuente: posts en X" },
  };
}
