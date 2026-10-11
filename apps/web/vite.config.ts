import { resolve, sep } from "node:path";
import { postsDirectory } from "@ai-es/content/loader";
import { newsDirectory } from "@ai-es/content/news";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { generateContent } from "./scripts/generate-content.ts";

const sources = [
  { directory: postsDirectory, extension: ".md" },
  { directory: newsDirectory, extension: ".json" },
];
export default defineConfig({
  plugins: [
    react(),
    {
      name: "generated-content",
      async configureServer(server) {
        await generateContent();
        server.watcher.add(sources.map(({ directory }) => directory));
        server.watcher.on("all", (event, file) => {
          if (
            ["add", "change", "unlink"].includes(event) &&
            sources.some(
              ({ directory, extension }) =>
                resolve(file).startsWith(resolve(directory) + sep) && file.endsWith(extension),
            )
          ) {
            void generateContent().catch((error) => server.config.logger.error(String(error)));
          }
        });
      },
    },
  ],
});
