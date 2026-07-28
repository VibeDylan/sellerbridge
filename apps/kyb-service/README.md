<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`kyb-service` is the second microservice of SellerBridge. It consumes the `seller.registered` event published by [`seller-service`](../seller-service/README.md) over Kafka (Redpanda) and will own KYB (Know Your Business) verification — no direct HTTP call between the two services.

## Architecture

```
src/
├── events/
│   └── seller-registered.consumer.ts   Kafka consumer (kafkajs), group "kyb-service", subscribed to "seller.registered"
└── kyb/
    ├── models/         KybCase (plain domain class) + KybStatus (pending/approved/rejected)
    ├── repository/      KybCaseDocument (Mongoose schema, separate from the domain model) + mapper + KybCaseRepository (save / findBySellerId)
    └── commands/       OpenKybCaseCommand + OpenKybCaseHandler
```

Same CQRS skeleton as `seller-service`'s `sellers/` module — see the [root README](../../README.md#architecture-principles) for the shared conventions. `queries/` and `dto/` aren't needed yet (no HTTP surface on this service so far).

Flow: Kafka message → `SellerEventConsumer.eachMessage` parses the payload (into a local type, not `seller-service`'s own event class — a consumer only depends on the wire contract, not another service's code) → dispatches `OpenKybCaseCommand` through `CommandBus` → `OpenKybCaseHandler` checks `findBySellerId` first (idempotency: a replayed event never creates a duplicate case) → creates a `KybCase` with status `PENDING` via `KybCaseRepository`.

## Current state

Done:
- Connects to Redpanda, joins consumer group `kyb-service`, subscribes to `seller.registered`
- On each message: opens a `KybCase` (status `PENDING`) in its own MongoDB database, idempotently (checked end-to-end: replaying the same event does not create a duplicate)

Not yet built:
- Reviewing a `KybCase` (moving it to `APPROVED`/`REJECTED`)
- Publishing `kyb.reviewed` back to `seller-service`

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
