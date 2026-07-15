# [System/Product Name] — Architecture Design Document

> Fill in each section. Mark any domain "Out of scope for v1" with a one-line reason rather than leaving it blank — an explicit deferral is a decision; a blank section looks like an oversight.

## 0. Summary
- What is this system, in 2-3 sentences?
- Who are the primary user segments / client apps?
- What scale is this designed for (users, requests/sec, data volume) at launch and in ~1 year?

## 1. Business Domain
- Domain glossary (entity → definition → owning context)
- Bounded context map

## 2. System Design & Module Boundaries
- Monolith / modular monolith / microservices decision + why
- Module list with one-line responsibility each
- Allowed dependency directions between modules

## 3. Frontend / Presentation
- App(s), their audience, and key UX constraints
- State management approach
- Offline strategy (if applicable)

## 4. Backend / API
- API style (REST/GraphQL/gRPC) + why
- Layering approach
- Versioning scheme
- Idempotency-critical endpoints

## 5. Service Layer / Business Logic
- Where business logic lives
- Transaction boundary examples for key operations
- Cross-module orchestration approach (direct calls vs. events)

## 6. Database & Data
- Primary datastore(s) + why
- Schema ownership per module
- Migration approach
- Consistency model

## 7. Authentication & Authorization
- Auth method(s) per user segment
- Session/token strategy
- Authorization model (RBAC/ABAC) + example permission checks

## 8. Security
- Key trust boundaries and validation points
- Secrets management approach
- Rate limiting plan
- Webhook verification (if applicable)

## 9. Multi-Tenancy
- Isolation model + why
- Enforcement point for tenant scoping
- Out of scope for v1? [Y/N + reason]

## 10. Integration
- External services list, sync vs. async per integration
- Abstraction/wrapper strategy

## 11. Caching
- What's cached, where, invalidation strategy

## 12. Queue & Background Jobs
- Job types, queue technology, retry/backoff policy

## 13. File Storage
- Storage backend, access control approach

## 14. Notifications
- Channels, fallback order, delivery tracking

## 15. Search
- Approach (SQL vs. dedicated engine) + why

## 16. Reporting & Analytics
- Product analytics tool
- Operational reporting approach

## 17. Logging
- Structured logging approach, correlation ID strategy, centralization tool

## 18. Monitoring & Observability
- Metrics/error tracking tools
- Health check design
- Alerting philosophy

## 19. Error Handling
- Expected vs. unexpected error taxonomy
- Fallback behavior per critical external dependency

## 20. Performance & Scalability
- Expected bottleneck(s) and scaling plan
- Load testing plan

## 21. Testing
- Test pyramid approach
- What's required to test before every release

## 22. DevOps & CI/CD
- Pipeline stages
- Environment progression
- Deployment strategy

## 23. Infrastructure & Cloud
- Hosting/cloud provider, managed vs. self-hosted per component
- Containerization approach
- Local dev setup

## 24. Environment & Configuration
- Config source, secrets handling, validation approach

## 25. Backup & Disaster Recovery
- Backup frequency, RPO/RTO targets, restore procedure

## 26. Audit Trail & Compliance
- What's audited, applicable compliance requirements

## 27. Versioning Strategy
- API versioning scheme, backward-compatibility policy

## 28. Documentation
- What's documented where, ADR process

## 29. Release & Rollback
- Release cadence, rollback mechanism, migration safety approach

## 30. Maintenance & Support
- Dependency update cadence, incident/on-call ownership

## Open Questions / Explicitly Deferred
- List anything intentionally punted past v1, with the reason.

## Architecture Decision Records
- Link or inline any ADRs for the significant, hard-to-reverse calls made above.
