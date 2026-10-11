<p align="center">
  <img src="apps/web/public/images/ai-es-banner-desktop-3200x384.png" alt="ai-es · Desarrollo de software y videojuegos con IA" width="100%" />
</p>

<h1 align="center">ai-es</h1>
<p align="center"><strong>Desarrollo de software y videojuegos con IA.</strong></p>
<p align="center">
  <a href="https://ai-es.dev">La web</a> ·
  <a href="https://discord.gg/U9F4b9avV5">Discord</a> ·
  <a href="https://www.reddit.com/r/ai_es/">Reddit</a> ·
  <a href="https://ai-es.dev/feed.xml">RSS</a>
</p>
<p align="center">
  <a href="https://github.com/jvidalv/ai-es.dev/actions/workflows/ci.yml"><img src="https://github.com/jvidalv/ai-es.dev/actions/workflows/ci.yml/badge.svg" alt="Quality gates" /></a>
</p>

Comunidad en español interesada en el desarrollo de software y videojuegos con IA. Para compartir pruebas, dudas y recursos.

- Web: https://ai-es.dev
- Discord: https://discord.gg/U9F4b9avV5
- Reddit: https://www.reddit.com/r/ai_es/

## Desarrollo

Bun 1.4.2 gestiona los workspaces, las dependencias y el servidor de producción. Node 24 ejecuta las herramientas de Vite+ 1.0. React y TypeScript estricto.

- `apps/web`: web, servidor, imágenes y generación de HTML y metadatos.
- `packages/content`: publicaciones Markdown, resúmenes diarios de noticias, validación, tipos y lector de contenido. La web lo usa como `@ai-es/content` mediante `workspace:*`.
- `apps/news`: generador del resumen diario de noticias de IA y consumidor que lo publica en Discord.
- `scripts`: comprobaciones del repositorio. Un solo `bun.lock` fija las dependencias.

Ejecutar los comandos desde la raíz:

```sh
bun install --frozen-lockfile
bun run hooks:install
bun run dev
```

La web se abre en `http://localhost:5173`. Los cambios en `packages/content/posts/` y `packages/content/news/` se regeneran durante el desarrollo. No editar `apps/web/src/generated/`.

```sh
bun run check:push-gates
bun run build
bun run start
```

Usar **`bun run build`**, no solo `vp build`: el script completo valida tipos, compila el cliente y genera HTML, Markdown, sitemap y feeds. Producción sirve `apps/web/dist/` en el puerto `PORT` (3000 por defecto). No requiere base de datos, secretos ni CMS.

## Publicar un artículo o una noticia

Crear un archivo en `packages/content/posts/mi-articulo.md`. El nombre en kebab-case será la URL. Puede hacerse directamente desde GitHub. Leer antes [la guía de escritura](docs/writing-style.md): conversación entre iguales, español cercano y sin tono comercial.

```md
---
title: "Lo que aprendí haciendo mi primer prototipo"
description: "Una descripción concreta del artículo para la lista y los buscadores."
date: "2026-10-01"
kind: articulo
topic: desarrollo
icon: "08"
author: "Tu nombre"
draft: true
---

El texto va aquí, en Markdown.

## Un apartado

También hay listas, enlaces, citas y bloques de código.
```

- `kind`: `articulo` o `noticia`.
- `topic`: `ia`, `desarrollo` o `videojuegos`.
- `icon`: `03` robot, `04` comunidad, `05` mando, `06` bombilla, `07` cohete, `08` ordenador.
- `featured: true` destaca un artículo en el inicio.
- `draft: true` excluye la publicación de **todos** los resultados públicos, incluidas las versiones para LLMs.
- Las fechas se escriben entre comillas en formato YYYY-MM-DD y se comparan con el día UTC. Una fecha futura también la excluye. Para publicarla hay que ejecutar un nuevo build a partir de esa fecha; no existe un programador automático.
- Los borradores también deben tener metadatos completos y válidos. Solo se admite front matter YAML; un campo desconocido bloquea el build para evitar publicar por una errata.
- Cambiar `draft` a `false` o eliminarlo y hacer merge a `main` publica la entrada cuando Railway termina el despliegue.
- El título, la descripción, la fecha y los vídeos incrustados se validan. Un error bloquea el build.

## Resumen diario de noticias de IA

Un generador escribe cada día un registro, `packages/content/news/AAAA-MM-DD.json`, y lo sube a `main`. Ese commit es la única fuente: la web y Discord lo leen por separado y ninguno depende del otro.

```text
generador (apps/news)      Grok busca en X, se verifica cada post y se valida el registro
        |                  commit de packages/content/news/AAAA-MM-DD.json
        v
      main
        |-- web: Railway reconstruye el sitio con el push
        '-- Discord: .github/workflows/news-discord.yml publica el resumen del día
```

El registro tiene esta forma:

```json
{
  "date": "2026-10-11",
  "items": [
    {
      "subject": "Cloudflare",
      "fact": "compra Deno para mejorar el modelo de programación de Workers",
      "url": "https://x.com/TechCrunch/status/2108957871644012892"
    }
  ]
}
```

- No escribir estos resúmenes a mano. Sí se puede corregir o borrar una línea equivocada: la web se actualiza con el commit. Discord no vuelve a publicar el día mientras conserve algún enlace de los que ya están en el canal, y el mensaje publicado no se edita.
- `subject` admite 40 caracteres y `fact` 120, en una sola línea y sin corchetes ni barras invertidas. La web añade el punto final si falta. `url` debe ser un post de `x.com` y no puede repetirse en el mismo día. El nombre del archivo debe coincidir con `date`. Un archivo inválido bloquea el build.
- La portada muestra los 3 últimos días y `/noticias/` los 30 más recientes. Los archivos anteriores se quedan en el repositorio.
- Cada día admite de 1 a 8 noticias.
- La ilustración de cada tarjeta depende del día de la semana: `apps/web/public/images/ai-es-news-{mon,tue,wed,thu,fri,sat,sun}.svg`, dibujadas con la paleta de `apps/web/src/lib/social-art.ts`.
- Un día con fecha futura no se publica, igual que los artículos. La fecha se compara con el día UTC.
- El resumen no entra en el RSS, que sigue siendo solo de publicaciones. Sí tiene su `index.md` y aparece en el sitemap y en `llms.txt`.

### Generador

`bun run news:generate` necesita la CLI `grok` con sesión iniciada, así que se ejecuta en el servidor que la tiene, desde un checkout de `main` con permiso de push. Actualiza el checkout y sube antes cualquier registro que una ejecución anterior no pudo publicar. No genera nada si el registro del día ya existe. Descarta los posts que no puede verificar o que ya salieron en los 14 registros anteriores, valida el registro con el mismo lector que usa el build y hace commit y push. La verificación confirma que el post existe y es de esa cuenta; no comprueba que el resumen sea fiel al post. Si no queda ninguna noticia, ese día no hay registro. `--dry-run` muestra el registro sin escribirlo.

```cron
0 9 * * * root cd /opt/ai-es.dev && flock -n /run/ai-es-news.lock timeout 1500 bun --env-file=/opt/ai-es-news/news.env run news:generate >>/var/log/ai-es-news.log 2>&1
```

### Consumidor de Discord

`bun run news:discord` lee de `origin/main` los registros de los 3 últimos días y publica los que falten en el canal, del más antiguo al más reciente. Para saber si un día falta mira los 100 últimos mensajes: si alguno de sus enlaces ya está, no lo publica. Por eso se puede lanzar varias veces y desde varios sitios sin duplicar, y un registro que llega tarde a `main` también se entrega.

- En GitHub Actions lo lanza `news-discord.yml` con cada push a `main` que toca `packages/content/news/`. Necesita el secreto `NEWS_DISCORD_TOKEN` y las variables `NEWS_CHANNEL_ID` y `NEWS_ALERT_USER_ID`. Sin el secreto, el workflow termina con un aviso y no publica.
- Mientras el repositorio no tenga ese secreto, el servidor del generador lanza el mismo comando después de generar.

Las variables están en [`apps/news/.env.example`](apps/news/.env.example). Si el generador o el consumidor fallan, avisan por mensaje directo a `NEWS_ALERT_USER_ID`.

## Imágenes

Subir las imágenes a `apps/web/public/images/posts/` y referenciarlas con una ruta que empiece por `/images/`. Escribir siempre un texto alternativo que describa la información de la imagen.

```md
![El personaje esquivando los obstáculos del prototipo](/images/posts/mi-juego.webp)
```

También se admiten imágenes HTTPS externas. Preferir archivos propios optimizados en WebP/AVIF para evitar depender de otros servidores. No subir capturas con datos privados. Las ilustraciones originales de ai-es están en `apps/web/public/images/`.

## YouTube dentro de cualquier publicación

Escribir esta directiva en su propio párrafo, separada por líneas en blanco:

```md
::youtube[Fundamentos del multijugador en Godot](https://www.youtube.com/watch?v=tK2ACXUGcrY)
```

Se muestra un reproductor que se activa al pulsar. Antes de ese clic no se descarga contenido de YouTube. El iframe utiliza `youtube-nocookie.com`, tiene título accesible y permite pantalla completa. Los enlaces `youtu.be`, `/watch`, `/shorts/` y `/embed/` se validan por host e identificador. Dentro de un bloque de código, la directiva se muestra como texto.

Los vídeos van dentro de los artículos; no hay una sección de vídeos independiente. Atribuir cada recurso y explicar qué ofrece, sin presentar vídeos externos como propios.

## SEO y acceso desde LLMs

Todas las rutas tienen HTML completo antes de ejecutar JavaScript. Cada página tiene título, descripción, URL canónica, metadatos Open Graph y datos estructurados. Los artículos incluyen fecha, autor y su ilustración. La imagen social general se genera en cada build desde `site.headline` y las ilustraciones originales; los metadatos de las páginas usan esa imagen. Hay páginas por tema y enlaces internos. Las rutas inexistentes devuelven **HTTP 404**, no una SPA con estado 200.

El build genera desde las mismas publicaciones visibles:

- `/sitemap.xml` y `/robots.txt`.
- `/feed.xml`, para lectores RSS.
- `/llms.txt`, índice breve en Markdown.
- `/llms-full.txt`, copia completa del contenido público.
- `index.md` junto a cada página, con su fuente canónica. El servidor usa esa fuente generada para la cabecera HTTP `Link` con `rel="canonical"`, que apunta al HTML. Los enlaces del artículo conservan sus rutas originales, relativas a `https://ai-es.dev`. El HTML anuncia esta alternativa con `rel="alternate"` y `type="text/markdown"`.

No se bloquean rastreadores en robots.txt. `llms.txt` es una convención complementaria, no una garantía de indexación o aparición en respuestas. No se inventan fechas de actualización ni valoraciones para obtener resultados enriquecidos. Mantener el nombre del archivo al editar títulos para conservar la URL. Cambiar un slug requiere implementar una redirección en el servidor.

La propiedad de dominio `ai-es.dev` está verificada en Google Search Console y el sitemap se envió el 4 de octubre de 2026. Consultar el [informe de sitemaps](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Aai-es.dev) para comprobar su lectura: la confirmación de envío no significa que Google lo haya procesado ni indexado. Si aparece un error, comprobar el acceso público a `/sitemap.xml` y `/robots.txt`, y usar la prueba de URL publicada de Search Console antes de cambiar DNS o volver a enviarlo. No hace falta reenviarlo con cada artículo; su URL se mantiene y el build actualiza el contenido.

El nombre `WebSite` es `ai-es`, separado del título de la portada; la página de comunidad usa `AboutPage`. Las páginas públicas permiten vistas previas grandes de imágenes. La página 404 no incluye datos estructurados y sus respuestas llevan `noindex`. El build comprueba que sitemap, RSS y fuentes LLM coinciden con las páginas y publicaciones generadas.

Google aplica los [principios habituales de SEO a sus funciones de IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); `llms.txt` no es un requisito ni una señal de posicionamiento de Google. Bing Webmaster Tools queda pendiente de configurar si se quiere utilizar. Revisar el tráfico real antes de añadir analítica; actualmente no se instala seguimiento.

## Railway y Cloudflare

Railway construye el Dockerfile y ejecuta `bun server.ts`. La imagen final solo contiene el servidor y la salida estática, corre como usuario sin privilegios y escucha en `0.0.0.0:$PORT`. El health check es `/`.

Mantener el directorio raíz de Railway en la raíz del repositorio: el Dockerfile necesita ambos workspaces y el lockfile. No establecer `apps/web` como raíz del servicio.

El proyecto Railway `ai-es.dev` tiene el servicio `web` conectado al repositorio `jvidalv/ai-es.dev`, rama `main`. Cada push a `main`, incluidos los cambios de artículos desde GitHub, inicia un despliegue automáticamente. Las pull requests ejecutan las comprobaciones de GitHub Actions.

Dominio: `ai-es.dev`. En Cloudflare, crear un CNAME `@` hacia el destino que muestra Railway; inicialmente usar DNS only para validar el certificado. No borrar registros de correo ni otros subdominios. El servicio usa `PORT=3000` y el dominio está asociado a ese mismo puerto.

## Reglas y comprobaciones

Ver [AGENTS.md](AGENTS.md). Se adaptaron de Berrus los gates de comentarios, configuración Vite, archivos modificados, commit y push. El gate de reglas valida nombres, imports, re-exports y escapes de tipos con el AST de TypeScript. Los hooks no reescriben archivos ni añaden cambios al índice.

`bun run check` genera el contenido y agrupa formato, lint y tipos. `bun run test` prueba la frontera de publicación, la limpieza de HTML y los vídeos. `bun run verify:build` comprueba HTML, metadatos y enlaces de la salida generada. GitHub Actions ejecuta gates, build y verificación en cada PR/push a main.

El estilo de los iconos sociales se dibuja con Canvas 2D en `apps/web/src/lib/social-art.ts`, siguiendo la paleta y las formas de Berrus. Los PNG facilitados por el propietario conservan su formato original. Las reacciones animadas de la portada son capas SVG en `apps/web/src/components/sticker-fx.tsx`, dibujadas encima de los PNG con esa misma paleta. El movimiento respeta `prefers-reduced-motion`.

El repositorio es público. No se concede una licencia de reutilización del código o las ilustraciones por el mero hecho de publicarlo; el propietario puede añadir la licencia que prefiera.
