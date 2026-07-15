---
name: system-architecture
description: Design, review, or document production-grade software system architecture. Use when planning SaaS/platform architecture, writing a TDD/RFC/ADR, reviewing production readiness, defining module boundaries, designing multi-tenancy, data architecture, API contracts, auth, security, scalability, observability, DevOps, recovery, or asking how to architect a system.
---

# System Architecture

Use this skill to design, review, or document production-grade software architecture. The output should help a real implementation survive production conditions, not just demo flows.

This local Codex skill follows the repository `.codex` setup:

- Skill entrypoint: this `SKILL.md`.
- Supporting references: `references/*.md`.
- Reusable templates: `assets/*.md`.
- No extra tool assumptions. Use normal Codex file-reading and editing behavior.

## When To Use

Use this skill for:

- New system or module architecture.
- Architecture review of an existing app.
- Multi-tenant SaaS/workspace design.
- Database, data ownership, and migration planning.
- API contracts and service boundaries.
- Auth, authorization, security, and blast-radius analysis.
- Scalability, background jobs, caching, observability, deployment, and recovery planning.
- Technical design docs, RFCs, ADRs, and production-readiness checklists.

Do not force a full architecture document for a narrow question. Match depth to the request.

## Depth Rules

- Quick opinion: answer directly using only the relevant reference file if needed.
- New feature/module: cover the 10 production-critical cores briefly, then expand only where risk requires it.
- Full design doc: use `assets/architecture-doc-template.md`.
- Production review/audit: use `assets/production-readiness-checklist.md`.
- Existing codebase task: inspect current code and data model first. Do not invent architecture that ignores the repo.

## 10 Production-Critical Cores

Always consider these, even if briefly:

| Core | Question | Covers |
| --- | --- | --- |
| Domain | What are we modeling, and where are the boundaries? | Business domain, module boundaries |
| Data | How is data structured, owned, and kept consistent? | Database and data architecture |
| API | How do clients/services communicate, and what is the contract? | Backend/API, integrations |
| Security | What is the blast radius if attacked or misused? | Auth, authorization, threat boundaries |
| Infrastructure | What does this run on, and how is it configured? | Hosting, environments, cloud |
| Scalability | What breaks first under load, and how do we know? | Performance, caching, queues |
| Observability | How do we detect and debug failures? | Logs, metrics, tracing, errors |
| Testing | How do we prove behavior remains correct? | Unit, integration, E2E, contract tests |
| Deployment | How does code reach production safely? | CI/CD, release and rollback |
| Recovery | How bad is failure, and how fast can we recover? | Backup, DR, incident paths |

## 30 Architecture Domains

Read only the files relevant to the task. Do not load all references for a narrow request.

- `references/domain-and-design.md`
  - Business domain architecture.
  - System design and module boundaries.

- `references/application-layers.md`
  - Frontend/presentation architecture.
  - Backend/API architecture.
  - Service layer and business logic.

- `references/data-and-security.md`
  - Database and data architecture.
  - Authentication and authorization.
  - Security architecture.
  - Multi-tenancy architecture.

- `references/integration-and-async.md`
  - Integration architecture.
  - Caching strategy.
  - Queue and background jobs.
  - File storage architecture.
  - Notification architecture.
  - Search architecture.

- `references/observability-and-quality.md`
  - Reporting and analytics.
  - Logging architecture.
  - Monitoring and observability.
  - Error handling and failure recovery.
  - Performance and scalability.
  - Testing architecture.

- `references/devops-and-infra.md`
  - DevOps and CI/CD.
  - Infrastructure and cloud architecture.
  - Environment and configuration management.
  - Backup and disaster recovery.

- `references/governance-and-lifecycle.md`
  - Audit trail and compliance.
  - Versioning strategy.
  - Documentation architecture.
  - Release and rollback strategy.
  - Maintenance and support architecture.

- `references/beyond-the-30.md`
  - Cost/FinOps.
  - Rate limiting and abuse prevention.
  - Feature flags and experimentation.
  - Internationalization/localization.
  - Accessibility.
  - AI/ML integration architecture.
  - Privacy and compliance by design.

## Workflow

1. Clarify or infer scope.
   - Identify system type, users, scale, tenancy, data sensitivity, integrations, and operational constraints.
   - If the codebase exists, inspect it before recommending changes.

2. Start with domain and boundaries.
   - Define bounded contexts, ownership, key entities, and lifecycle.
   - Avoid picking infrastructure before understanding the domain.

3. Cover the 10 cores.
   - State the recommendation, reasoning, and failure mode for each relevant core.

4. Route to references.
   - Open the specific `references/*.md` files for areas touched by the request.
   - Use `assets/architecture-doc-template.md` for full design docs.
   - Use `assets/production-readiness-checklist.md` for reviews.

5. Make decisions.
   - Prefer one recommended design with tradeoffs over a menu of options.
   - Include top alternatives only when they materially change cost, risk, or complexity.

6. Mark deferrals explicitly.
   - Production-grade does not mean everything ships in v1.
   - Deferred items must be named with the reason and trigger for revisiting.

## Output Expectations

For architecture design:

- Recommended architecture.
- Domain boundaries and data ownership.
- Core data model and tenancy model.
- API/service contracts at the right level of detail.
- Security, auth, and permission model.
- Operational model: jobs, caching, observability, deployment, recovery.
- Migration plan or phased rollout if changing an existing system.
- Risks, tradeoffs, and explicitly deferred work.

For architecture review:

- Findings first, ordered by severity.
- File/table/component references when reviewing a real codebase.
- Production-readiness gaps.
- Concrete remediation plan.
- Residual risks and test/verification plan.

## Style

- Be concrete and opinionated.
- Call out failure modes and operational risk.
- Avoid generic architecture diagrams in prose when code/data inspection is available.
- Do not over-architect early MVPs, but do not hide production-critical gaps.
- For AI-agent implementation specs, be more explicit than for human teams because agents follow written instructions literally.
