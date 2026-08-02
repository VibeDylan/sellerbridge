# kafka-resilience

Shared retry-via-headers + dead letter topic (DLT) helper for `kafkajs` consumers, used by both [`seller-service`](../../apps/seller-service/README.md) and [`kyb-service`](../../apps/kyb-service/README.md).

## Why this exists

Both services had a consumer with near-identical failure handling: without it, a message that makes its handler throw gets retried forever by `kafkajs`, blocking every message behind it on the same partition. This package extracts that logic once it was proven working on one consumer and a second real consumer (in a different service) needed the same thing — see the [root README](../../README.md#architecture-principles) for the "promote to `packages/` only once a second real consumer needs it" rule this follows.

## How it works

`KafkaRetryHandler.handle(message, process)` wraps a single message's processing:

1. Reads a retry count from the message's `x-retry-count` header (`0` if absent).
2. Runs `process()`.
3. On failure:
   - If the retry count is below the configured max (default `3`): republishes the **same message** to the source topic with the header incremented.
   - Otherwise: publishes it to `<sourceTopic>.dlt`, with `x-retry-count` and `x-error` (the caught error, stringified) set.
4. Either way, `handle()` returns normally — the original message is considered handled, so the consumer's offset advances and the partition is never blocked.

Kafka is append-only, so "retrying later" means requeuing a copy at the end of the topic, not replaying the original in place.

## Usage

```ts
const retryHandler = new KafkaRetryHandler({
  producer, // a connected kafkajs Producer
  sourceTopic: 'seller.registered',
  maxRetries: 3, // optional, defaults to 3
});

await consumer.run({
  eachMessage: async ({ message }) => {
    if (!message.value) return;
    await retryHandler.handle(message, async () => {
      // your actual processing — throw normally on failure
    });
  },
});
```

The consumer still owns its own `Producer` (connect/disconnect in its own lifecycle hooks) — this package only encapsulates the retry/DLT decision, not connection management.

## Build

```bash
pnpm run build
```

Compiles `src/` to `dist/` (plain `tsc`). Consuming apps link this package via `"kafka-resilience": "workspace:*"`; run `pnpm install` at the repo root after changing this package, and rebuild it for the compiled output to update.
