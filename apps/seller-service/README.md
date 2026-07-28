<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`seller-service` is the first microservice of SellerBridge. It manages seller registration and lookup, built with [NestJS](https://nestjs.com) and the [CQRS pattern](https://docs.nestjs.com/recipes/cqrs).

The `sellers/` module is the reference template for every future domain module in this codebase (starting with the upcoming `kyb-service`).

## Architecture

```
src/sellers/
├── models/         domain entities (plain classes, no framework dependency)
├── repository/      persistence, hidden behind save()/findById() — MongoDB via Mongoose, a separate schema/mapper keep the domain model persistence-agnostic
├── commands/        write intents: Command + CommandHandler pairs
├── queries/          read intents: Query + QueryHandler pairs
├── dto/               HTTP request shapes, validated with class-validator
├── decorators/     domain-specific validation decorators (e.g. @IsSiret)
└── events/            outbound Kafka events (SellerRegisteredEvent + SellerEventsPublisher), published after a successful write
```

Flow: `Controller` receives a request → `ValidationPipe` validates the DTO → builds a `Command`/`Query` → dispatches it through `CommandBus`/`QueryBus` → the matching `Handler` executes it against the `Repository` (and, for writes, publishes a domain event to Kafka).

`sagas/` is intentionally not present yet — it'll be added once a real cross-service saga (e.g. reacting to `kyb.reviewed`) needs it, not before.

## Current state

Done:
- `Seller` model, persisted in MongoDB (in-memory array retired — see [Chantier B](../../README.md))
- `RegisterSellerCommand` + `RegisterSellerHandler` (POST creates a seller, returns `{ id }`, publishes `seller.registered`)
- `GetSellerQuery` + `GetSellerHandler` (GET returns the seller or 404)
- `RegisterSellerDto`, validated with `class-validator` (including a custom `@IsSiret()` checksum validator) via a global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`)
- Swagger docs at `/api`
- Unit tests (handlers, mocked repository/publisher) + e2e tests (HTTP layer, mocked repository) + GitHub Actions CI (lint + both test suites)
- `SellerEventsPublisher`: publishes a `seller.registered` event (via `kafkajs`) to Redpanda after every successful registration, consumed by `kyb-service`

Not yet built:
- Consuming `kyb.reviewed` back from `kyb-service` to update a seller's KYB status (the other half of the choreographed saga)

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
