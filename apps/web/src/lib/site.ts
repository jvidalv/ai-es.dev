import type { Post, Topic } from "@ai-es/content/types";

export const site = {
  name: "ai-es",
  headline: "Desarrollo de software y videojuegos con IA.",
  tagline: "Somos una comunidad hispanohablante.",
  invitation: "Un lugar para compartir dudas, recursos y proyectos.",
  socialImageWidth: 1200,
  socialImageHeight: 630,
  socialImage: "/images/og-development.png",
  origin: "https://ai-es.dev",
  description:
    "Comunidad hispanohablante interesada en el desarrollo de software y videojuegos con IA. Un lugar para compartir dudas, recursos y proyectos.",
  discord: "https://discord.gg/U9F4b9avV5",
  reddit: "https://www.reddit.com/r/ai_es/",
  github: "https://github.com/jvidalv/ai-es.dev",
};

export const topics: Record<Topic, { name: string; description: string; icon: Post["icon"] }> = {
  ia: {
    name: "Inteligencia artificial",
    description: "Herramientas, pruebas y cosas que estamos aprendiendo.",
    icon: "03",
  },
  desarrollo: {
    name: "Desarrollo de software",
    description: "Aplicaciones, webs y código que nos hace la vida más fácil.",
    icon: "08",
  },
  videojuegos: {
    name: "Desarrollo de videojuegos",
    description: "Prototipos, motores y juegos a medio hacer.",
    icon: "05",
  },
};

export function postPath(post: Pick<Post, "slug">) {
  return `/blog/${post.slug}/`;
}

const dateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export function dateLabel(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

export const routes = {
  home: {
    path: "/",
    label: "Inicio",
    title: "ai-es · Comunidad de desarrollo de software y videojuegos con IA",
    description: site.description,
  },
  blog: {
    path: "/blog/",
    label: "Blog",
    title: "Blog de IA y desarrollo en español · ai-es",
    description: "Apuntes y guías sobre desarrollo de software y videojuegos con IA.",
  },
  news: {
    path: "/noticias/",
    label: "Noticias",
    title: "Noticias de IA · ai-es",
    description:
      "Resumen diario de noticias de IA para desarrollo de software y videojuegos. Lo prepara un bot a partir de posts en X y cada línea enlaza al original.",
  },
  community: {
    path: "/comunidad/",
    label: "Comunidad",
    title: "Comunidad hispanohablante de IA y desarrollo · ai-es",
    description:
      "Una comunidad hispanohablante interesada en el desarrollo de software y videojuegos con IA. Nos encontramos en Discord y Reddit.",
  },
};
export function topicPath(topic: string) {
  return `/temas/${topic}/`;
}
export function isTopic(value: string | undefined): value is Topic {
  return value !== undefined && Object.hasOwn(topics, value);
}
