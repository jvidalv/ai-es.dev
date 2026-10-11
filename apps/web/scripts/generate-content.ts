import { mkdir, writeFile } from "node:fs/promises";
import { readPosts } from "@ai-es/content/loader";
import { readNews } from "@ai-es/content/news";

// Every day kept here ships in the client bundle; older files stay in the repository only.
const recentNewsDays = 30;

export async function generateContent() {
  const [posts, news] = await Promise.all([readPosts(), readNews()]);
  const directory = new URL("../src/generated/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("content.ts", directory),
    `// Generated from packages/content. Do not edit.\nimport type { NewsDay, Post } from '@ai-es/content/types';\nexport const posts: Post[] = ${JSON.stringify(posts, null, 2)};\nexport const news: NewsDay[] = ${JSON.stringify(news.slice(0, recentNewsDays), null, 2)};\n`,
  );
}

if (import.meta.main) await generateContent();
