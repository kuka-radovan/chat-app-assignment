# chat-app-assignment

> UXtweak Technical Assignment

## Installation

The app can run entirely in Docker.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Copy `.env.example` to `.env` and adjust values if needed

### Development (hot reload)

Source code is bind-mounted into the containers. Changes to the server (NestJS watch) and client (Quasar/Vite HMR) are reflected immediately.

```bash
pnpm docker:dev
```

| Service  | URL                                      |
|----------|------------------------------------------|
| Client   | http://localhost:`CLIENT_PORT` (9000)    |
| Server   | http://localhost:`SERVER_PORT` (3000)    |
| Postgres | localhost:`POSTGRES_PORT` (5432)         |

Stop:

```bash
pnpm docker:dev:down
```

Run database migrations manually (once TypeORM migrations are in place):

```bash
docker compose -f docker-compose.dev.yml exec server pnpm migration:run
```

### Production (deployment)

Builds optimized images: the server runs migrations on startup, the client is served by nginx with API/WebSocket proxying to the backend.

```bash
pnpm docker:prod
```

| Service | URL                                   |
|---------|---------------------------------------|
| App     | http://localhost:`PROXY_PORT` (8080)  |

Stop:

```bash
pnpm docker:prod:down
```

### Local development without Docker

Run only Postgres in Docker, then start the apps on the host (loads ports from `.env` via `dotenv-cli`):

```bash
docker compose -f docker-compose.dev.yml up postgres -d
pnpm dev
```

Apply migrations against the containerized database:

```bash
pnpm migration:run
```
