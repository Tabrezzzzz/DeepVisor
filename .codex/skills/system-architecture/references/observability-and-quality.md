# Observability & Quality

## 16. Reporting & Analytics Architecture

What it answers: how does the business get visibility into what's happening in the system?

Key decisions:
- **Operational vs. analytical workload separation**: don't run heavy reporting queries against the primary transactional database once volume grows — use read replicas, a data warehouse, or a dedicated analytics store (this can be deferred for small systems, but design the data model so it's possible later, e.g. avoid destructive updates on records you'll want to report on historically).
- **Product analytics vs. business reporting**: product analytics (usage, funnels — tools like PostHog) is a different concern from business/operational reporting (occupancy, revenue, incident counts) — don't conflate the two systems.
- **Pre-aggregation**: for dashboards hit frequently, precompute aggregates on a schedule/event rather than recomputing from raw rows on every dashboard load.

Default recommendation: product analytics tool for usage tracking, direct queries against the primary DB for low-volume operational reporting, revisit with a dedicated store only once reporting queries start impacting production performance.

## 17. Logging Architecture

What it answers: what happened, in what order, and can it be reconstructed after the fact?

Key decisions:
- **Structured logging**: JSON/structured logs, not free-text — every log line should be filterable/queryable by fields (request ID, user ID, tenant ID) not just grep-able.
- **Correlation IDs**: generate a request/trace ID at the entry point and thread it through every log line and downstream service call for that request — this is what makes debugging a distributed or async flow feasible.
- **Log levels & volume control**: define what goes at debug/info/warn/error, and ensure debug-level logs are off (or sampled) in production to control cost and noise.
- **Sensitive data**: explicitly exclude PII/secrets/tokens from logs, or mask them — logs often become the widest and least-audited attack surface for accidental data exposure.
- **Centralization**: ship logs to a centralized system (not just per-instance files) as soon as there's more than one running instance.

Default recommendation: structured JSON logs with a correlation ID injected at the request boundary, centralized log aggregation, explicit PII/secret redaction rules.

## 18. Monitoring & Observability

What it answers: how do you know the system is healthy, and how fast do you find out when it isn't?

Key decisions:
- **The three pillars**: logs (what happened), metrics (aggregate numbers over time — latency, error rate, throughput), traces (the path of a single request across services). Most systems need at least logs + metrics from day one; distributed tracing becomes valuable once there are multiple services/async hops.
- **Error tracking**: a dedicated error tracking tool (e.g. Sentry) capturing stack traces with context (user, request, release version), not just log-line errors — this is usually the highest-leverage observability investment for a small team.
- **Health checks**: liveness (is the process up) and readiness (is it able to serve traffic, e.g. DB connection healthy) as separate checks, used by the deployment/orchestration layer to route traffic and restart failed instances.
- **Alerting**: alert on symptoms users would notice (error rate spike, latency spike, queue backing up) rather than every low-level metric — alert fatigue from over-alerting is itself a reliability risk.
- **Dashboards**: a small number of high-signal dashboards (system health, business KPIs) beat a large number of dashboards nobody checks.

Default recommendation: error tracking tool from day one, structured metrics on request latency/error rate/throughput, liveness+readiness health checks, alerts scoped to user-visible symptoms.

## 19. Error Handling & Failure Recovery

What it answers: when something goes wrong, what happens next — for the user, and for the system?

Key decisions:
- **Error taxonomy**: distinguish expected/handled errors (validation failure, not found — return a clean client error) from unexpected errors (bugs, infra failures — log with full context, return a generic message, alert). Don't leak internals in error responses, but don't swallow errors silently either.
- **Graceful degradation**: define what happens when a non-critical dependency is down (e.g. calling infra fails → fall back to phone number; analytics is down → don't block the core flow) vs. what should genuinely fail the request (payment provider down during checkout).
- **Retry semantics**: client-side and server-side retry policy for transient failures, with backoff — avoid retry storms that amplify an outage.
- **User-facing error messaging**: actionable, non-technical messages for users; full technical detail only in logs/error tracking, correlated by request ID so support can trace a user's report back to the exact failure.

Default recommendation: explicit expected-vs-unexpected error taxonomy, defined fallback behavior for every non-critical external dependency, all errors logged with a correlation ID even when the user sees a generic message.

## 20. Performance & Scalability Architecture

What it answers: what breaks first under load, and how do you scale past it?

Key decisions:
- **Identify the likely bottleneck before scaling blindly**: usually the database (query patterns, missing indexes, connection pool limits) before the application layer — profile before adding infrastructure.
- **Horizontal vs. vertical scaling**: design the application layer to be stateless (no in-memory session/local state that isn't also in a shared store) so it can scale horizontally; vertical scaling is a short-term lever, not a long-term strategy.
- **Connection pooling**: explicit database connection pool limits, especially important with serverless/many-instance deployments where naive connections-per-instance can exhaust the database.
- **Load testing**: identify realistic peak load scenarios and test against them before launch, not after the first real spike — this is cheap insurance relative to a production incident.
- **Scaling triggers**: define what metric triggers scaling action (CPU, request queue depth, latency) rather than reactive manual scaling.

Default recommendation: stateless application instances behind a load balancer, explicit connection pool sizing, load test against realistic peak scenarios before launch, autoscale on latency/queue-depth rather than CPU alone where possible.

## 21. Testing Architecture

What it answers: how do you know a change is safe to ship?

Key decisions:
- **Test pyramid**: many fast unit tests (business logic, service layer — this is why a clean service layer separation matters), fewer integration tests (API + real/test database), a small number of end-to-end tests covering critical user flows only. Inverting this (mostly E2E, few unit tests) makes the suite slow and flaky.
- **What must be tested before shipping**: critical business logic (billing, access control, auth), any code handling money or security, and every past production bug (regression test on fix).
- **Test data strategy**: isolated test database/schema per test run (not shared with dev data), factories/fixtures for generating realistic test data rather than hand-written fixtures scattered per test.
- **CI gating**: tests run automatically on every PR, and failing tests block merge — a test suite that exists but doesn't gate merges provides much less value.
- **Testing async/integration-heavy code**: mock third-party dependencies at the abstraction boundary (see Integration Architecture #10) rather than at the HTTP layer, so tests aren't brittle to unrelated third-party API changes.

Default recommendation: unit-test the service layer thoroughly, integration-test the API surface for critical flows, E2E-test only the handful of flows that would be a business emergency if broken, all gating CI merge.
