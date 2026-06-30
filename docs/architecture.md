# Architecture — Realtime chat application

**Status:** Proposed
**Date:** 2026-06-20
**Stack:** Quasar (Vue 3 + TS) · NestJS · Socket.io · PostgreSQL · TypeORM · pnpm workspaces

---

## 1. Context and requirements

### Functional requirements
- Realtime text communication between multiple clients
- Message distribution over WebSockets (Socket.io)
- Message history persistence (PostgreSQL)
- Display of conversation flow, connection status, sending and receiving of messages
- User identification without full authentication (nickname + token)
- Presence indicator — who is online / idle / offline

### Non-functional requirements (evaluation criteria)
- **Modularity and design cleanliness** — clear boundaries between layers
- **Separation of core logic from transport and persistence** — hexagonal architecture
- **Type safety** — TypeScript end-to-end, shared types between FE and BE
- **Error handling** — robust handling of connections and errors
- **Connection handling** — explicit connection-status states, reconnection, and recovery of messages missed during an outage (see ADR-008)
- **Testability** — unit tests for the domain, integration tests for gateway and persistence

---

## 2. Architecture decisions (ADR)

### ADR-001: Monorepo tool — pnpm workspaces

**Decision:** pnpm workspaces without an additional build orchestrator.

| Option | Pro | Con |
|--------|-----|-----|
| **pnpm workspaces** | Transparent, no magic, the reviewer sees the whole structure | Manual scripts for orchestration |
| Nx | Project graph, caching, generators | Overhead for a small project, obscures the design |
| Turborepo | Fast builds | Similar overhead for this scope |

**Reason:** The goal is to demonstrate architectural thinking, not familiarity with build tools. pnpm workspaces are sufficient and anyone can read them.

### ADR-002: WebSocket layer — Socket.io

**Decision:** Socket.io via `@nestjs/websockets` + `@nestjs/platform-socket.io`.

**Reasons:**
- Native integration with NestJS (`@WebSocketGateway`, `@SubscribeMessage`)
- Built-in reconnection logic on the client side — key for the connection status indicator
- Acknowledgments (callbacks) for confirming message delivery
- Open path to horizontal scaling via Redis adapter (out of scope)

**Heartbeat configuration:** `pingInterval: 10000, pingTimeout: 5000` — worst-case disconnect detection ~15s instead of the default 45s.

### ADR-003: Persistence — PostgreSQL + TypeORM

**Decision:** PostgreSQL via Docker Compose, access via TypeORM with decorators and migrations.

**Reasons:**
- TypeORM is the de facto standard in the NestJS ecosystem
- The TypeORM repository pattern maps naturally onto the `MessageRepository` port
- Migrations demonstrate a professional approach to schema management (no `synchronize: true` in production)

### ADR-004: Conversation model — single global, no schema scaffolding for channels

**Decision:** A single global conversation, with no `conversation_id` column and no `Conversation` concept anywhere in the domain or schema. `Message` belongs to "the" conversation implicitly — there is only one.

**Reasons:**
- The assignment does not require multiple conversations (YAGNI)
- A `conversation_id` column with a hardcoded default, never read by any query, is speculative scaffolding for a feature that doesn't exist — it adds a column, an index dimension, and a value object to maintain without a single behavior depending on it today
- Schema readiness for a feature that may never be built is exactly the kind of premature generality the assignment's "no large feature set" guidance argues against

**What adding channels later actually costs:** A new `conversation_id` column (`ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id)`, backfilled to a single default row for existing messages), a new `Conversation` entity and repository, new use-cases (`CreateRoom`, `JoinRoom`), Socket.io rooms in the transport layer, and a FE sidebar. The migration is cheap (Postgres handles `ADD COLUMN ... DEFAULT` without a table rewrite on recent versions), so deferring this is a real option, not just an excuse — see Possible extensions.

### ADR-005: Pseudo-authentication — nickname + opaque token

**Decision:** On first arrival the user enters a nickname; the server generates a `userId` (UUID) and a separate `token` (UUID). The token is stored in `localStorage` on the client.

**Flow:**
1. `POST /users { nickname }` → `{ userId, nickname, token }`
2. The client stores `token` in `localStorage`
3. `io(URL, { auth: { token } })` — token in the Socket.io handshake
4. Server-side Socket.io middleware verifies the token, resolves the user, attaches it to `socket.data.user`
5. On subsequent arrivals the client sends the stored token and skips registration

**Cookie vs localStorage:** localStorage is preferable because:
- Socket.io reads the `auth` payload from JS — the cookie benefit (automatic send) goes unused
- We avoid CORS/CSRF complications with credentials
- The token is not a secret in the security sense — an HttpOnly cookie provides no real benefit

**`userId` ≠ `token`:** Separated for the cleanliness of the mental model (PK is public, token is "secret"). Opens the path to token rotation in the future.

**Unique nickname:** DB `UNIQUE` constraint + domain validation. Simpler UX. The DB constraint is the **source of truth**, not the `findByNickname` pre-check: a pre-check followed by a save has a TOCTOU race (two users with the same nickname at the same instant both pass the pre-check, the second `save` then violates the constraint). `RegisterUserUseCase` therefore catches the unique-violation error and maps it to `NicknameAlreadyTakenError`. The pre-check exists only for a friendly early error, not for correctness.

**Known limitations (stated in README):**
- This is **not** authentication. The token can be stolen, the identity can be spoofed.
- Loss of localStorage (incognito, clearing data) = loss of identity.

### ADR-006: Presence — live state in-memory, roster from the users table

**Decision:** Live presence (who holds an active socket, and whether they are active or idle) is an in-memory `Map<userId, LivePresence>` in the transport layer, with no persistence. The **roster** — the set of users shown in the list — is the `users` table. The user list is the roster, each entry annotated with a status computed by crossing the roster against live presence: `online` and `idle` come from the in-memory map; `offline` is every registered user not currently in it.

```
status(user) =
  PresenceService.has(user.id)
    ? PresenceService.get(user.id).status   // 'online' | 'idle'
    : 'offline'
```

This is the Slack-style model: you see every registered user, with an online/idle/offline badge — not just those currently connected.

**Why live presence stays in-memory (not persisted):**
- Live presence = state of a WS connection, which is ephemeral. After a server restart, reality = no connections exist; there is nothing meaningful to persist.
- Persisting it would cause the stale-state problem (DB says "online", reality is "offline" after a crash).
- Activity tracking would mean write amplification (a DB write on every idle/active signal).
- It belongs in the `transport/` layer — the domain shouldn't know who's currently connected.

**Why the roster is the `users` table (no new membership concept):** The set of "known users" already exists as the `users` table (everyone who registered a nickname, ADR-005). Offline simply means "registered but no live socket". This needs no `Membership` entity — `users` plays that role for a single global conversation. (When channels arrive, per-channel membership would refine the roster; see Possible extensions.)

**The three states are now all genuinely displayed:**
- `online` — registered user with ≥1 live socket and recent activity
- `idle` — registered user with ≥1 live socket but an inactivity signal (the only state that requires the live map *and* tells you something beyond "connected")
- `offline` — registered user with no live socket (a real, shown badge, not just an absence from the list)

**Idle detection:** Combination of client-side (VueUse `useIdle` + `useDocumentVisibility`) and a server-side safety net (10 min timeout without activity).

**Multi-tab handling:** A user is online ⇔ at least one live socket. Closing one tab does not flip them to offline if another is still open; only the last socket dropping does.

**Transport split (consistent with ADR-007):** The roster snapshot is a *read of a persistent resource* (the `users` table + current status), so it is served over **HTTP** — `GET /users` returns the full roster with each user's current status. Live status *changes* are *push*, so they go over **WS** as `presence:changed`. This mirrors history exactly: persistent read on HTTP, real-time delta on WS, merged on the FE with the same listen-buffer-merge discipline (ADR-007/008). The earlier `presence:snapshot` WS event is therefore dropped — the snapshot is now the HTTP roster fetch.

**Single lifecycle owner:** `PresenceService` is a pure in-memory state holder — it does **not** implement its own `handleConnection`/`handleDisconnect`. `ChatGateway` is the single owner of the connection lifecycle: it calls `presence.onConnect()` / `presence.onDisconnect()`, and the resulting status change is broadcast as `presence:changed` (via a `PresenceService` holding a reference to the Socket.io `server`, or via Nest `EventEmitter2`). There is no separate `presence.gateway.ts`.

**Known limitation:** Because there is no authentication and no "leave", the roster grows monotonically — every nickname ever registered stays in the list, shown as offline once disconnected. Fine for a demo; in production this would need account lifecycle or per-channel membership. Recorded in Known limitations.

**Possible extension:** When scaling to multiple servers, swap the in-memory live-presence map for a Redis-backed adapter (the interface stays the same). Per-channel membership (ADR-004) would replace "all users" as the roster source.

### ADR-007: History visibility — fully public with paginated infinite scroll

**Decision:** Every connected user sees the full history of the global conversation. History is fetched over **HTTP REST** (`GET /messages`), not over WebSocket. On page load the FE fetches the last 50 messages via HTTP; infinite scroll up fetches older pages with a `before` cursor. Real-time new messages arrive separately as `message:new` WS broadcasts.

**Transport choice — HTTP for history, WS only for live push:**
- History is a *read* of a persistent resource — exactly what HTTP REST is for. WS is for *push* (real-time events). Paginated history over a WS ack reimplements request/response semantics on top of an event transport with no benefit.
- Consistent with ADR-005, which already put `POST /users` and `GET /users/me` on HTTP for the same "create/read belongs on REST" reasoning. History is read-heavy and paginated, so it belongs in the same category. Putting registration on REST but history on WS would be an unexplained inconsistency.
- Independent of the WS lifecycle: the FE can render history before (or even without) a live WS connection, and reconnect recovery (ADR-008) does not depend on the freshly-(re)established socket.
- HTTP brings native caching affordances (`ETag`/`Cache-Control`) for old, immutable pages — a possible optimization, not required here.

**Why presence stays on WS while history moves to HTTP (intentional asymmetry):** Presence is a property of the *connection* — you are "online" only while you hold a live socket, so reading it without a socket is meaningless. History is a *persistent resource* that exists independently of any connection. The two genuinely belong on different transports; the split is deliberate, not accidental.

**Endpoint:** `GET /messages?limit=50` with *either* `&before=<cursor>` (scroll up) *or* `&after=<cursor>` (reconnect gap) — the two are mutually exclusive, never combined in one request (see section 7). No conversation segment in the URL — there is only one conversation and no `conversation_id` in the schema (ADR-004). When channels are added, `GET /conversations/:id/messages` is introduced alongside it, together with the `conversation_id` column itself.

**Pagination — composite cursor `(created_at, id)`, not offset-based, not a bare id:**
- 50 messages per page
- Default load = the last 50 on first fetch
- Older messages via a composite cursor: the `(createdAt, id)` pair of the oldest displayed message

The query uses a row-value comparison, which is deterministic and index-friendly:

```sql
SELECT * FROM messages
WHERE (created_at, id) < (:beforeCreatedAt, :beforeId)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

**Why not a bare `messageId` cursor:** The PK is UUIDv4 (random, not time-sortable), so `WHERE id < :before` is meaningless — UUIDv4 has no chronological ordering. Ordering must be driven by `created_at`. But `created_at` alone is not unique: two messages written in the same millisecond would make the cursor skip a message or return a duplicate. The composite `(created_at, id)` adds a deterministic tie-break.

**Why not UUIDv7 (time-sortable PK):** UUIDv7 would allow a simple `WHERE id < :before`, but it couples two distinct domain concepts into one field — *identity* (what distinguishes a message) and *chronology* (when it was created). In a chat, `created_at` is a first-class domain attribute that the UI displays anyway, so ordering belongs to that attribute, not hidden inside the PK. The composite cursor keeps identity as identity and adds no extra dependency. Trade-off accepted: the tie-break by UUIDv4 `id` is deterministic but arbitrary (it does not reflect true sub-millisecond creation order) — irrelevant for chat, where two messages in the same millisecond are "simultaneous" to the user anyway.

**Cursor shape in the contract:** The cursor is an opaque object `{ createdAt: string; id: string }`. It is used both as an HTTP query parameter (history) and inside the FE store; the type lives in `packages/shared` (see section 6).

**Disadvantage:** Privacy implication — a user who registers today sees everything others wrote a month ago. Acceptable for a public chat demo, not for a production deployment.

**Recommendation for extension:** If per-user history visibility is ever needed, add a `Membership` entity (`userId`, `conversationId`, `joinedAt`) and filter `GetHistoryUseCase` to `created_at >= membership.joinedAt`. Since there is currently no `conversation_id` at all (ADR-004), this would arrive together with channels, not before them — membership only makes sense once there is more than one conversation to be a member of.

**Dual-transport ordering on initial load (critical):** History (HTTP) and live messages (`message:new` over WS) now arrive on two independent transports, so their arrival order is not guaranteed. A naive "fetch history, then start listening" loses any message broadcast during the fetch; a naive "listen, then fetch" can interleave a live message ahead of the history snapshot. The FE therefore uses a **listen-buffer-merge** sequence:
1. Open the WS connection and register the `message:new` listener first, buffering incoming messages into a temporary array
2. Fetch the history page over HTTP
3. Merge: concatenate history + buffer, dedupe by `messageId`, sort by `(createdAt, id)`, then switch to live append mode

This makes initial load correct regardless of arrival order. Dedupe by `messageId` alone (the previous design) is *not* sufficient here, because the hazard is ordering and completeness across two transports, not just duplication. See ADR-008 for the symmetric reconnect case.

### ADR-008: Connection lifecycle and missed-message recovery

**Decision:** The FE models an explicit connection state machine and recovers messages missed during a disconnect by replaying from the last seen message after reconnect.

**Context:** The assignment explicitly requires displaying connection status and robust connection handling. Socket.io provides client-side reconnection, but by default a client whose connection drops (laptop sleep, network switch, tunnel) loses every message broadcast during the outage — they are never re-delivered. With our heartbeat (ADR-002) the drop is detected in ~15s, but even a short gap can miss messages, and a sleeping tab can be gone for minutes.

**Connection states (`ConnectionStatus.vue`):**
- `connecting` — initial handshake in progress
- `connected` — live, receiving broadcasts
- `reconnecting` — connection dropped, Socket.io retrying
- `disconnected` — retries exhausted / offline

These map to Socket.io client events: `connect`, `disconnect`, `reconnect_attempt`, `reconnect`, and the `io.on("reconnect_failed")` path.

**Missed-message recovery flow:**
1. The client tracks the `(createdAt, id)` of the newest message it has rendered (`lastSeen`)
2. On the `reconnect` event, the client re-arms the `message:new` listener (buffering, as on initial load) and fetches `GET /messages?after=<lastSeen>` over HTTP — the `after` mirror of the `before` paging used for scroll-up
3. The returned gap is merged with the live buffer: dedupe by `messageId`, sort by `(createdAt, id)`, then resume live append mode

**Reasons:**
- Mirrors the initial-load listen-buffer-merge from ADR-007 exactly — the reconnect path is the same code as first load, just seeded with `after: lastSeen` instead of fetching the latest page. One mechanism, two entry points.
- Recovery over HTTP is independent of the freshly re-established socket's state — cleaner than asking the just-reconnected WS to also replay history
- Keeps the server stateless about per-client delivery — the client owns its `lastSeen` watermark

**Out of scope:** Guaranteed exactly-once delivery, offline message queueing on the client, and acknowledgement-per-recipient. For this demo the at-least-once + dedupe approach is sufficient and honest about its limits.

### ADR-009: Timestamp ownership and history ordering

**Decision:** The domain owns `createdAt`, set at message construction via an injected `Clock` port. The DB `DEFAULT NOW()` is only a safety net. The repository returns history in chronological order (oldest first) for rendering.

**Context:** With both `Message.create()` and a DB `DEFAULT NOW()` capable of producing the timestamp, there were two competing sources of time. Two sources mean non-deterministic tests and a possible mismatch between the value used for the cursor and the value stored.

**Reasons:**
- A single source of truth for time — the domain — makes ordering deterministic and the cursor reliable
- An injected `Clock` port (`interface Clock { now(): Date }`) makes time testable: unit tests inject a fixed clock, so message ordering and cursor behaviour are reproducible
- The DB default remains as defence-in-depth for any path that bypasses the domain (it should not happen, but the constraint is cheap)

**Ordering contract:** The storage index is `(created_at DESC, id DESC)` for an efficient `LIMIT`. `GetHistoryUseCase` reverses the page to chronological order (oldest first) before returning, so the FE renders top-to-bottom without re-sorting. This is stated explicitly so the gateway, the use-case, and the FE agree on the direction.

### ADR-010: Database migration strategy

**Decision:** Versioned migration files generated by the TypeORM CLI from entity definitions, committed to the repo, and applied explicitly via `migration:run` — never `synchronize: true`, in any environment including tests. Migrations run as an explicit step before the application starts (Docker entrypoint in containers, a manual command in local dev), not automatically inside `main.ts` on boot.

**Context:** Section 8 only mentioned migrations in passing ("no `synchronize: true` in production"), without a setup for the CLI, a story for test environments, or a decision on when migrations actually run. TypeORM's CLI needs its own `DataSource` outside Nest's dependency injection, which is an easy thing to get wrong in a monorepo.

**Reasons:**
- **`synchronize: false` everywhere, including tests:** if tests use `synchronize: true` for speed, they validate a schema TypeORM derived from the entities at that moment — not the schema the committed migrations actually produce. A passing test suite would not guarantee the migrations are correct. Running real migrations against testcontainers Postgres closes that gap and tests the migrations themselves as a side effect.
- **Explicit `migration:run`, not `migrationsRun: true` on boot:** auto-running migrations inside the app's bootstrap couples "start the server" with "mutate the schema" into one step with no separate point of control or rollback. An explicit step makes the schema change a visible, deliberate action — closer to how a real deployment pipeline would gate it (even though CI/CD itself is out of scope here).
- **Committed migration files, not `generate` on the fly:** the migration history is part of the codebase, reviewable in a diff like any other change, not regenerated implicitly from current entity state.

**Separate `DataSource` for the CLI:**

```typescript
// apps/server/src/database/data-source.ts
import { DataSource } from 'typeorm';
import { envSchema } from '../config/env.validation';

const env = envSchema.parse(process.env);

export const dataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
```

This file is consumed only by the TypeORM CLI (`typeorm-ts-node-commonjs -d src/database/data-source.ts migration:generate ...`) and by the test bootstrap (see below). The Nest `TypeOrmModule.forRootAsync` configuration in `app.module.ts` is a separate, parallel definition — same connection parameters, same `synchronize: false`, but it's the runtime DI registration, not the CLI entry point. Both read from the same `env.validation.ts` schema so they cannot drift on connection settings.

**Testcontainers integration:** the integration test bootstrap starts the Postgres container, then runs `dataSource.initialize()` followed by `dataSource.runMigrations()` before any test executes — the same migration files used in production, applied to a throwaway database per test run.

**Docker:** the entrypoint script runs migrations before starting the Nest process:

```bash
#!/bin/sh
# apps/server/docker-entrypoint.sh
set -e
node dist/database/run-migrations.js
node dist/main.js
```

This keeps "apply schema changes" and "serve traffic" as two distinct, sequential steps — if migrations fail, the container fails fast instead of starting a server against a stale schema.

**Seed data:** none by default. The app starts against an empty `messages`/`users` table. A separate, explicitly-invoked seed script is a possible extension (useful for demoing the UI without manually registering users first) but is not run automatically, to avoid surprising state in test or review environments.

---

## 3. Monorepo structure

```
chat-app/
├── apps/
│   ├── client/                    # Quasar (Vue 3 + TS)
│   └── server/                    # NestJS
├── packages/
│   └── shared/                    # Shared types: contracts for both transports
│       └── src/
│           ├── events.ts          # WS: ClientToServerEvents, ServerToClientEvents, PresenceChangeDto, Ack
│           ├── http.ts            # HTTP: HistoryQuery, PresenceDto, PresenceStatus
│           ├── cursor.ts          # MessageCursor (composite cursor, ADR-007)
│           ├── dto/
│           │   ├── send-message.dto.ts
│           │   ├── message.dto.ts
│           │   └── user.dto.ts
│           └── index.ts
├── docker-compose.yml             # Postgres
├── package.json                   # workspaces root
├── pnpm-workspace.yaml
├── tsconfig.base.json             # shared TS config
└── docs/
    └── architecture.md            # this document
```

**Significance of `packages/shared`:** Shared types for WS events are the **most important detail** of the design. Without them you get duplicated types on FE and BE → runtime mismatches. With the shared package, both server and client compile against the same contract.

---

## 4. Backend — layering (Hexagonal / Ports & Adapters)

```
apps/server/src/
├── chat/
│   ├── domain/                              # ← No dependencies on Nest, Socket.io, TypeORM
│   │   ├── message.ts                       # Domain entity (POJO)
│   │   ├── message-id.ts                    # Value object
│   │   ├── message-content.ts               # Value object with validation
│   │   └── message.repository.ts            # INTERFACE (port)
│   │
│   ├── application/                         # ← Use-cases, domain orchestration
│   │   ├── send-message.use-case.ts
│   │   ├── get-history.use-case.ts
│   │   └── dto/
│   │       └── send-message.command.ts
│   │
│   ├── infrastructure/                      # ← Adapters: DB
│   │   ├── persistence/
│   │   │   ├── message.orm-entity.ts        # TypeORM entity (separate from the domain one)
│   │   │   ├── message.mapper.ts            # ORM ↔ Domain mapping
│   │   │   └── typeorm-message.repository.ts
│   │   └── persistence.module.ts
│   │
│   ├── transport/                           # ← WebSocket adapter
│   │   ├── chat.gateway.ts                  # @WebSocketGateway — lifecycle + live send
│   │   ├── messages.controller.ts           # HTTP GET /messages — history (ADR-007)
│   │   ├── ws-error.filter.ts               # WS-specific error handling
│   │   └── presenters/
│   │       └── message.presenter.ts         # Domain → DTO
│   │
│   └── chat.module.ts
│
├── users/
│   ├── domain/
│   │   ├── user.ts                          # Domain entity
│   │   ├── user-id.ts                       # Value object (UUID)
│   │   ├── nickname.ts                      # Value object with validation
│   │   ├── auth-token.ts                    # Value object (UUID, opaque)
│   │   └── user.repository.ts               # Port
│   │
│   ├── application/
│   │   ├── register-user.use-case.ts
│   │   └── resolve-user-by-token.use-case.ts
│   │
│   ├── infrastructure/
│   │   ├── user.orm-entity.ts
│   │   ├── user.mapper.ts
│   │   └── typeorm-user.repository.ts
│   │
│   ├── transport/
│   │   ├── users.controller.ts              # HTTP POST /users, GET /users/me, GET /users (roster)
│   │   ├── roster.read-model.ts             # joins UserRepository + PresenceService (transport read model)
│   │   ├── http-auth.guard.ts               # Bearer token → user (shared logic with WS)
│   │   └── ws-auth.middleware.ts            # Socket.io middleware (same token resolution)
│   │
│   └── users.module.ts
│
├── presence/                                # ← Transport-layer live state
│   ├── presence.service.ts                  # In-memory Map<userId, LivePresence>, state holder only
│   └── presence.module.ts
│
├── common/
│   ├── clock/
│   │   ├── clock.port.ts                     # interface Clock { now(): Date }
│   │   └── system-clock.ts                   # Date-based impl (test injects a fixed clock)
│   ├── logger/
│   └── filters/
├── database/                                 # ← CLI-facing, see ADR-010
│   ├── data-source.ts                        # Standalone DataSource for the TypeORM CLI
│   ├── run-migrations.ts                     # Entrypoint script: dataSource.runMigrations()
│   └── migrations/
│       ├── 1700000000000-CreateUsers.ts
│       └── 1700000001000-CreateMessages.ts
├── config/
│   └── env.validation.ts                    # zod schema for env variables
├── app.module.ts
├── docker-entrypoint.sh                     # runs migrations, then starts main.js
└── main.ts
```

> Note: there is no `presence.gateway.ts` — the connection lifecycle has a single owner (`ChatGateway`), see ADR-006. `PresenceService` is a pure state holder that broadcasts via an injected reference to the Socket.io `server` (or via Nest `EventEmitter2`).

### Dependency rules

```
transport ──┐
            ├──→ application ──→ domain
infrastructure ─┘                  ↑
                                   │
                infrastructure implements ports from domain
```

**Critical rules:**
1. `domain/` **must not** import anything from `application/`, `infrastructure/`, `transport/`, or from NestJS/Socket.io/TypeORM
2. `application/` **may** import only from `domain/`
3. `transport/` and `infrastructure/` **may** import from `application/` and `domain/`, but **not from each other**
4. ORM entity ≠ domain entity — an explicit mapper between them

**Where the roster join lives (a deliberate layering choice):** The roster crosses two concerns — the persistent `users` set (a domain repository) and live presence (a transport-layer, connection-bound concern). Annotating users with an online/idle/offline status is **not domain logic** — it is a read model built for the UI. So the join lives in the transport layer: a small `RosterReadModel` reads all users via `UserRepository` and annotates each with its status from `PresenceService`, and the users controller (`GET /users`) calls it directly. There is deliberately **no `GetRosterUseCase` and no presence port** — introducing an application-layer use-case and an abstraction just to let it read presence would be layering for its own sake, for logic that has no domain rules to protect. The domain stays unaware of presence; the read model is unit-testable on its own with a fake repository and a fake presence map.

### Enforcing boundaries via ESLint

In `apps/server/.eslintrc.js`:

```js
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/*/domain', from: './src/*/application' },
    { target: './src/*/domain', from: './src/*/infrastructure' },
    { target: './src/*/domain', from: './src/*/transport' },
    { target: './src/*/application', from: './src/*/infrastructure' },
    { target: './src/*/application', from: './src/*/transport' },
  ],
}]
```

This enforces the hexagonal rules in CI — the reviewer sees that it isn't just a convention in someone's head.

### Example — repository port

```typescript
// users/domain/user.repository.ts
export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByToken(token: AuthToken): Promise<User | null>;
  abstract findByNickname(nickname: Nickname): Promise<User | null>;
}
```

### Example — Gateway WITHOUT business logic

```typescript
// chat/transport/chat.gateway.ts
@WebSocketGateway({ cors: { origin: env.CORS_ORIGIN } })
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly sendMessage: SendMessageUseCase,
    private readonly presence: PresenceService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const user = client.data.user; // attached by the WS auth middleware
    const change = this.presence.onConnect(user.id, client.id); // single lifecycle owner — ADR-006
    // No snapshot here — the FE fetches the roster over HTTP (GET /users, ADR-006).
    // Only broadcast the *delta* if this connect actually changed the user's status
    // (e.g. offline → online; a second tab is a no-op).
    if (change.type === 'came-online') {
      this.server.emit('presence:changed', change.dto);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    const change = this.presence.onDisconnect(user.id, client.id);
    if (change.type === 'went-offline') {
      this.server.emit('presence:changed', change.dto);
    }
  }

  @SubscribeMessage('message:send')
  async handleSend(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<Ack<MessageDto>> {
    const user = client.data.user;
    const message = await this.sendMessage.execute({
      authorId: user.id,
      content: dto.content,
    });
    this.presence.markActivity(user.id);
    const payload = MessagePresenter.toDto(message, user);
    // Broadcast to everyone, including the sender. The FE merges this with
    // its HTTP history snapshot via listen-buffer-merge + dedupe (ADR-007).
    this.server.emit('message:new', payload);
    return { ok: true, data: payload };
  }
}
```

The gateway is now reduced to lifecycle + live send/broadcast — no history, no DB reads. History is a read resource served over HTTP by a separate controller:

```typescript
// chat/transport/messages.controller.ts
@Controller('messages')
@UseGuards(HttpAuthGuard) // resolves the Bearer token to a user, mirrors WS auth
export class MessagesController {
  constructor(private readonly getHistory: GetHistoryUseCase) {}

  @Get()
  async list(@Query() query: HistoryQueryDto): Promise<MessageDto[]> {
    const messages = await this.getHistory.execute({
      limit: query.limit ?? 50,
      before: query.before, // { createdAt, id } | undefined — scroll up
      after: query.after,   // { createdAt, id } | undefined — reconnect gap (ADR-008)
    }); // returns oldest-first (ADR-009)
    return messages.map(MessagePresenter.toDto);
  }
}
```

Both the gateway and the controller are thin transport adapters over the same use-cases — the gateway maps WS events, the controller maps HTTP requests, neither holds business logic. The connection lifecycle lives in the gateway and nowhere else (ADR-006).

---

## 5. Frontend — Quasar (Vue 3 + TS)

```
apps/client/src/
├── features/
│   ├── chat/
│   │   ├── ui/
│   │   │   ├── ChatView.vue
│   │   │   ├── MessageList.vue
│   │   │   ├── MessageInput.vue
│   │   │   ├── ConnectionStatus.vue
│   │   │   └── PresencePanel.vue            # roster: all users with online/idle/offline badge
│   │   ├── composables/
│   │   │   ├── useChatSocket.ts              # WS: live message:new, send, presence
│   │   │   ├── useMessageHistory.ts          # HTTP: GET /messages, infinite scroll, listen-buffer-merge
│   │   │   └── usePresence.ts
│   │   └── stores/
│   │       └── chat.store.ts                # Pinia
│   │
│   └── identity/
│       ├── ui/
│       │   └── NicknamePrompt.vue
│       ├── composables/
│       │   └── useIdentity.ts
│       └── stores/
│           └── identity.store.ts            # Pinia, hydrates from localStorage
│
├── infrastructure/
│   ├── socket/
│   │   └── socket-client.ts                 # Typed Socket.io client
│   ├── http/
│   │   └── api-client.ts                    # HTTP: POST /users, GET /users/me, GET /messages
│   └── storage/
│       └── token-storage.ts                 # localStorage abstraction
│
├── pages/
│   └── IndexPage.vue
├── router/
└── boot/
    └── socket.ts                            # Quasar boot file
```

**FE principles:**
- Pinia stores hold state (messages, connectionStatus, identity, presence), they **do not** call Socket.io directly
- `socket-client.ts` and `api-client.ts` are the only adapters talking to the outside world
- Components only render, actions are dispatched to stores
- `token-storage.ts` abstracts localStorage (testability, potential switch to cookies)

---

## 6. Shared contracts (WS events + HTTP DTOs)

The `packages/shared` package holds both the WS event contracts and the HTTP request/response DTOs, so the FE and BE compile against one source of truth regardless of transport.

```typescript
// packages/shared/src/cursor.ts
// Composite cursor — see ADR-007. Opaque pair, not a bare id.
export interface MessageCursor {
  createdAt: string; // ISO 8601
  id: string;        // UUID, tie-break
}
```

```typescript
// packages/shared/src/http.ts
// History is fetched over HTTP (ADR-007), not WS.
// GET /messages?before=...&after=...&limit=...
export interface HistoryQuery {
  limit?: number;
  before?: MessageCursor; // older page (infinite scroll up)
  after?: MessageCursor;  // newer page (reconnect gap recovery, ADR-008)
}
// Response body: MessageDto[] (oldest-first, ADR-009)

// Roster is fetched over HTTP (ADR-006), not WS.
// GET /users -> the full roster with each user's current status.
export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface PresenceDto {
  userId: string;
  nickname: string;
  status: PresenceStatus;
}
// Response body: PresenceDto[]
```

```typescript
// packages/shared/src/events.ts
import type { MessageDto, SendMessageDto } from './dto';
import type { PresenceStatus } from './http';

// Live status delta pushed over WS (ADR-006). The snapshot is the HTTP roster.
export interface PresenceChangeDto {
  userId: string;
  nickname: string;
  status: PresenceStatus; // new status; 'offline' means "last socket dropped"
}

export interface ServerToClientEvents {
  'message:new': (message: MessageDto) => void;
  'presence:changed': (change: PresenceChangeDto) => void;
}

export interface ClientToServerEvents {
  'message:send': (
    dto: SendMessageDto,
    ack: (response: Ack<MessageDto>) => void,
  ) => void;
  'presence:idle': () => void;
  'presence:active': () => void;
}

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

The WS surface is now intentionally small: live message push, live presence delta, and the two client→server activity signals. Everything that is a *read* (history, **roster**) or a *create* (user registration) lives on HTTP. The roster follows the same shape as history: an HTTP snapshot (`GET /users`) merged with WS deltas (`presence:changed`) via listen-buffer-merge — register the `presence:changed` listener first, fetch the roster, then apply buffered deltas on top, so a status change during the fetch is not lost. `before` and `after` are mutually exclusive per history request. Connection status (`connecting`/`connected`/`reconnecting`/`disconnected`, ADR-008) is derived on the FE from Socket.io's own client events, not from a server event, so it is not part of this contract.

Type-safe client:

```typescript
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@chat/shared';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(URL, { auth: { token } });
```

---

## 7. HTTP API

HTTP carries everything that is a create or a read: user registration, token resolution, message history, the presence roster, and health. WS is reserved for live push (see section 6).

| Method | Endpoint | Purpose | Body / Query | Response |
|--------|----------|---------|------|----------|
| POST | `/users` | New user registration | `{ nickname: string }` | `201 { userId, nickname, token }` or `409` (nickname taken) |
| GET | `/users/me` | Resolve user by token (header `Authorization: Bearer <token>`) | — | `200 { userId, nickname }` or `401` |
| GET | `/users` | Presence roster — all registered users with current status (ADR-006). Auth via `Authorization: Bearer <token>` | — | `200 PresenceDto[]` or `401` |
| GET | `/messages` | Message history, paginated (ADR-007). Auth via `Authorization: Bearer <token>` | `?limit=50&before=<cursor>` or `?after=<cursor>` | `200 MessageDto[]` (oldest-first) or `401` |
| GET | `/health` | Healthcheck for Docker — pings the DB, not just a static `ok` | — | `200 { status: "ok" }` or `503` if DB is unreachable |

`GET /users/me` lets the client verify on startup whether a stored token is still valid before opening a WS connection. `GET /users` returns the roster: the `RosterReadModel` reads all users from the repository and annotates each with its status from `PresenceService` (online/idle/offline) — a transport-layer read model, not a domain concern. `GET /messages` is the history endpoint — the cursor is passed as a query parameter; `before` and `after` are mutually exclusive. All authenticated HTTP routes and the WS handshake resolve the same opaque token to a user, sharing one auth implementation.

---

## 8. Data model (Postgres)

This schema is the direct outcome of ADR-005, ADR-007, and ADR-009 — every column traces to a decision made and revisited earlier in this document, not to an assumption made at migration time.

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY,
  nickname     VARCHAR(32) UNIQUE NOT NULL,
  token        UUID UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_token ON users (token);

CREATE TABLE messages (
  id              UUID PRIMARY KEY,
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Index supports the composite cursor (created_at, id) from ADR-007
CREATE INDEX idx_messages_created ON messages (created_at DESC, id DESC);
CREATE INDEX idx_messages_author ON messages (author_id);
```

Migrations via `typeorm migration:generate`, committed as versioned files, applied via explicit `migration:run` — never `synchronize: true`, in any environment. See ADR-010 for the full migration strategy, the standalone CLI `DataSource`, and how this interacts with testcontainers and Docker.

The `content` length bounds (1–4000) are a **single source of truth**: the same constant lives in the `MessageContent` value object, which also trims input and rejects whitespace-only content. The DB `CHECK` is defence-in-depth, not the primary validation — primary validation is in the domain, so the error surfaces as a semantic `MessageTooLongError` rather than a raw DB error.

**Deliberately not in this schema:**
- **No `conversation_id`** — see ADR-004. There is only one conversation; a column that every query would filter to the same constant adds no behavior today.
- **No `last_seen_at` / `last_login_at` on `users`.** Tracking "when was this user last active" was considered (to enable future cleanup of long-inactive users) and explicitly dropped: there is no real "login" event in this design — after registration, every subsequent arrival is a bare WS handshake with a stored token (ADR-005), so there is no natural single place to update such a column without either a write on every connection (including every tab/refresh/reconnect) or reusing presence's `markActivity` (which already serves a different, ephemeral purpose — ADR-006). Revisit this together with real account lifecycle, if that is ever needed.
- **No presence/online state** — lives in memory only (ADR-006).
- **No `membership`** — the roster is the whole `users` table (ADR-006/007).

---

## 9. Presence — state diagram

```
┌─────────┐  first connect   ┌────────┐  idle signal   ┌──────┐
│ Offline │ ───────────────► │ Online │ ─────────────► │ Idle │
│         │                  │        │                │      │
│         │ ◄─────────────── │        │ ◄───────────── │      │
└─────────┘  last disconnect └────────┘  activity      └──────┘
     ▲                                                    │
     │              last disconnect                       │
     └────────────────────────────────────────────────────┘
```

**Triggers:**
- `first connect` = the user opens their first tab/device (PresenceService had no record until then)
- `idle signal` = the client emits `presence:idle` (5 min of inactivity or `document.visibilityState === 'hidden'`)
- `activity signal` = the client emits `presence:active` (mousemove/keypress) or sends a message
- `last disconnect` = all of the user's sockets have disconnected (close, network drop, ping timeout ~15s)

**Server-side safety net:** If the server receives neither a message nor an activity signal for 10 min, it marks the user as Idle even without an explicit client event (protects against the case where the client fails to send a signal).

**Offline is a displayed state, not an absence.** In the roster model (ADR-006), the diagram's `Offline` node is a real badge in the user list — the user remains visible, greyed out. The transitions above describe the *live-presence* map (in-memory); the roster overlays this onto the full `users` table, so a user in `Offline` is simply one present in `users` but absent from the live map.

**Roster delta is an upsert, not just a status change.** A brand-new user registers (`POST /users`) and then connects, firing `presence:changed { status: 'online' }`. Other clients fetched their roster *before* this user existed, so their list has no entry for this `userId`. The FE therefore treats `presence:changed` as an **upsert**: update the entry if the `userId` is known, otherwise insert it (the DTO carries `nickname`, so no extra lookup is needed). This also means a client never has to refetch the whole roster just because someone new joined.

---

## 10. Error handling

| Layer | Strategy |
|-------|----------|
| **Domain** | Custom exceptions (`MessageTooLongError`, `InvalidNicknameError`, `NicknameAlreadyTakenError`) — semantic, not technical |
| **Application** | Catch domain exceptions; re-throw or transform per use-case |
| **Transport (WS)** | `WsExceptionFilter` maps exceptions to an `Ack` response (`{ ok: false, error: { code, message } }`) |
| **Transport (HTTP)** | NestJS `HttpExceptionFilter` maps to HTTP status codes — covers registration, `GET /users/me`, and `GET /messages` history (e.g. malformed cursor → `400`, invalid token → `401`) |
| **Infrastructure** | TypeORM errors wrapped in `RepositoryError` — the domain doesn't know Postgres-specific codes |

**Connection lifecycle logging:**
- `OnGatewayConnection` → log `userId` + `socketId`, register in `PresenceService`
- `OnGatewayDisconnect` → log the reason (`transport close`, `ping timeout`, `client namespace disconnect`)
- WS auth middleware → silent reject without a log for invalid tokens (potential brute-force noise)

---

## 11. Testing strategy

```
        ╱╲
       ╱  ╲    E2E (out of scope)
      ╱────╲
     ╱      ╲  Integration: WS gateway + DB, HTTP controllers
    ╱────────╲
   ╱          ╲ Unit: domain + application
  ────────────
```

### Unit tests (Jest)
- **Domain:** pure functions, no mocks
  - `Message.create()` validates content via the `MessageContent` value object
  - `Nickname.from()` validates length and allowed characters
  - `AuthToken.generate()` produces a valid UUID
- **Application:** mocked repository (in-memory implementation of the port)
  - `SendMessageUseCase` saves a message and returns it
  - `RegisterUserUseCase` fails on a nickname collision
- **Transport read model:** `RosterReadModel` annotates each user with the right status — online/idle from a fake presence map, offline for users absent from it (ADR-006); tested with a fake `UserRepository` + fake presence, no HTTP needed

### Integration tests
- **WS Gateway:** `socket.io-client` as a real client + testcontainers Postgres
  - A client sends a message → another client receives it via `message:new`
  - A client without a token cannot connect
  - A client with an invalid token cannot connect
  - Presence delta: when a client connects, other clients receive `presence:changed { status: 'online' }`; when its last socket drops, they receive `{ status: 'offline' }` (ADR-006)
  - Presence multi-tab: a user with two sockets stays online when one disconnects; the `offline` delta fires only when the last socket drops; a second tab connecting does not re-broadcast `online`
  - An invalid message → ack `{ ok: false, error: { code: "MESSAGE_TOO_LONG" } }`
- **HTTP:** supertest + testcontainers Postgres
  - `POST /users` returns a token; a second request with the same nickname returns 409
  - Concurrent registration with the same nickname: exactly one succeeds, the other gets `NicknameAlreadyTakenError`/409 (TOCTOU race mapped from the DB constraint, ADR-005)
  - `GET /users/me` with a valid/invalid token
  - `GET /users` returns the full roster; a connected user shows `online`, a registered-but-disconnected user shows `offline`; without a token → 401
  - `GET /messages` returns the last 50 oldest-first; without a token → 401
  - Cursor pagination: `GET /messages?before=<cursor>` returns the previous page with no gaps or duplicates, including across two messages sharing the same `created_at` (composite cursor correctness, ADR-007)
  - `GET /messages?after=<cursor>` returns exactly the messages newer than the cursor (reconnect gap, ADR-008)
  - Malformed cursor → 400
  - `GET /health` returns 503 when the DB is down
- **Repository:** TypeORM against a real Postgres (via testcontainers). The test bootstrap runs the same committed migrations (`dataSource.runMigrations()`) used in production against the container before tests execute — see ADR-010. This means the integration suite also validates that the migrations themselves are correct, not just the entity mappings.

### Frontend tests (Vitest)
- Pinia stores: state mutations and actions, including dedupe by `messageId`
- **Listen-buffer-merge (ADR-007/008):** with a mocked socket and mocked HTTP client, assert that a `message:new` arriving *during* the history fetch ends up in the store exactly once and in correct `(createdAt, id)` order — both for initial load and for the `after`-seeded reconnect path
- **Roster upsert (ADR-006):** a `presence:changed` for a `userId` not in the fetched roster inserts a new entry; one for a known `userId` updates its status in place; the same buffer-merge guards the roster fetch against a delta arriving mid-fetch
- Composables: `useChatSocket` mocks socket.io-client; connection state transitions map correctly to `connecting`/`connected`/`reconnecting`/`disconnected`
- Components: render smoke tests (Vue Testing Library)

### Aid: in-memory port implementations
The existence of `InMemoryMessageRepository` and `InMemoryUserRepository` is both a test fixture and proof that the architecture is properly decoupled — if it were impossible to implement the layers without swapping the adapter, something would be wrong.

---

## 12. Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-chat}
      POSTGRES_USER: ${DATABASE_USER:-chat}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-chat}
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chat"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
```

This Compose file provisions only Postgres — the backend and frontend run directly via `pnpm dev` for local development, so migrations are applied with a manual `pnpm migration:run` against this container (see ADR-010). If the server itself is later containerized, its image uses `docker-entrypoint.sh` to run migrations before starting `main.js`, so the same explicit-migration discipline applies in both local and containerized runs.

---

## 13. Configuration

`.env` variables validated via **zod** at startup (fail-fast):

```typescript
// config/env.validation.ts
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:9000'),
  WS_PING_INTERVAL: z.coerce.number().default(10000),
  WS_PING_TIMEOUT: z.coerce.number().default(5000),
  PRESENCE_IDLE_TIMEOUT_MS: z.coerce.number().default(10 * 60 * 1000),
});
```

`CORS_ORIGIN` is the **single source of truth** for allowed origins and is applied on both the HTTP app (`app.enableCors`) and the WebSocket gateway (`@WebSocketGateway({ cors: { origin: env.CORS_ORIGIN } })`). The gateway must not hardcode `cors: true`, otherwise the env variable becomes dead configuration.

### Graceful shutdown

`main.ts` enables Nest shutdown hooks so the process drains cleanly on `SIGTERM`/`SIGINT`:

```typescript
app.enableShutdownHooks();
```

On shutdown the app closes the Socket.io server (stops accepting connections, disconnects clients) and the TypeORM connection pool. This is a small detail, but it is exactly the kind of connection-handling maturity the assignment evaluates — the server should not leave dangling sockets or DB connections when stopped.

---

## 14. Consequences of the decisions

### What becomes easier
- Adding a new WS event — a change in a single place (`packages/shared/events.ts`)
- Swapping persistence (e.g., to MongoDB) — implement a new adapter, the domain stays the same
- Swapping the presence implementation (in-memory → Redis when scaling) — the interface stays the same
- Testing business logic — does not require DB or WS
- Adding channels — `Conversation` entity, two new use-cases, Socket.io rooms

### What becomes harder
- More layers = more files for trivial functionality (accepted trade-off — the point is to demonstrate architecture)
- ORM ↔ Domain mapping is boilerplate (solvable via a generic mapper)
- Two transports to reason about: HTTP for reads and creates (registration, history, roster) and WS for live push (new messages, presence deltas). The split is principled (see ADR-007), but it does mean auth must be wired in two places (HTTP guard + WS middleware) and the FE merges an HTTP snapshot with WS deltas in two features (messages, roster)

### Known limitations
- Pseudo-authentication: the token can be stolen, no identity verification
- Loss of localStorage = loss of identity (incognito mode, clearing data)
- Single-server deployment: presence does not survive a restart, no horizontal scaling
- No rate limiting on messages (simple DoS risk)
- No `last_seen_at` historical timestamp
- **History is public** — every connected user sees the whole conversation, including messages written before their registration (see ADR-007)
- **At-least-once delivery, not exactly-once** — recovery after reconnect relies on client-side cursor replay + dedupe (ADR-008); there is no server-side per-recipient delivery guarantee or offline queue
- **Roster grows monotonically** — with no authentication and no "leave", every nickname ever registered stays in the user list (shown as offline once disconnected). Fine for a demo; production would need account lifecycle or per-channel membership (see ADR-006)

---

## 15. Possible extensions

| Extension | Effort | Layers affected |
|-----------|--------|-----------------|
| Channels/rooms | Medium | New `conversation_id` migration (ADR-004), domain (`Conversation` entity), application, transport (Socket.io rooms), FE UI |
| Per-user history filtering (privacy) | Medium | Domain (`Membership` entity), application (filter in `GetHistoryUseCase`), DB schema. Arrives together with channels, not before — see ADR-007 |
| `last_seen_at` / activity timestamp on `users` | Low–Medium | DB schema, user domain. Needs its own decision on *when* it is written (connect vs. activity) before implementing — see Data model section 8 |
| Full OAuth | High | New auth module, replacing the token with JWT |
| Horizontal scaling | High | Redis adapter for Socket.io + presence, sticky sessions |
| Typing indicators | Low | New WS event, presence service |
| Read receipts | Medium | New DB table, new events, domain logic |
| Rate limiting | Low | NestJS Throttler on both WS and HTTP |

---

## 16. Implementation order

1. **Bootstrap monorepo:** `pnpm-workspace.yaml`, `tsconfig.base.json`, root scripts
2. **`packages/shared`:** define contracts — `MessageCursor`, `HistoryQuery` (HTTP), WS event interfaces, DTOs
3. **Docker Compose + Postgres:** run the DB locally
4. **Backend skeleton:** NestJS app, empty modules, zod env validation, `Clock` port + `SystemClock` (ADR-009)
5. **Migration setup:** standalone `data-source.ts`, `database/migrations/`, `run-migrations.ts`, `docker-entrypoint.sh` (ADR-010) — done early so every later step that adds an entity also commits its migration immediately
6. **Users domain + application:** `User`, value objects, `UserRepository` port, `register`/`resolve-by-token` use-cases — *with tests*
7. **Users infrastructure + transport:** TypeORM entity, mapper, repository impl (map unique-violation → `NicknameAlreadyTakenError`), generate+commit the `CreateUsers` migration, `POST /users` + `GET /users/me` controller, shared token-auth (HTTP guard + WS middleware)
8. **Chat domain + application:** `Message`, value objects, `MessageRepository` port, use-cases incl. composite-cursor `getHistory` (`before`/`after`) — *with tests*
9. **Chat infrastructure:** TypeORM entity, mapper, repository impl with row-value cursor query + index, generate+commit the `CreateMessages` migration
10. **Presence service:** in-memory live map, idle/active signal handling, 10-min safety net (no separate gateway — ADR-006); then `RosterReadModel` + `GET /users` roster endpoint, which depend on it
11. **Chat transport:** `ChatGateway` (lifecycle + live send + `presence:changed` deltas, single lifecycle owner), `MessagesController` (`GET /messages` history), WS error filter, env-based CORS on both HTTP and WS
12. **Integration tests:** WS gateway (live + multi-tab presence deltas), HTTP controllers (registration + nickname race + `GET /users` roster + `GET /messages` cursor/`before`/`after` + health); test bootstrap runs the committed migrations against testcontainers (ADR-010)
13. **Frontend skeleton:** Quasar app, Pinia stores, socket client, api client, token storage
14. **Frontend identity flow:** `NicknamePrompt`, `identity.store`
15. **Frontend connection + recovery:** `ConnectionStatus` state machine; messages and roster both use listen-buffer-merge (WS listener + HTTP fetch), store dedupe/upsert + sort (ADR-006/007/008)
16. **Frontend chat UI:** `MessageList` (infinite scroll up via `GET /messages?before=` cursor), `MessageInput`, `PresencePanel` (roster from `GET /users` + `presence:changed` upserts, online/idle/offline badges)
17. **Frontend tests:** stores (dedupe), listen-buffer-merge ordering, roster upsert, composables (connection transitions), smoke tests
18. **Hardening:** graceful shutdown hooks, DB-pinging health check
19. **README:** how to run, how to test, architecture description, known limitations