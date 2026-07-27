<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`kyb-service` is the second microservice of SellerBridge. It consumes the `seller.registered` event published by [`seller-service`](../seller-service/README.md) over Kafka (Redpanda) and will own KYB (Know Your Business) verification — no direct HTTP call between the two services.

## Architecture

```
src/
└── events/
    └── seller-registered.consumer.ts   Kafka consumer (kafkajs), group "kyb-service", subscribed to "seller.registered"
```

A `kyb/` domain module (`models/`, `repository/`, `commands/`) is coming next, following the same CQRS skeleton as `seller-service`'s `sellers/` module — see the [root README](../../README.md#architecture-principles) for the shared conventions.

## Current state

Done:
- Connects to Redpanda, joins consumer group `kyb-service`, subscribes to `seller.registered`, logs each message received

Not yet built:
- `KybCase` model + MongoDB persistence (own database, separate from `seller-service`'s)
- `OpenKybCaseCommand` + handler, dispatched by the consumer instead of just logging
- Idempotent handling (skip if a case already exists for that `sellerId`, so a replayed/duplicate event doesn't create a duplicate case)
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
