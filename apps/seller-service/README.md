<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`seller-service` is the first microservice of SellerBridge. It manages seller registration and lookup, built with [NestJS](https://nestjs.com) and the [CQRS pattern](https://docs.nestjs.com/recipes/cqrs).

The `sellers/` module is the reference template for every future domain module in this codebase (starting with the upcoming `kyb-service`).

## Architecture

```
src/sellers/
├── models/         domain entities (plain classes, no framework dependency) — Seller now carries kybStatus
├── repository/      persistence, hidden behind save()/findById()/updateKybStatus() — MongoDB via Mongoose, a separate schema/mapper keep the domain model persistence-agnostic
├── commands/        write intents: Command + CommandHandler pairs (RegisterSeller, UpdateSellerKybStatus)
├── queries/          read intents: Query + QueryHandler pairs (GetSeller, GetAllSeller)
├── dto/               HTTP request/response shapes — RegisterSellerDto (input, validated) and SellerResponseDto (output, mapped explicitly in the controller so Seller's internal shape never leaks as-is)
├── decorators/     domain-specific validation decorators (e.g. @IsSiret)
└── events/            SellerEventsPublisher (publishes seller.registered) + KybReviewedConsumer (consumes kyb.reviewed)
```

Flow (write, HTTP): `Controller` receives a request → `ValidationPipe` validates the DTO → builds a `Command`/`Query` → dispatches it through `CommandBus`/`QueryBus` → the matching `Handler` executes it against the `Repository` (and, for writes, publishes a domain event to Kafka).

Flow (Kafka in): `KybReviewedConsumer` receives `kyb.reviewed` → parses it into a local payload type (never imports `kyb-service`'s own event class — only the wire contract is shared) → dispatches `UpdateSellerKybStatusCommand` → `UpdateSellerKybStatusHandler` updates the seller's `kybStatus` (404-equivalent internally if the seller doesn't exist, never upserts). Message processing is wrapped with [`kafka-resilience`](../../packages/kafka-resilience/README.md): failures retry a few times via message headers, then land in `kyb.reviewed.dlt` instead of blocking the topic.

`sagas/` is intentionally not present yet — it'll be added once a real cross-service saga needs its own orchestration, not before.

## Current state

Done:
- `Seller` model, persisted in MongoDB, with a `kybStatus` field (`pending` at registration, updated by the loop below)
- `RegisterSellerCommand` + `RegisterSellerHandler` (POST creates a seller, returns `{ id }`, publishes `seller.registered`)
- `GetSellerQuery` + `GetSellerHandler` (GET `/sellers/:id` returns the seller or 404)
- `GetAllSellerQuery` + `GetAllSellerHandler` (GET `/sellers` returns every seller — an empty list is a valid `200`, never a `404`, unlike the single-resource lookup above)
- `UpdateSellerKybStatusCommand` + `UpdateSellerKybStatusHandler`, triggered by `KybReviewedConsumer` — closes the saga loop from `kyb-service` back to the seller
- `RegisterSellerDto`, validated with `class-validator` (including a custom `@IsSiret()` checksum validator) via a global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`)
- `SellerResponseDto.fromDomain(seller)` — both GET routes map through it before responding, so the domain model's public shape isn't automatically what the API exposes
- CORS enabled (`app.enableCors()`), for the `operator-portal` frontend running on a different origin
- Swagger docs at `/api`
- Unit tests (handlers, mocked repository/publisher) + e2e tests (HTTP layer, mocked repository) + GitHub Actions CI (lint + both test suites)
- Retry + dead letter topic on `KybReviewedConsumer`, via the shared [`kafka-resilience`](../../packages/kafka-resilience/README.md) package — verified end-to-end (forced failure → 3 retries → `kyb.reviewed.dlt`)

The full loop (register → open KYB case → review → seller's `kybStatus` updates) is verified end-to-end with no HTTP call between the two services.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Manual verification

```bash
curl -X POST http://localhost:3000/sellers \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Acme Corp", "email": "acme@example.com", "siret": "73282932000074"}'

curl http://localhost:3000/sellers/<id>
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS CQRS recipe](https://docs.nestjs.com/recipes/cqrs)
