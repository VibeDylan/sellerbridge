# SellerBridge

Monorepo for the SellerBridge platform: onboarding and verifying sellers (registration, then KYB — Know Your Business) before they can operate on the marketplace.

## Workspace layout

```
apps/
├── seller-service/    NestJS service — seller registration & lookup (CQRS), publishes seller.registered, consumes kyb.reviewed
├── kyb-service/          NestJS service — consumes seller.registered, exposes KYB review, publishes kyb.reviewed
└── analytics-sink/     NestJS service — consumes both topics, writes each event as a row in BigQuery
packages/
└── kafka-resilience/  shared retry-via-headers + dead letter topic helper, used by all three services' consumers
docker-compose.yml    local infra (MongoDB, Redpanda + console)
```

Managed as a [pnpm workspace](pnpm-workspace.yaml) (`apps/*` + `packages/*`).

## Services

| Service | Status | Description |
|---|---|---|
| [`seller-service`](apps/seller-service/README.md) | in progress | Seller registration & lookup, CQRS, publishes `seller.registered`, consumes `kyb.reviewed` |
| [`kyb-service`](apps/kyb-service/README.md) | in progress | Consumes `seller.registered`, exposes an operator review endpoint, publishes `kyb.reviewed` |
| [`analytics-sink`](apps/analytics-sink/README.md) | in progress | Consumes both topics, writes each event to BigQuery (`sellerbridge_analytics` dataset) |

The saga loop is closed both ways: `seller-service` → `seller.registered` → `kyb-service` opens a case → an operator reviews it → `kyb.reviewed` → `seller-service` updates the seller's `kybStatus`. No HTTP call between the two services at any point. `analytics-sink` reads the same two topics independently, for reporting — it never affects the saga, only observes it.

## Architecture principles

- Each domain module follows the same CQRS skeleton: `models/`, `repository/`, `commands/`, `queries/`, `dto/`, `events/` (see [`seller-service`](apps/seller-service/README.md#architecture) for the reference layout). New modules/services should reproduce it rather than invent a new structure — **unless there's no real business logic to isolate**, as with `analytics-sink`, which is a plain service + consumer instead (see its README for the reasoning).
- Persistence sits behind a `Repository` (MongoDB) so swapping the storage engine doesn't ripple into commands, queries or controllers.
- Services communicate asynchronously via Kafka-compatible events (Redpanda), not direct HTTP calls between services — a producer never knows its consumers, and adding a consumer never touches the producer.
- **Database per service**: each service owns its own MongoDB database exclusively (same container locally, separate database name per service). No service reads or writes another service's data store directly.
- Cross-cutting code (decorators, utils) starts scoped to the module that needs it, and only moves up to an app-level `common/` or a shared `packages/` package once a second real consumer needs it — not before. [`packages/kafka-resilience`](packages/kafka-resilience/README.md) is the first thing that earned that promotion, once both services needed the same retry/DLT logic.
- **Resilience**: every Kafka consumer wraps its message processing with [`kafka-resilience`](packages/kafka-resilience/README.md) — on failure, retries a few times via the same topic (message headers carry the attempt count), then routes to a `<topic>.dlt` topic instead of blocking the partition forever.

## Local setup

```bash
pnpm install
docker compose up -d   # starts MongoDB, Redpanda (Kafka-compatible broker), and Redpanda Console
```

Redpanda Console (topics, messages, consumer group lag): http://localhost:8080

`analytics-sink` additionally needs a GCP service account key (see [its README](apps/analytics-sink/README.md#bigquery-setup-manual-one-time)) referenced via `GOOGLE_APPLICATION_CREDENTIALS` in the root `.env`.

Then run a service from the root:

```bash
pnpm run start:dev:seller       # seller-service, port 3000
pnpm run start:dev:kyb            # kyb-service, port 3002
pnpm run start:dev:analytics  # analytics-sink, port 3003
```

Or follow the individual service's README for details ([`apps/seller-service/README.md`](apps/seller-service/README.md), [`apps/kyb-service/README.md`](apps/kyb-service/README.md), [`apps/analytics-sink/README.md`](apps/analytics-sink/README.md)).
