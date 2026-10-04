import { createElement } from "react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderToString } from "react-dom/server";
import { App } from "../src/app.tsx";
import { posts } from "../src/generated/content.ts";
import { site, topics, postPath, routes, topicPath } from "../src/lib/site.ts";

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char,
  );
const pages = [
  ...Object.values(routes),
  ...Object.entries(topics).map(([key, topic]) => ({
    path: topicPath(key),
    title: `${topic.name} · ai-es`,
    description: topic.description,
  })),
  ...posts.map((post) => ({
    path: postPath(post),
    title: `${post.title} · ai-es`,
    description: post.description,
  })),
];
const template = await readFile("dist/index.html", "utf8");
for (const marker of ["<!--seo-->", '<div id="root"></div>']) {
  if (!template.includes(marker)) throw new Error(`Missing HTML template marker: ${marker}`);
}
const markdownPages: { path: string; title: string; description: string; markdown: string }[] = [];
for (const page of [
  ...pages,
  {
    path: "/404.html",
    title: "Página no encontrada · ai-es",
    description: "Esta página no está disponible. Vuelve a la comunidad ai-es.",
  },
]) {
  const url = `${site.origin}${page.path}`;
  const isHome = page.path === routes.home.path;
  const isNotFound = page.path === "/404.html";
  const post = posts.find((entry) => postPath(entry) === page.path);
  const structured = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: `${post.date}T12:00:00Z`,
        author:
          post.author === site.name
            ? { "@type": "Organization", name: post.author, url: site.origin }
            : { "@type": "Person", name: post.author },
        publisher: { "@type": "Organization", name: site.name, url: site.origin },
        mainEntityOfPage: url,
        inLanguage: "es",
        image: `${site.origin}/images/ai-es-${post.icon}-1024.png`,
      }
    : {
        "@context": "https://schema.org",
        "@type": isHome
          ? "WebSite"
          : page.path === routes.community.path
            ? "AboutPage"
            : "CollectionPage",
        name: isHome ? site.name : page.title,
        url,
        inLanguage: "es",
        description: page.description,
      };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: site.origin },
      ...(post
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${site.origin}/blog/`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: post ? 3 : 2,
        name: post?.title ?? page.title,
        item: url,
      },
    ],
  };
  const jsonLd = JSON.stringify(isHome ? [structured] : [structured, breadcrumb]);
  const seo = `<meta name="description" content="${escape(page.description)}" />
    ${isNotFound ? '<meta name="robots" content="noindex" />' : `<meta name="robots" content="max-image-preview:large" /><link rel="canonical" href="${escape(url)}" /><link rel="alternate" type="text/markdown" href="${escape(url)}index.md" />`}
    <link rel="describedby" href="/llms.txt" />
    <meta property="og:title" content="${escape(page.title)}" />
    <meta property="og:description" content="${escape(page.description)}" />
    <meta property="og:type" content="${post ? "article" : "website"}" />
    <meta property="og:url" content="${escape(url)}" />
    <meta property="og:image" content="${site.origin}${post ? `/images/ai-es-${post.icon}-1024.png` : site.socialImage}" />
    <meta property="og:image:alt" content="${escape(post ? `Ilustración de ${post.title}` : site.headline)}" />
    <meta property="og:image:width" content="${post ? 1024 : site.socialImageWidth}" />
    <meta property="og:image:height" content="${post ? 1024 : site.socialImageHeight}" />
    <meta name="twitter:image" content="${site.origin}${post ? `/images/ai-es-${post.icon}-1024.png` : site.socialImage}" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:site_name" content="ai-es" />
    <meta name="twitter:card" content="${post ? "summary" : "summary_large_image"}" />
    <meta name="twitter:title" content="${escape(page.title)}" />
    <meta name="twitter:description" content="${escape(page.description)}" />
    ${isNotFound ? "" : `<script type="application/ld+json">${jsonLd.replace(/</g, "\\u003c")}</script>`}`;
  const html = template
    .replace(/<title>.*?<\/title>/, () => `<title>${escape(page.title)}</title>`)
    .replace("<!--seo-->", () => seo)
    .replace(
      '<div id="root"></div>',
      () => `<div id="root">${renderToString(createElement(App, { path: page.path }))}</div>`,
    );
  const file = isNotFound ? "dist/404.html" : join("dist", page.path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  if (!isNotFound) {
    const selectedPosts = posts.filter(
      (entry) => !page.path.startsWith("/temas/") || page.path === topicPath(entry.topic),
    );
    const content = post
      ? post.markdown
      : `${page.description}\n\n## Comunidad\n\n- [Discord](${site.discord})\n- [Reddit](${site.reddit})\n\n## Publicaciones\n\n${selectedPosts.map((entry) => `- [${entry.title}](${site.origin}${postPath(entry)}index.md): ${entry.description}`).join("\n")}`;
    const markdown = `# ${post?.title ?? page.title}\n\nFuente: ${url}\nIdioma: español\n${post ? `Autor: ${post.author}\nPublicado: ${post.date}\n` : ""}\n${content}\n`;
    await writeFile(join(dirname(file), "index.md"), markdown);
    markdownPages.push({
      path: page.path,
      title: page.title,
      description: page.description,
      markdown,
    });
  }
}
await writeFile(
  "dist/llms.txt",
  `# ai-es\n\n> ${site.description}\n\nSomos una comunidad hispanohablante interesada en estos temas.\n\n## Páginas\n\n${markdownPages.map((page) => `- [${page.title}](${site.origin}${page.path}index.md): ${page.description}`).join("\n")}\n\n## Optional\n\n- [Contenido completo](${site.origin}/llms-full.txt): Copia en Markdown de las páginas públicas.\n- [RSS](${site.origin}/feed.xml): Publicaciones.\n- [Sitemap](${site.origin}/sitemap.xml): URLs canónicas.\n`,
);
await writeFile("dist/llms-full.txt", markdownPages.map((page) => page.markdown).join("\n---\n\n"));
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<url><loc>${escape(`${site.origin}${page.path}`)}</loc></url>`).join("")}</urlset>`,
);
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`,
);
await writeFile(
  "dist/feed.xml",
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>ai-es</title><link>${site.origin}</link><description>${escape(site.description)}</description><language>es</language>${posts.map((post) => `<item><title>${escape(post.title)}</title><link>${site.origin}${postPath(post)}</link><guid>${site.origin}${postPath(post)}</guid><description>${escape(post.description)}</description><pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`,
);
console.log(`Pre-rendered ${pages.length} pages, 404, sitemap, robots.txt and RSS feed.`);
