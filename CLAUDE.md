# Contexto de ai-es

Leer también [AGENTS.md](AGENTS.md) para las reglas técnicas y [docs/writing-style.md](docs/writing-style.md) antes de escribir texto público.

## Qué somos

Somos una comunidad hispanohablante interesada en el desarrollo de software y videojuegos con IA. Nos une la curiosidad por estos temas. Puede participar alguien que empieza, alguien con experiencia o alguien que solo quiere leer.

No somos un estudio, una empresa de servicios ni un equipo que desarrolle productos en conjunto. No escribir «desarrollamos software y videojuegos» como si fuera nuestra actividad colectiva. No prometer formación, ayuda, resultados ni actividad que no se haya confirmado.

Hablar de «comunidad hispanohablante», sin delimitarla a España y Latinoamérica. Decir «desarrollo de videojuegos» cuando se presenta ese interés: «código y juegos» suena a una comunidad para jugar.

La presentación preferida es «Desarrollo de software y videojuegos con IA». Debajo: «Somos una comunidad hispanohablante». Son intereses de la comunidad, no una afirmación de que produzcamos software en conjunto.

## Cómo comunicamos

- Conversación entre iguales, en español sencillo. Sin tono corporativo, grandes lemas, frases de captación ni entusiasmo forzado.
- Poco texto. Una frase que explique el sitio y enlaces claros bastan. No añadir etiquetas, franjas de temas, carteles flotantes, pies de ilustración ni mensajes repetidos para rellenar espacio.
- Presentar intereses, no inventar lo que hacemos como grupo. No asumir miembros, actividad, proyectos compartidos ni logros.
- Mantener la misma presentación en la portada, comunidad, títulos, metadatos, imagen social, README y exportaciones para buscadores y LLMs.
- Estética sencilla y juguetona, con las ilustraciones de Berrus: colores planos y contornos gruesos. Animación discreta que respete movimiento reducido.

## Cómo trabajamos en el repositorio

- Monorepo con Bun: web en `apps/web`, publicaciones y lector Markdown en `packages/content`, comprobaciones comunes en `scripts`.
- Nombres de archivos en kebab-case: `app.tsx`, nunca `App.tsx` ni `AppComponent.tsx`.
- Publicamos artículos desde Markdown en GitHub. Admiten imágenes y vídeos de YouTube; no hay una sección de vídeos independiente.
- Mantener HTML pre-renderizado, metadatos, RSS, sitemap y fuentes Markdown para LLMs. La imagen social se genera durante el build.
- Railway despliega automáticamente los cambios de `main`. Su contexto Docker debe seguir en la raíz del monorepo.
- Seguir las reglas de Git y la revisión `/code-review high --fix` → `/post-work-review` de AGENTS.md. Preservar cambios ajenos.
