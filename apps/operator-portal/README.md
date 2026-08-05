# operator-portal

The fourth piece of SellerBridge: a Vue 3 + TypeScript front end for the KYB operator — the human who reviews a seller's dossier and approves or rejects it. Everything else in this monorepo is a backend service; this is the only UI.

## Stack

Generated with the official `create-vue` scaffold: TypeScript, Vue Router, Pinia (not used yet — no state complex enough to need it so far), ESLint, Playwright (scaffolded, not written yet). No Tailwind or other CSS framework — plain scoped `<style>` per component.

## Architecture

```
src/
├── views/
│   └── SellersView.vue   the only view so far: lists sellers, lets the operator approve/suspend
├── router/
│   └── index.ts               "/" redirects to "/sellers"
└── App.vue                     just a <RouterView />
```

`SellersView.vue` talks to two backend services directly from the browser, by URL, no API gateway:
- `GET http://localhost:3000/sellers` (`seller-service`) to list sellers and their `kybStatus`.
- `POST http://localhost:3002/kyb/by-seller/:sellerId/review` (`kyb-service`) when the operator clicks Approuver/Suspendre — see [`kyb-service`'s README](../kyb-service/README.md) for why this by-seller route exists rather than reusing the case-id one.

Both backends have CORS enabled specifically so this works from Vite's dev origin (`localhost:5173`).

## Known caveat: optimistic UI, not yet resolved

After a successful `POST`, the button handler updates `seller.kybStatus` on the local reactive object directly — it does not re-fetch or wait for confirmation that `seller-service` has applied the change. Concretely: `kyb-service`'s `201` response confirms its own database write and that `kyb.reviewed` was published to Kafka — it says nothing about whether `seller-service`'s `KybReviewedConsumer` has actually consumed it yet, since that's a separate, asynchronous process.

This means the screen can show `approved` while the real record in `seller-service` still says `pending`, indefinitely, if that leg of the saga ever fails and the message lands in `kyb.reviewed.dlt` (see [`kafka-resilience`](../../packages/kafka-resilience/README.md)) instead of being applied. There is currently no reconciliation — no polling, no re-fetch, no visual indicator of "pending confirmation". This is a conscious tradeoff for now (simple, fast UI), not an oversight, but it is not yet compensated for the way the DLT deduplication is in `analytics-sink`'s queries.

## Current state

Done:
- `SellersView.vue`: lists every seller (`GET /sellers`), with a status badge and an approve/suspend button depending on current `kybStatus`
- Wired to the real backend end-to-end (register a seller → appears in the list as `pending` → click Approuver → badge updates)

Not yet built:
- Any reconciliation for the optimistic-UI caveat above
- A detail view per seller (only the list exists so far)
- Playwright E2E tests (scaffolded by `create-vue`, none written)

## Project setup

```bash
$ pnpm install
```

## Compile and run

```bash
# development (from the repo root)
$ pnpm run start:operator-portal

# or, from this directory
$ pnpm dev
```

Runs on `http://localhost:5173` (Vite's default). Requires `seller-service` (port 3000) and `kyb-service` (port 3002) to be running.

## Lint

```bash
$ pnpm lint
```
