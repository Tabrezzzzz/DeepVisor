# DevOps & Infrastructure

## 22. DevOps & CI/CD Architecture

What it answers: how does code move from a developer's machine to production, safely and repeatedly?

Key decisions:
- **Pipeline stages**: lint/typecheck → test → build → deploy, each stage gating the next — a change shouldn't reach deploy if an earlier stage fails.
- **Environment progression**: at minimum dev → staging/preview → production; preview environments per PR are high-leverage for catching issues before merge, especially for multi-app products.
- **Build artifact consistency**: build once, promote the same artifact/image through environments, rather than rebuilding per environment — eliminates "works in staging, breaks in prod" due to build differences.
- **Deployment strategy**: rolling deploy as the default; blue-green or canary once downtime/risk tolerance is low enough to justify the added complexity (see Release & Rollback, #29).
- **Monorepo CI considerations**: for a Turborepo-style monorepo with multiple apps, scope CI runs to affected packages/apps only — running the full pipeline on every change doesn't scale as the monorepo grows.

Default recommendation: lint/test/build/deploy pipeline gating every merge to main, per-PR preview environments where feasible, single build artifact promoted across environments.

## 23. Infrastructure & Cloud Architecture

What it answers: what does this actually run on, and who/what manages it?

Key decisions:
- **Managed vs. self-hosted**: default to managed services (managed Postgres, managed Redis, managed container platform) unless there's a specific cost, compliance, or control reason to self-host — self-hosting (e.g. LiveKit via Docker) trades operational burden for cost/control, and that tradeoff should be a conscious choice, not a default.
- **Containerization**: Docker for consistent environments across dev/staging/prod is close to a default for anything beyond a trivial deployment — it's what makes "works on my machine" largely go away.
- **Infrastructure as code**: infrastructure defined in version-controlled config (Terraform, Docker Compose, platform-specific config) rather than manually clicked together — this is what makes environments reproducible and disaster recovery actually feasible.
- **Environment parity**: keep dev/staging/production as close in architecture as practical (same services, smaller scale) — divergence between dev and prod is a common source of "worked in dev" incidents.
- **Local dev environment**: Docker Compose (or equivalent) that spins up the full local stack (DB, cache, dependent services) with one command — critical for onboarding and for AI coding agents that need a runnable environment to iterate against.

Default recommendation: managed services for stateful infra (DB, cache) unless self-hosting is a deliberate choice, containerized services, infrastructure as code, one-command local dev environment.

## 24. Environment & Configuration Management

What it answers: how does the same code behave correctly across dev/staging/production without code changes?

Key decisions:
- **Config source**: environment variables for deployment-specific config (URLs, feature flags, secrets), never hardcoded values — validated at startup (fail fast if a required variable is missing, not fail confusingly at first use).
- **Secrets vs. non-secret config**: separate handling — non-secret config can live in a checked-in `.env.example`/config file per environment; secrets go through a secrets manager, never committed, never logged.
- **Config validation**: validate the shape/types of config at startup (schema-validated env) so a misconfigured deployment fails immediately and loudly, not three requests in with a cryptic error.
- **Feature flags as config**: for gradually-rolled-out features, treat flags as a distinct config concern with their own lifecycle (introduce → ramp → clean up), not permanent `if` branches left in code forever.

Default recommendation: schema-validated environment variables, fail-fast on missing/invalid required config, secrets never in version control, feature flags with an explicit cleanup step.

## 25. Backup & Disaster Recovery

What it answers: when infrastructure fails or data is lost/corrupted, how bad is it and how fast do you recover?

Key decisions:
- **Backup strategy**: automated, regular database backups (not just relying on the cloud provider's default retention without checking it) — verify backups are actually restorable periodically, not just that they're being taken.
- **RPO/RTO targets**: define explicitly — Recovery Point Objective (how much data loss is acceptable, e.g. "up to 1 hour") and Recovery Time Objective (how long recovery is allowed to take) — these numbers drive the backup frequency and infrastructure redundancy decisions, not the other way around.
- **Point-in-time recovery**: for anything beyond a hobby project, prefer a database setup that supports point-in-time recovery (not just daily snapshots) so a bad migration or bad actor doesn't force losing a full day of data.
- **Multi-region/redundancy**: usually not justified for early-stage products — single-region with solid backups is the right default; multi-region adds real complexity and should be driven by an actual availability requirement, not defensive over-engineering.
- **Disaster recovery drills**: periodically actually test restoring from backup into a clean environment — an untested backup is a hypothesis, not a plan.

Default recommendation: automated daily backups with point-in-time recovery capability, explicit RPO/RTO stated even for small projects, at least one documented (and ideally tested) restore procedure before launch.
