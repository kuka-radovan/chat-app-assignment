FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @chat/client...

COPY packages/shared packages/shared
COPY apps/client apps/client

RUN pnpm --filter @chat/client build

FROM nginx:1.27-alpine AS runner

COPY docker/client/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/client/dist/spa /usr/share/nginx/html

EXPOSE 80
