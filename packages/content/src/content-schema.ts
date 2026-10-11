import { z } from "zod";

export const topicSchema = z.enum(["ia", "desarrollo", "videojuegos"]);
export const postMetadata = z.strictObject({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(220),
  date: z.iso.date(),
  kind: z.enum(["articulo", "noticia"]),
  topic: topicSchema,
  author: z.string().min(1).default("ai-es"),
  icon: z.enum(["03", "04", "05", "06", "07", "08"]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});
const newsText = /^[^[\]\\\r\n]+$/;
export const newsDay = z.strictObject({
  date: z.iso.date(),
  items: z
    .array(
      z.strictObject({
        // Both fields are written raw into the Markdown exports, so they cannot carry link syntax.
        subject: z.string().trim().min(1).max(40).regex(newsText),
        fact: z.string().trim().min(1).max(120).regex(newsText),
        url: z.string().regex(/^https:\/\/x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/),
      }),
    )
    .min(1)
    .max(8)
    .refine((items) => new Set(items.map((item) => item.url)).size === items.length),
});
