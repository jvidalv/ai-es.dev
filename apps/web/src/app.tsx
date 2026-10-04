import React from "react";
import { ArrowUpRight, ArrowRight, Menu, X, Moon, Sun, ChevronRight, Rss } from "lucide-react";
import { SocialIcon } from "./components/social-icon";
import { BotFx, GameFx, MonitorFx } from "./components/sticker-fx";
import { YoutubeEmbed } from "./components/youtube-embed";
import { posts } from "./generated/content";
import { site, topics, postPath, dateLabel, routes, topicPath, isTopic } from "./lib/site";
import type { Post, Topic } from "@ai-es/content/types";

function Illustration({ icon, className = "" }: { icon: Post["icon"]; className?: string }) {
  return (
    <img
      className={className}
      src={`/images/ai-es-${icon}-256.png`}
      srcSet={`/images/ai-es-${icon}-256.png 256w, /images/ai-es-${icon}-1024.png 1024w`}
      sizes="(max-width: 640px) 150px, 256px"
      width="256"
      height="256"
      alt=""
      loading="lazy"
      decoding="async"
    />
  );
}
function ThemeToggle() {
  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ai-es-theme", theme);
    } catch {
      /* Theme still works without storage. */
    }
  }
  return (
    <button
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      aria-label="Cambiar entre tema claro y oscuro"
    >
      <Moon className="moon" size={19} />
      <Sun className="sun" size={19} />
    </button>
  );
}
function Header({ path }: { path: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="/" aria-label="ai-es · Inicio">
          <img src="/images/ai-es-03-64.png" width="42" height="42" alt="" />
          <span>
            ai-es<span className="brand-dot">.</span>
          </span>
        </a>
        <nav
          id="main-nav"
          className={open ? "navigation is-open" : "navigation"}
          aria-label="Navegación principal"
        >
          {Object.values(routes).map(({ path: href, label }) => (
            <a key={href} href={href} aria-current={path === href ? "page" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a
            className="button button-small header-join"
            href={site.discord}
            target="_blank"
            rel="noreferrer"
          >
            Pasar por Discord <ArrowUpRight size={16} />
          </a>
          <button
            className="icon-button menu-toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
function JoinCommunity() {
  return (
    <section className="community-panel container">
      <div className="community-art">
        <Illustration icon="04" />
      </div>
      <div className="community-copy">
        <h2>¿Charlamos?</h2>
        <div className="button-row">
          <a className="button" href={site.discord} target="_blank" rel="noreferrer">
            <SocialIcon kind="discord" /> Discord <ArrowUpRight size={17} />
          </a>
          <a className="text-link" href={site.reddit} target="_blank" rel="noreferrer">
            <SocialIcon kind="reddit" /> Reddit <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="site-footer container">
      <div className="footer-top">
        <a className="brand" href="/">
          <img src="/images/ai-es-03-64.png" width="36" height="36" alt="" />
          <span>
            ai-es<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="footer-links">
          <a href={site.github}>
            <SocialIcon kind="github" /> GitHub <ArrowUpRight size={13} />
          </a>
          <a href={site.reddit}>
            <SocialIcon kind="reddit" /> Reddit <ArrowUpRight size={13} />
          </a>
          <a href="/feed.xml">
            <Rss size={14} /> RSS
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ai-es.</span>
      </div>
    </footer>
  );
}
function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <a
      className={`post-card ${post.topic}${featured ? " featured-card" : ""}`}
      href={postPath(post)}
    >
      <div className="card-art" aria-hidden="true">
        <div className="art-orbit" />
        <span className="art-star">✦</span>
        <Illustration icon={post.icon} />
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className={`tag tag-${post.topic}`}>
            {post.kind === "noticia" ? "Comunidad" : topics[post.topic].name}
          </span>
          <span>{`${post.minutes} min de lectura`}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <div className="card-bottom">
          <span>{dateLabel(post.date)}</span>
          <ArrowUpRight size={21} />
        </div>
      </div>
    </a>
  );
}
function Home() {
  const articles = posts;
  const featured = articles.find((post) => post.featured) ?? articles[0];
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <h1>
            Desarrollo de
            <br />
            software y videojuegos
            <br />
            <span className="hand-underline">con IA.</span>
          </h1>
          <p>
            {site.tagline} {site.invitation}
          </p>
          <div className="button-row">
            <a className="button" href={site.discord} target="_blank" rel="noreferrer">
              <SocialIcon kind="discord" /> Pasar por Discord <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit " />
          <div className="orbit orbit-two" />
          <div className="dot-field" />
          <span className="hero-spark spark-one">✦</span>
          <span className="hero-spark spark-two">✧</span>
          <span className="hero-wire wire-software" />
          <span className="hero-wire wire-games" />
          <span className="hero-wire wire-ia" />
          <div className="sticker sticker-monitor">
            <Illustration icon="08" />
            <MonitorFx />
          </div>
          <div className="sticker sticker-bot">
            <Illustration icon="03" />
            <BotFx />
          </div>
          <div className="sticker sticker-game">
            <Illustration icon="05" />
            <GameFx />
          </div>
          <span className="hero-spark hero-relay">✦</span>
          <span className="hero-spark hero-relay relay-trail">✦</span>
          <span className="hero-spark hero-relay relay-trail-far">✦</span>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <h2>Notas, guías y alguna novedad.</h2>
          </div>
          <a className="text-link" href="/blog/">
            Todos los artículos <ArrowRight size={18} />
          </a>
        </div>
        <div className="home-post-grid">
          {featured && <PostCard post={featured} featured />}
          {articles
            .filter((post) => post !== featured)
            .slice(0, 2)
            .map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
        </div>
      </section>
      <section className="topic-section container">
        <div className="section-heading">
          <div>
            <h2>¿En qué andas?</h2>
          </div>
        </div>
        <div className="topic-grid">
          {Object.entries(topics).map(([key, topic]) => (
            <a className="topic-item" href={topicPath(key)} key={key}>
              <Illustration icon={topic.icon} />
              <div>
                <h3>{topic.name}</h3>
                <p>{topic.description}</p>
                <span className="text-link">
                  Explorar <ArrowRight size={17} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <JoinCommunity />
    </>
  );
}
function Listing({ topic }: { topic?: Topic }) {
  const [filter, setFilter] = React.useState("todos");
  const topicInfo = topic ? topics[topic] : undefined;
  const title = topicInfo?.name ?? "Lo que vamos aprendiendo.";
  const description = topicInfo?.description ?? routes.blog.description;
  const matching = posts.filter(
    (post) => (!topic || post.topic === topic) && (filter === "todos" || post.topic === filter),
  );
  return (
    <>
      <section className="page-intro container">
        <a className="breadcrumb" href="/">
          Inicio <ChevronRight size={14} />
        </a>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="container">
        {!topic && (
          <div className="filters" role="group" aria-label="Filtrar por tema">
            {[
              ["todos", "Todo"],
              ["ia", topics.ia.name],
              ["desarrollo", topics.desarrollo.name],
              ["videojuegos", topics.videojuegos.name],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <p className="result-count" role="status">
          {matching.length} {matching.length === 1 ? "publicación" : "publicaciones"}
        </p>
        <div className="listing-grid">
          {matching.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        {matching.length === 0 && (
          <div className="empty-state">
            <Illustration icon="06" />
            <h2>Todavía no hay nada por aquí.</h2>
            <p>
              Todavía no hay publicaciones de este tema. Comparte tus sugerencias en la comunidad.
            </p>
            <a className="text-link" href={site.discord}>
              Proponer un recurso <ArrowUpRight size={17} />
            </a>
          </div>
        )}
      </section>
      <JoinCommunity />
    </>
  );
}
function Article({ post }: { post: Post }) {
  return (
    <>
      <article className="article container">
        <a className="breadcrumb" href="/blog/">
          <ArrowRight className="back-arrow" size={16} /> Volver al blog
        </a>
        <div className="article-heading">
          <a className={`tag tag-${post.topic}`} href={topicPath(post.topic)}>
            {topics[post.topic].name}
          </a>
          <h1>{post.title}</h1>
          <p className="article-description">{post.description}</p>
          <div className="article-byline">
            <img src="/images/ai-es-03-64.png" width="35" height="35" alt="" />
            <span>{post.author}</span>
            <span>·</span>
            <time dateTime={post.date}>{dateLabel(post.date)}</time>
            <span>·</span>
            <span>{post.minutes} min de lectura</span>
          </div>
        </div>
        <div className={`article-cover ${post.topic}`}>
          <Illustration icon={post.icon} />
          <span className="cover-star">✦</span>
        </div>
        <div className="prose">
          {post.blocks.map((block, index) =>
            block.type === "youtube" ? (
              <YoutubeEmbed key={index} id={block.id} title={block.title} />
            ) : (
              <div key={index} dangerouslySetInnerHTML={{ __html: block.html }} />
            ),
          )}
        </div>
        <div className="article-end">
          <h2>¿Lo has probado? Cuéntanos.</h2>
          <p>Comparte lo que has aprendido o enséñanos tu proyecto.</p>
          <a className="button" href={site.discord}>
            Hablemos en Discord <ArrowUpRight size={17} />
          </a>
        </div>
      </article>
      <section className="container related-section">
        <div className="section-heading">
          <h2>Sigue explorando.</h2>
        </div>
        <div className="listing-grid">
          {posts
            .filter((other) => other.slug !== post.slug)
            .slice(0, 3)
            .map((other) => (
              <PostCard key={other.slug} post={other} />
            ))}
        </div>
      </section>
    </>
  );
}
function Community() {
  return (
    <>
      <section className="page-intro container community-intro">
        <h1>Una comunidad hispanohablante.</h1>
        <p>{site.description}</p>
        <Illustration icon="04" />
      </section>
      <div className="community-destinations container">
        <a href={site.discord} className="destination">
          <SocialIcon kind="discord" />
          <h2>Nos vemos en Discord.</h2>
          <p>Para preguntar, compartir avances y charlar.</p>
          <span className="text-link">
            Pasar por Discord <ArrowUpRight size={19} />
          </span>
        </a>
        <a href={site.reddit} className="destination">
          <SocialIcon kind="reddit" />
          <h2>También estamos en Reddit.</h2>
          <p>
            Publica tu proyecto, comparte un recurso o abre una conversación a la que podamos
            volver.
          </p>
          <span className="text-link">
            Visitar r/ai_es <ArrowUpRight size={19} />
          </span>
        </a>
      </div>
      <section className="community-values container">
        <h2>Un par de cosas.</h2>
        <div className="values-grid">
          <div>
            <span>01</span>
            <h3>Comparte el proceso.</h3>
            <p>Lo que falló también enseña. No necesitas un proyecto terminado para participar.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Haz espacio a los demás.</h3>
            <p>
              Pregunta con contexto, da feedback constructivo y recuerda que todos empezamos alguna
              vez.
            </p>
          </div>
          <div>
            <span>03</span>
            <h3>Crea con criterio.</h3>
            <p>
              Revisa lo que genera la IA, respeta las licencias y reconoce el trabajo de otras
              personas.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
export function App({ path }: { path: string }) {
  const normalized = path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;
  const post = posts.find((entry) => postPath(entry) === normalized);
  const topic = Object.keys(topics).find((key) => topicPath(key) === normalized);
  let page;
  if (normalized === routes.home.path) page = <Home />;
  else if (normalized === routes.blog.path) page = <Listing />;
  else if (normalized === routes.community.path) page = <Community />;
  else if (post) page = <Article post={post} />;
  else if (isTopic(topic)) page = <Listing topic={topic} />;
  else
    page = (
      <section className="container empty-state not-found">
        <Illustration icon="07" />
        <span className="eyebrow">404 · PÁGINA NO ENCONTRADA</span>
        <h1>Por aquí no hay nada.</h1>
        <p>La página que buscas no está aquí. Volvamos a un lugar conocido.</p>
        <a className="button" href="/">
          Volver al inicio <ArrowRight size={18} />
        </a>
      </section>
    );
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Header path={normalized} />
      <main id="contenido">{page}</main>
      <Footer />
    </>
  );
}
