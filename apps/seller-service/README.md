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
├── repository/      persistence, hidden behind save()/findById() — in-memory today, swappable for MongoDB later
├── commands/        write intents: Command + CommandHandler pairs
├── queries/          read intents: Query + QueryHandler pairs
├── dto/               HTTP request shapes, validated with class-validator
└── decorators/     domain-specific validation decorators (e.g. @IsSiret)
```

Flow: `Controller` receives a request → builds a `Command`/`Query` → dispatches it through `CommandBus`/`QueryBus` → the matching `Handler` executes it against the `Repository`.

`events/` and `sagas/` are intentionally not present yet — they'll be added when a real use case needs them, not before.

## Current state

Done:
- `Seller` model
- `SellerRepository` (in-memory)
- `RegisterSellerCommand` + `RegisterSellerHandler`
- `GetSellerQuery` + `GetSellerHandler`
- `RegisterSellerDto` with `class-validator` (including a custom `@IsSiret()` checksum validator)

Not wired yet:
- `SellersController` (dispatches commands/queries — nothing is reachable over HTTP yet)
- `SellersModule` (registers the controller, handlers and repository, and needs to be imported into `AppModule`)
- a global `ValidationPipe` in `main.ts` (required for the DTO decorators to actually run)

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

## Manual verification (once the controller/module are wired)

```bash
curl -X POST http://localhost:3000/sellers \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Acme Corp", "email": "acme@example.com", "siret": "73282932000074"}'

curl http://localhost:3000/sellers/<id>
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS CQRS recipe](https://docs.nestjs.com/recipes/cqrs)
