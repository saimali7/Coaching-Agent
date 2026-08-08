# Build context is the repo root so the workspace manifests and lockfile are available.
FROM node:22.22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/

FROM base AS build
RUN npm ci --workspace @coaching-agent/api --include-workspace-root
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN npm run build --workspace @coaching-agent/api

FROM base AS prod-deps
RUN npm ci --omit=dev --workspace @coaching-agent/api --include-workspace-root

FROM node:22.22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/package.json apps/api/

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
