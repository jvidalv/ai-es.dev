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
- `packages/content`: publicaciones Markdown, validación, tipos y lector de contenido. La web lo usa como `@ai-es/content` mediante `workspace:*`.
- `scripts`: comprobaciones del repositorio. Un solo `bun.lock` fija las dependencias.

Ejecutar los comandos desde la raíz:

```sh
bun install --frozen-lockfile
bun run hooks:install
bun run dev
```

La web se abre en `http://localhost:5173`. Los cambios en `packages/content/posts/` se regeneran durante el desarrollo. No editar `apps/web/src/generated/`.

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
- `index.md` junto a cada página, con su fuente canónica. Los enlaces del artículo conservan sus rutas originales, relativas a `https://ai-es.dev`. El HTML anuncia esta alternativa con `rel="alternate"` y `type="text/markdown"`.

No se bloquean rastreadores en robots.txt. `llms.txt` es una convención complementaria, no una garantía de indexación o aparición en respuestas. No se inventan fechas de actualización ni valoraciones para obtener resultados enriquecidos. Mantener el nombre del archivo al editar títulos para conservar la URL. Cambiar un slug requiere implementar una redirección en el servidor.

Después de conectar el dominio, verificarlo en Google Search Console y Bing Webmaster Tools y enviar `https://ai-es.dev/sitemap.xml`. Esto necesita acceso a las cuentas del propietario. Revisar el tráfico real antes de añadir analítica; actualmente no se instala seguimiento.

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
