# SellerBridge

Monorepo for the SellerBridge platform: onboarding and verifying sellers (registration, then KYB — Know Your Business) before they can operate on the marketplace.

## Workspace layout

```
apps/
├── seller-service/   NestJS service — seller registration & lookup (CQRS), publishes seller.registered
└── kyb-service/         NestJS service — consumes seller.registered, will own KYB verification
packages/                shared code across apps (empty for now, created on demand)
docker-compose.yml    local infra (MongoDB, Redpanda + console)
```

Managed as a [pnpm workspace](pnpm-workspace.yaml) (`apps/*` + `packages/*`).

## Services

| Service | Status | Description |
|---|---|---|
| [`seller-service`](apps/seller-service/README.md) | in progress | Seller registration & lookup, CQRS, publishes `seller.registered` |
| [`kyb-service`](apps/kyb-service/README.md) | in progress | Consumes `seller.registered`; KYB case persistence coming next |

## Architecture principles

- Each domain module follows the same CQRS skeleton: `models/`, `repository/`, `commands/`, `queries/`, `dto/`, `events/` (see [`seller-service`](apps/seller-service/README.md#architecture) for the reference layout). New modules/services should reproduce it rather than invent a new structure.
- Persistence sits behind a `Repository` (MongoDB) so swapping the storage engine doesn't ripple into commands, queries or controllers.
- Services communicate asynchronously via Kafka-compatible events (Redpanda), not direct HTTP calls between services — a producer never knows its consumers, and adding a consumer never touches the producer.
- **Database per service**: each service owns its own MongoDB database exclusively (same container locally, separate database name per service). No service reads or writes another service's data store directly.
- Cross-cutting code (decorators, utils) starts scoped to the module that needs it, and only moves up to an app-level `common/` or a shared `packages/` package once a second real consumer needs it — not before.

## Local setup

```bash
pnpm install
docker compose up -d   # starts MongoDB, Redpanda (Kafka-compatible broker), and Redpanda Console
```

Redpanda Console (topics, messages, consumer group lag): http://localhost:8080

Then run a service from the root:

```bash
pnpm run start:dev:seller   # seller-service, port 3000
pnpm run start:dev:kyb        # kyb-service, port 3002
```

Or follow the individual service's README for details ([`apps/seller-service/README.md`](apps/seller-service/README.md), [`apps/kyb-service/README.md`](apps/kyb-service/README.md)).
