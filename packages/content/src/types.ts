import type { z } from "zod";
import type { newsDay, postMetadata, topicSchema } from "./content-schema.ts";

export type Topic = z.infer<typeof topicSchema>;
export type Post = Omit<z.infer<typeof postMetadata>, "draft"> & {
  slug: string;
  blocks: ContentBlock[];
  markdown: string;
  minutes: number;
};

export type NewsDay = z.infer<typeof newsDay>;

export type ContentBlock =
  | { type: "html"; html: string }
  | { type: "youtube"; id: string; title: string };
