# chat-app-assignment

> UXtweak Technical Assignment — realtime chat application

A single-room chat where multiple users exchange messages in real time. Users pick a nickname on first visit, see message history, and can see who else is currently online.

## Solution overview

### Features

- **Realtime messaging** — send and receive messages over WebSockets (Socket.io)
- **Message history** — persisted in PostgreSQL, loaded over HTTP with infinite scroll for older messages (10 per page)
- **User identity** — nickname + opaque token stored in `localStorage` (no full authentication)
- **Online presence** — the *People* panel lists users who are connected right now; join/leave toasts appear when someone comes online or disconnects
- **Multi-tab support** — a user stays online while at least one tab remains connected

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Quasar (Vue 3 + TypeScript), Pinia, Socket.io client |
| Backend | NestJS, Socket.io, TypeORM |
| Database | PostgreSQL 16 |
| Shared contracts | `packages/shared` — DTOs and event types used by both client and server |
| Tooling | pnpm workspaces, Docker Compose, Jest, ESLint |

### Architecture (summary)

The backend is organized in layers per feature module (`users`, `messages`, `chat`):

- **Domain** — entities and value objects (no framework imports)
- **Application** — use cases (`RegisterUser`, `ResolveUserByToken`, `SendMessage`, `ListMessages`)
- **Infrastructure** — TypeORM repositories
- **Transport** — HTTP controllers and the WebSocket gateway

**HTTP** handles registration, token validation, and paginated message history.

**WebSockets** handle live messaging and online presence:

| Direction | Event | Purpose |
|-----------|-------|---------|
| Client → server | `message:send` | Send a message (with ack) |
| Client → server | `user:online` | Announce presence after connect (returns current online users) |
| Server → client | `message:new` | Broadcast a new message |
| Server → client | `user:online` | Notify others that a user came online |
| Server → client | `user:offline` | Notify everyone that a user disconnected |

The WebSocket handshake authenticates via `auth: { token }`. The same token is used for HTTP routes (`Authorization: Bearer <token>`).

On initial load, the client fetches message history over HTTP while already listening for `message:new`, then merges both so live messages received during the fetch are not lost.

### Repository layout

```
chat-app-assignment/
├── apps/
│   ├── client/          # Quasar frontend
│   └── server/          # NestJS backend
├── packages/
│   └── shared/          # Shared TypeScript contracts
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

---

## Prerequisites

**Docker (recommended):**

- Docker Desktop, or Docker Engine + Compose v2

**Local development without Docker:**

- Node.js 24+
- pnpm 10+ (`corepack enable` to activate the version pinned in `package.json`)
- Docker (for PostgreSQL only)

---

## Configuration

Copy the example environment file and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_PORT` | `9000` | Frontend dev server port |
| `SERVER_PORT` | `3000` | Backend HTTP/WebSocket port |
| `DATABASE_PORT` | `5432` | PostgreSQL port (host mapping) |
| `PROXY_PORT` | `8080` | Production nginx port |
| `DATABASE_HOST` | `postgres` | Use `localhost` when running `pnpm dev` on the host |
| `DATABASE_NAME` | `ux-tweak-chat` | Database name |
| `DATABASE_USER` | `uxtweak` | Database user |
| `DATABASE_PASSWORD` | *(see `.env.example`)* | Database password |
| `CORS_ORIGIN` | `http://localhost:9000` | Must match the client origin (`http://localhost:<CLIENT_PORT>`) |

The database schema is applied automatically when Postgres starts for the first time (`apps/server/src/database/init.sql`).

---

## Running the app

### Development with Docker (recommended)

Everything runs in containers with hot reload. Dependencies install inside the containers on startup.

```bash
cp .env.example .env   # if you have not already
pnpm docker:dev
```

| Service | URL |
|---------|-----|
| Client | http://localhost:9000 |
| Server | http://localhost:3000 |
| API docs (Swagger) | http://localhost:3000/api |
| Postgres | localhost:5432 |

Stop:

```bash
pnpm docker:dev:down
```

The first start may take a few minutes while images build and dependencies download. Later starts are faster.

### Local development without Docker

Requires Node.js 24+ and pnpm. Postgres runs in Docker; the client and server run on the host.

```bash
cp .env.example .env
# Set DATABASE_HOST=localhost in .env

pnpm install
docker compose -f docker-compose.dev.yml up postgres -d
pnpm dev
```

This starts the server and client in parallel. Open http://localhost:9000 (or your configured `CLIENT_PORT`).

Individual apps:

```bash
pnpm dev:server   # backend only
pnpm dev:client   # frontend only
```

### Production (Docker)

Builds production images. The client is served via nginx, which proxies API and WebSocket traffic to the backend.

```bash
cp .env.example .env
pnpm docker:prod
```

| Service | URL |
|---------|-----|
| App | http://localhost:8080 |

Stop:

```bash
pnpm docker:prod:down
```

---

## Testing

### Automated tests

From the repository root:

```bash
pnpm install        # if not already done
pnpm test           # Jest — domain, application, and gateway unit tests
pnpm typecheck      # TypeScript across all packages
pnpm lint           # ESLint / Prettier
```

Server tests only:

```bash
pnpm --filter @chat/server test
pnpm --filter @chat/server test:watch
```

Tests do not require a running database — they use in-memory repositories and mocks.

### HTTP API

Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/users` | Register with `{ "nickname": "..." }` |
| `GET` | `/users/me` | Resolve the current user from the token |
| `GET` | `/messages` | Message history (`?limit=`, `?beforeCreatedAt=&beforeId=`, or `?afterCreatedAt=&afterId=`) |
| `GET` | `/health` | Health check (includes database ping) |

Interactive documentation: http://localhost:3000/api (when the server is running).

---

## Known limitations

- **Pseudo-authentication** — the token is not a secure credential (identity can be spoofed)
- **Single global room** — no channels or private conversations
- **Online-only presence** — disconnected users disappear from the list, there is no idle/offline badge for registered users
- **In-memory presence** — online state lives on the server process and is lost on restart (it does not scale across multiple server instances)
- **No reconnect gap recovery** — the API supports an `after` cursor, but the client does not fetch missed messages after reconnect
