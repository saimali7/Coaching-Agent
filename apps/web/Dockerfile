# Build context is the repo root so the workspace manifests and lockfile are available.
FROM node:22.22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @coaching-agent/web --include-workspace-root
COPY tsconfig.base.json ./
COPY apps/web apps/web
# VITE_API_URL stays empty so the app calls /api on its own origin and nginx proxies it.
RUN npm run build --workspace @coaching-agent/web

FROM nginx:1.30-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1
