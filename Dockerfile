FROM node:22.13.1-bookworm-slim@sha256:83fdfa2a4de32d7f8d79829ea259bd6a4821f8b2d123204ac467fbe3966450fc AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

# Tooling and fixtures never enter the application runtime.
FROM dependencies AS db-init
COPY scripts/database ./scripts/database
COPY scripts/container ./scripts/container
COPY server/db/config.mjs ./server/db/config.mjs
COPY database ./database
USER node
CMD ["node", "scripts/container/init.mjs"]

FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d AS gateway
# The official binary carries a low-port capability; our port 3443 needs none.
RUN setcap -r /usr/bin/caddy
COPY docker/Caddyfile /etc/caddy/Caddyfile
USER 1000:1000

FROM base AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node scripts/container/health.mjs ./health.mjs
USER node
EXPOSE 3000
CMD ["node", "server.js"]
