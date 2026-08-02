<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`kyb-service` is the second microservice of SellerBridge. It consumes the `seller.registered` event published by [`seller-service`](../seller-service/README.md) over Kafka (Redpanda) and will own KYB (Know Your Business) verification — no direct HTTP call between the two services.

## Architecture

```
src/kyb/
├── models/         KybCase (plain domain class) + KybStatus (pending/approved/rejected)
├── repository/      KybCaseDocument (Mongoose schema, separate from the domain model) + mapper + KybCaseRepository (save / findBySellerId / updateStatus)
├── commands/       OpenKybCaseCommand+Handler (from seller.registered) and ReviewKybCommand+Handler (from the HTTP endpoint below)
├── dto/               UpdateKybCaseDto — verdict restricted to approved/rejected, never pending
├── events/
│   ├── seller-registered.consumer.ts   Kafka consumer, group "kyb-service", subscribed to "seller.registered"
│   ├── kyb-case-reviewed.event.ts        KybCaseReviewedEvent (sellerId + verdict)
│   └── kyb-case-events.publisher.ts      publishes kyb.reviewed after a review
└── kyb.controller.ts                     POST /kyb/:id/review — the operator-facing endpoint
```

Same CQRS skeleton as `seller-service`'s `sellers/` module — see the [root README](../../README.md#architecture-principles) for the shared conventions. `queries/` aren't needed yet.

Flow in (Kafka): `seller.registered` → `SellerEventConsumer` parses it into a local payload type (never imports `seller-service`'s own event class) → dispatches `OpenKybCaseCommand` → `OpenKybCaseHandler` checks `findBySellerId` first (idempotency: a replayed event never creates a duplicate case) → creates a `KybCase` with status `PENDING`.

Flow out (HTTP + Kafka): an operator calls `POST /kyb/:id/review` → `KybController` dispatches `ReviewKybCommand` → `ReviewKybHandler` updates the case's status (404 if the id doesn't match any case, never upserts) → publishes `kyb.reviewed` (`sellerId` + verdict) via `KybCaseEventsPublisher`, consumed in turn by `seller-service`.

Both consumers (`SellerEventConsumer` here, and `KybReviewedConsumer` in `seller-service`) wrap their message processing with [`kafka-resilience`](../../packages/kafka-resilience/README.md): on failure they retry a few times via message headers, then route to `<topic>.dlt` instead of blocking the partition.

## Current state

Done:
- Opens a `KybCase` (`PENDING`) per seller, idempotently, from `seller.registered`
- `POST /kyb/:id/review` reviews a case (`approved`/`rejected`), publishes `kyb.reviewed`
- Retry + dead letter topic on `SellerEventConsumer`, via the shared `kafka-resilience` package — verified end-to-end (forced failure → 3 retries → `seller.registered.dlt`)
- Swagger docs at `/api`, unit + e2e tests, lint clean

The full loop back to `seller-service` (its `kybStatus` field updates after a review) is verified end-to-end.

Not yet built:
- The BigQuery analytics sink (a third consumer reading these topics for reporting)

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development (from the repo root)
$ pnpm run start:dev:kyb

# or, from this directory
$ pnpm run start:dev
```

Runs on port `3002` (no HTTP routes yet — only the Kafka consumer is active).

## Run tests

```bash
$ pnpm run test
$ pnpm run test:e2e
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS CQRS recipe](https://docs.nestjs.com/recipes/cqrs)
- [kafkajs docs](https://kafka.js.org/docs/getting-started)
