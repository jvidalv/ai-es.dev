FROM oven/bun:1.4.2 AS bun
FROM node:24-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/news/package.json ./apps/news/package.json
COPY packages/content/package.json ./packages/content/package.json
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.4.2-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=bun:bun /app/apps/web/dist ./dist
COPY --chown=bun:bun apps/web/server.ts ./server.ts
USER bun
EXPOSE 3000
CMD ["bun", "server.ts"]
