FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --filter @chat/server...

COPY packages/shared packages/shared
COPY apps/server apps/server

RUN pnpm --filter @chat/server build

FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --prod --filter @chat/server...

COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/docker-entrypoint.sh ./apps/server/docker-entrypoint.sh
RUN chmod +x ./apps/server/docker-entrypoint.sh

WORKDIR /app/apps/server

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
