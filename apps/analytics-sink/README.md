<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

`analytics-sink` is the third microservice of SellerBridge. It consumes both `seller.registered` (from [`seller-service`](../seller-service/README.md)) and `kyb.reviewed` (from [`kyb-service`](../kyb-service/README.md)) and writes each event as a row in BigQuery — the "dataset performant pour les équipes Data" from the brief.

## Architecture

```
src/analytics/
├── analytics-ingestion.service.ts   BigQuery client + insertSellerRegistration() / insertKybReview(), in the service's own vocabulary (SellerRegistrationRow / KybReviewRow) — never imports Kafka payload types
├── analytics.consumer.ts               subscribes to both topics, routes by topic name, translates each Kafka payload into the service's row shape
└── analytics.module.ts
```

No `models/`, `repository/`, `commands/` here — deliberately, not a copy-paste of the other services' CQRS skeleton. This service has no business rules, no state to protect, no persistence to keep swappable: it reads an event and writes a row. CQRS would add ceremony without isolating anything real, so it's a plain service + consumer instead. See the [root README](../../README.md#architecture-principles) for the general rule this follows.

Flow: `AnalyticsConsumer` subscribes to `seller.registered` **and** `kyb.reviewed` with a single `consumer.subscribe({ topics: [...] })` → routes each message by topic → wraps processing with [`kafka-resilience`](../../packages/kafka-resilience/README.md) (**two** `KafkaRetryHandler` instances, one per topic, since retry/DLT topic naming is per-source-topic) → parses the payload, converts date strings back to `Date`, and calls the matching `AnalyticsIngestionService` method.

Unlike the other two consumers, this one subscribes with `fromBeginning: true` — an analytics sink needs the full history to answer questions like "registrations per day", not just events from the moment it first started.

## BigQuery setup (manual, one-time)

Dataset `sellerbridge_analytics`, two tables (see the SQL DDL below — run once in the BigQuery query editor, not from application code):

```sql
CREATE TABLE sellerbridge_analytics.seller_registrations (
  seller_id      STRING    NOT NULL,
  company_name   STRING,
  email          STRING,
  siret          STRING,
  registered_at  TIMESTAMP NOT NULL,
  ingested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE sellerbridge_analytics.kyb_reviews (
  kyb_case_id   STRING    NOT NULL,
  seller_id     STRING    NOT NULL,
  verdict       STRING    NOT NULL,
  reviewed_at   TIMESTAMP NOT NULL,
  ingested_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
```

Authentication: a GCP service account key, referenced via the standard `GOOGLE_APPLICATION_CREDENTIALS` env var (Application Default Credentials) in the root `.env` — nothing passed explicitly to `new BigQuery()`. The key file lives in `secrets/` at the repo root, which is gitignored; never commit it.

## Current state

Done:
- Ingests both `seller.registered` and `kyb.reviewed` into their respective BigQuery tables, with retry + dead letter topic on both
- Verified end-to-end: a fresh registration and review both land in BigQuery within seconds, and the full backfill (`fromBeginning: true`) captured all pre-existing history on first connect
- The 3 analytics SQL queries from the brief are in [`sql/analytics-queries.sql`](sql/analytics-queries.sql) (KYB approval rate, average time between registration and review, registrations per day) — run them directly in the BigQuery query editor, not part of the application code

## Known duplicates (accepted debt, not a bug)

`analytics-sink` is **at-least-once**, not exactly-once: a `kafka-resilience` retry (a failed message is republished with an incremented header) or a consumer group rebalance (observed repeatedly during local testing, e.g. after a hot-reload) can both cause the same logical event to be delivered — and therefore inserted — more than once. Duplicate rows share the same business timestamp (`registered_at` / `reviewed_at`) but differ on `ingested_at`. Concretely: a review forced to fail during DLT testing on 2026-08-02 produced 5 rows for the same `(kyb_case_id, reviewed_at)`, and a similar retry on `seller.registered` produced 4 rows for the same `(seller_id, registered_at)`.

This is deliberately **not** fixed at ingestion (no dedup-on-write, no unique constraint) — the raw tables are treated as an unclean "bronze" layer, exactly what arrived from Kafka. Deduplication happens at **read time** instead, in [`sql/analytics-queries.sql`](sql/analytics-queries.sql): `ROW_NUMBER() OVER (PARTITION BY <natural key>, <business timestamp> ORDER BY ingested_at) QUALIFY = 1` before aggregating. The partition key is deliberately `(kyb_case_id, reviewed_at)` and `(seller_id, registered_at)` — **not** `kyb_case_id`/`seller_id` alone — because a case can legitimately be reviewed more than once (a real second review has a different `reviewed_at`, and must **not** be collapsed into the first one; only exact redeliveries of the same event, sharing the same business timestamp, are duplicates).

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development (from the repo root)
$ pnpm run start:dev:analytics

# or, from this directory
$ pnpm run start:dev
```

Runs on port `3003` (no HTTP routes — only the two Kafka subscriptions are active).

## Run tests

```bash
$ pnpm run test
$ pnpm run test:e2e
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [BigQuery Node.js client reference](https://cloud.google.com/nodejs/docs/reference/bigquery/latest)
- [kafkajs docs](https://kafka.js.org/docs/getting-started)
