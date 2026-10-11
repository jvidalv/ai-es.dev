import { z } from "zod";

const postUrl = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/;
const embed = z.object({ author_url: z.string() });

// X's public oEmbed confirms the post exists and belongs to the account named in the URL.
// It returns null for a post that fails that check and throws when X itself does not answer.
export async function verifyPost(url: string) {
  const match = postUrl.exec(url.trim());
  const handle = match?.[1];
  const id = match?.[2];
  if (!handle || !id) return null;
  const query = encodeURIComponent(`https://twitter.com/${handle}/status/${id}`);
  const response = await fetch(`https://publish.twitter.com/oembed?omit_script=1&url=${query}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 429 || response.status >= 500) {
    throw new Error(`oEmbed respondió ${response.status}`);
  }
  if (!response.ok) return null;
  const data: unknown = await response.json();
  const parsed = embed.safeParse(data);
  if (!parsed.success) return null;
  const author = parsed.data.author_url.replace(/\/+$/, "").split("/").at(-1);
  if (!author || author.toLowerCase() !== handle.toLowerCase()) return null;
  return `https://x.com/${author}/status/${id}`;
}
