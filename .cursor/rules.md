# Project context

This is a realtime chat application. The architecture is documented in `docs/architecture.md` — always consult it when designing new code or making decisions that affect multiple layers.

## Stack

pnpm workspaces · NestJS · Socket.io · Postgres + TypeORM · Quasar (Vue 3 + TS).
TypeScript end-to-end. Shared types live in `packages/shared`.

## Architectural rules (enforced by ESLint)

The backend follows hexagonal architecture:
- `domain/` must not import from `application/`, `infrastructure/`, or `transport/`
- `domain/` must not import NestJS, Socket.io, or TypeORM
- `application/` may import only from `domain/`
- `infrastructure/` and `transport/` may import from `application/` and `domain/`, but not from each other
- ORM entities are separate from domain entities; always use an explicit mapper

## Conventions

- Use value objects for IDs and validated strings (UserId, Nickname, MessageContent)
- Use-cases are application services; gateways and controllers contain no business logic
- All WS event types live in `packages/shared/src/events.ts`
- Tests: unit tests for domain + application; integration tests use testcontainers Postgres