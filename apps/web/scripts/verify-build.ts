import assert from "node:assert/strict";
import { globSync, existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { posts } from "../src/generated/content.ts";
import { postPath, site } from "../src/lib/site.ts";

const htmlFiles = globSync("dist/**/*.html");
assert.ok(htmlFiles.length > 1, "Expected pre-rendered pages");
const titles = new Set<string>();
const canonicalUrls = new Set<string>();
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  assert.ok(title, `${file}: missing title`);
  assert.ok(!titles.has(title), `${file}: duplicate title`);
  titles.add(title);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, `${file}: expected one H1`);
  assert.ok(html.includes('name="description"'), `${file}: missing description`);
  if (file.endsWith("404.html")) {
    assert.ok(html.includes("noindex"));
    assert.ok(!html.includes("application/ld+json"), "404 must not describe indexable content");
  } else {
    const path = relative("dist", file).replace(/index\.html$/, "");
    const canonical = `${site.origin}/${path}`;
    canonicalUrls.add(canonical);
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${file}: incorrect canonical`);
    const markdown = readFileSync(join(dirname(file), "index.md"), "utf8");
    assert.ok(markdown.includes(`Fuente: ${canonical}\n`), `${file}: incorrect Markdown source`);
    assert.ok(
      html.includes(`type="text/markdown" href="${canonical}index.md"`),
      `${file}: missing Markdown discovery`,
    );
    const json = /<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1];
    assert.ok(json, `${file}: missing structured data`);
    const parsed: unknown = JSON.parse(json);
    assert.ok(Array.isArray(parsed), `${file}: invalid structured data`);
    const entries: unknown[] = parsed;
    const types = new Set<unknown>();
    for (const entry of entries) {
      assert.ok(typeof entry === "object" && entry !== null && "@type" in entry);
      types.add(entry["@type"]);
      if (entry["@type"] === "WebSite") {
        assert.ok(
          "name" in entry && entry.name === site.name,
          "Use the community name, not the page title",
        );
        assert.ok("url" in entry && entry.url === `${site.origin}/`);
      }
      if (entry["@type"] === "BreadcrumbList") {
        assert.ok(
          "itemListElement" in entry &&
            Array.isArray(entry.itemListElement) &&
            entry.itemListElement.length >= 2,
          `${file}: incomplete breadcrumb`,
        );
      }
    }
    const expectedType = path === "" ? "WebSite" : "BreadcrumbList";
    assert.ok(types.has(expectedType), `${file}: missing ${expectedType}`);
  }
  const socialImage = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
  assert.ok(socialImage, `${file}: missing social image`);
  const imageUrl = new URL(socialImage);
  assert.equal(imageUrl.origin, site.origin, `${file}: unexpected social image origin`);
  const imageBytes = readFileSync(join("dist", imageUrl.pathname));
  assert.equal(imageBytes.subarray(1, 4).toString(), "PNG", `${file}: social image is not PNG`);
  const width = Number(/property="og:image:width" content="(\d+)"/.exec(html)?.[1]);
  const height = Number(/property="og:image:height" content="(\d+)"/.exec(html)?.[1]);
  assert.equal(imageBytes.readUInt32BE(16), width, `${file}: social image width mismatch`);
  assert.equal(imageBytes.readUInt32BE(20), height, `${file}: social image height mismatch`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
    const url = match[1];
    if (!url || url.startsWith("//")) continue;
    const path = resolve("dist", `.${url}`);
    assert.ok(existsSync(path), `${file}: broken internal link or asset ${url}`);
  }
}
const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const llms = readFileSync("dist/llms-full.txt", "utf8");
const feed = readFileSync("dist/feed.xml", "utf8");
const llmsIndex = readFileSync("dist/llms.txt", "utf8");
const publicUrls = [...canonicalUrls].toSorted();
const captured = (text: string, pattern: RegExp) =>
  [...text.matchAll(pattern)].map((match) => match[1]).toSorted();
assert.deepEqual(
  captured(sitemap, /<loc>([^<]+)<\/loc>/g),
  publicUrls,
  "Sitemap must contain exactly the canonical pages",
);
assert.deepEqual(
  captured(llms, /^# .+\n\nFuente: (.+)\nIdioma: /gm),
  publicUrls,
  "LLM content must contain exactly the public pages",
);
assert.deepEqual(
  captured(llmsIndex, /\]\((https:\/\/[^\s)]+)index\.md\)/g),
  publicUrls,
  "LLM index must contain exactly the public pages",
);
const postUrls = posts.map((post) => `${site.origin}${postPath(post)}`);
assert.deepEqual(
  captured(feed, /<guid>([^<]+)<\/guid>/g),
  postUrls.toSorted(),
  "RSS must contain exactly the published posts",
);
for (const url of postUrls) assert.ok(canonicalUrls.has(url), `${url}: missing page`);
console.log(
  `Verified ${htmlFiles.length} HTML files, internal targets, metadata, Markdown and feeds.`,
);
