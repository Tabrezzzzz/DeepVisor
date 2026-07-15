# Integration & Async Architecture

## 10. Integration Architecture

What it answers: how does this system talk to external services and third parties reliably?

Key decisions:
- **Sync vs. async integration**: call external APIs synchronously only when the user is actively waiting on the result and the dependency is reliable/fast; otherwise push through a queue (see #12) so a slow/down third party doesn't take the whole request down with it.
- **Abstraction layer**: wrap third-party SDKs (payment providers, SMS providers, calling infra) behind your own interface — this keeps a provider swap (e.g. Twilio → another OTP provider) to one module instead of a codebase-wide change.
- **Webhook handling**: verify signatures, make handlers idempotent (providers retry), and process asynchronously (acknowledge fast, do the work in a background job) rather than doing heavy processing inline in the webhook handler.
- **Token/credential flows**: for OAuth-based integrations (e.g. Meta Graph API), document the full flow explicitly — user token → long-lived token exchange → resource-specific tokens — and where each is refreshed/stored, since these flows are a common source of silent breakage.
- **Failure isolation**: apply circuit breakers or timeouts on every external call so one degraded dependency can't exhaust your own service's resources.

Default recommendation: all third-party calls behind an internal abstraction, webhooks verified + idempotent + queued, explicit timeout on every outbound call.

## 11. Caching Strategy

What it answers: what's expensive to compute/fetch repeatedly, and how is it kept fast without going stale?

Key decisions:
- **Cache layer choice**: in-memory (per-instance, simplest, doesn't survive restarts or scale across instances) vs. shared cache (Redis — required once you run more than one backend instance) vs. CDN/edge caching for static/public content.
- **What to cache**: expensive reads (aggregations, third-party API responses, computed permissions), not everything — caching data that changes on every request just adds invalidation complexity for no benefit.
- **Invalidation strategy**: TTL-based (simple, accepts some staleness) vs. explicit invalidation on write (fresher, more code paths to get right) — pick per data type based on how tolerant it is of staleness. Session/permission data usually needs explicit invalidation; less critical aggregates can use TTL.
- **Cache stampede protection**: for high-traffic keys, use locking or request coalescing so a cache miss doesn't trigger a thundering herd of identical expensive recomputes.

Default recommendation: Redis as the shared cache once running more than one instance, TTL by default, explicit invalidation only where staleness is actually harmful (auth/permission state).

## 12. Queue & Background Job Architecture

What it answers: what work happens outside the request/response cycle, and how reliably?

Key decisions:
- **When to queue**: anything slow (sending SMS/email, processing media, calling a flaky third party), anything that shouldn't block the user-facing response, and anything that needs guaranteed retry.
- **Queue technology**: Redis-backed queues (e.g. BullMQ) are a solid default for small-to-mid scale Node backends already running Redis for caching; dedicated message brokers (RabbitMQ, SQS, Kafka) once throughput, ordering, or multi-consumer fan-out needs outgrow that.
- **Retry & backoff**: define retry count and backoff strategy per job type, and a dead-letter path for jobs that exhaust retries — silent job failure is a common source of "why didn't the notification send" bugs.
- **Idempotency of job handlers**: jobs will occasionally run more than once (at-least-once delivery is the norm) — handlers must be safe to re-run.
- **Scheduled/recurring jobs**: separate concern from event-triggered jobs — use a scheduler (cron-style) with a single source of truth for what's scheduled, to avoid duplicate execution across multiple instances.

Default recommendation: Redis-backed job queue for async work, explicit retry/backoff + dead-letter queue per job type, idempotent handlers assumed by default.

## 13. File Storage Architecture

What it answers: where do uploaded/generated files live, and how are they served securely?

Key decisions:
- **Storage backend**: object storage (S3-compatible, or a managed option like Supabase Storage) rather than storing files on the application server's disk — server disk doesn't survive redeploys/scaling and doesn't back up independently.
- **Access control**: signed/expiring URLs for private content (ID documents, private media) rather than permanently public URLs; public CDN-backed URLs only for genuinely public assets.
- **Upload path**: direct-to-storage uploads (client gets a signed upload URL) for large files to avoid routing big payloads through the application server; server-mediated uploads only when validation/processing must happen inline.
- **Media processing**: define where resizing/transcoding happens (on upload via a job, or on-demand via a transformation service) rather than storing every derivative eagerly.

Default recommendation: object storage with signed URLs for anything private, direct-to-storage upload for large files, async processing job for derivatives.

## 14. Notification Architecture

What it answers: how do users get told things, across which channels, reliably?

Key decisions:
- **Channel abstraction**: a single internal "notification" concept (event → template → channel(s) → delivery) rather than scattering ad hoc SMS/push/email calls through business logic.
- **Channel selection & fallback**: define per-notification-type which channels apply and the fallback order (e.g. push → SMS fallback if push fails/not installed) — critical for guard/security-style apps where a missed notification has real consequences.
- **Delivery guarantees & tracking**: send through the queue (#12) with delivery status tracked (sent/delivered/failed) so failures are visible, not silent.
- **User preferences & quiet hours**: even simple products usually need per-user notification preferences before long — design the schema for it early even if the UI comes later.

Default recommendation: notification events go through the queue, channel fallback defined per notification type, delivery status tracked and queryable.

## 15. Search Architecture

What it answers: how do users find things, and does it need to scale beyond basic SQL filtering?

Key decisions:
- **When plain SQL is enough**: for most CRUD apps, indexed `WHERE`/`ILIKE` queries or Postgres full-text search cover search needs without adding infrastructure — don't reach for a dedicated search engine by default.
- **When a dedicated search engine is justified**: large text corpora, fuzzy/typo-tolerant search, faceted search/filtering combined with relevance ranking, or search volume high enough to hurt the primary database — that's when Elasticsearch/OpenSearch/Meilisearch/Algolia earn their operational cost.
- **Sync strategy**: if a separate search index is used, define how it stays in sync with the system of record (event-driven update on write, vs. periodic reindex) — stale search results are a common visible bug.

Default recommendation: Postgres full-text search until there's a concrete, measured reason to add a dedicated search engine.
