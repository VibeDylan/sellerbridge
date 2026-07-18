# SellerBridge

Monorepo for the SellerBridge platform: onboarding and verifying sellers (registration, then KYB — Know Your Business) before they can operate on the marketplace.

## Workspace layout

```
apps/
└── seller-service/   NestJS service — seller registration & lookup (CQRS)
packages/                shared code across apps (empty for now, created on demand)
docker-compose.yml    local infra (MongoDB)
```

Managed as a [pnpm workspace](pnpm-workspace.yaml) (`apps/*` + `packages/*`).

## Services

| Service | Status | Description |
|---|---|---|
| [`seller-service`](apps/seller-service/README.md) | in progress | Seller registration & lookup, CQRS |
| `kyb-service` | planned | Business verification, will reuse the `seller-service` module template |

## Architecture principles

- Each domain module follows the same CQRS skeleton: `models/`, `repository/`, `commands/`, `queries/`, `dto/` (see [`seller-service`](apps/seller-service/README.md#architecture) for the reference layout). New services should reproduce it rather than invent a new structure.
- Persistence sits behind a `Repository` (in-memory today, MongoDB next) so swapping the storage engine doesn't ripple into commands, queries or controllers.
- Cross-cutting code (decorators, utils) starts scoped to the module that needs it, and only moves up to an app-level `common/` or a shared `packages/` package once a second real consumer needs it — not before.

## Local setup

```bash
pnpm install
docker compose up -d   # starts MongoDB, used once services move off in-memory storage
```

Then follow the individual service's README to run it (e.g. [`apps/seller-service/README.md`](apps/seller-service/README.md)).
