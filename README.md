# chat-app-assignment

> UXtweak Technical Assignment

## Installation

The app can run entirely in Docker — no manual setup beyond Docker itself.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)

### Development (hot reload)

Copy `.env.example` to `.env` and adjust as needed, then start everything. Dependencies install inside the containers on startup.

```bash
pnpm docker:dev
```

| Service  | URL                                      |
|----------|------------------------------------------|
| Client   | http://localhost:`CLIENT_PORT` (9000)    |
| Server   | http://localhost:`SERVER_PORT` (3000)    |
| API docs | http://localhost:`SERVER_PORT` (3000)/api  |
| Postgres | localhost:`DATABASE_PORT` (5432)         |

Stop:

```bash
pnpm docker:dev:down
```

The first start may take a few minutes while dependencies download. Later starts are faster.

### Production (deployment)

Copy `.env.example` to `.env` and adjust as needed, then build images and start. The database schema is initialized when Postgres starts for the first time; the client is served via nginx.

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

Requires Node.js 24+ and pnpm. Set `DATABASE_HOST=localhost` in `.env`, start Postgres only (schema is applied automatically on first start), then:

```bash
pnpm install
docker compose -f docker-compose.dev.yml up postgres -d
pnpm dev
```
