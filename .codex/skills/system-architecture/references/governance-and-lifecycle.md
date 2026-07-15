# Governance & Lifecycle

## 26. Audit Trail & Compliance

What it answers: who did what, when, and can it be proven after the fact?

Key decisions:
- **What to audit**: any state change with security, financial, or access-control significance (permission changes, access grants/denials, data exports, admin actions on other users' data) — not every read, which would be noise.
- **Audit log properties**: append-only (never updated or deleted by application code), stores actor, action, target, timestamp, and enough context to reconstruct what happened — stored separately enough from operational data that it survives even if the related record is later deleted (soft-delete the record, keep the audit trail).
- **Compliance mapping**: identify which regulatory/contractual requirements actually apply (data residency, retention periods, right-to-deletion) based on the users/regions involved, rather than assuming a generic "GDPR-ish" posture covers everything — this determines real architecture constraints like where data can be stored.
- **Access to audit data**: audit logs themselves need access control — typically more restricted than the operational data they describe.

Default recommendation: append-only audit log for all security/access/financial state changes, stored independently of the entities it describes, with actor/action/target/timestamp at minimum.

## 27. Versioning Strategy

What it answers: how do API and data contracts change over time without breaking existing clients?

Key decisions:
- **API versioning scheme**: URL-based (`/v1/`, `/v2/`) is the most explicit and cache-friendly; header-based is cleaner URLs but less discoverable — URL versioning is the safer default for most teams, especially with mobile clients that can't be forced to update instantly.
- **Backward compatibility policy**: define what counts as a breaking change (removing/renaming a field, changing a type, changing required-ness) vs. non-breaking (adding an optional field) — and default to additive, non-breaking changes wherever possible to avoid needing a new version at all.
- **Deprecation process**: when a breaking change is unavoidable, define a deprecation window with client communication, not an immediate cutover — especially critical for mobile apps where users don't update immediately (e.g. app store review lag).
- **Data schema versioning**: for data that's stored long-term and read by evolving code (e.g. event payloads, exported reports), version the schema explicitly so old records remain interpretable.

Default recommendation: URL-based API versioning, additive-change-by-default policy, explicit deprecation window (driven by mobile app store realities where relevant) before removing anything clients depend on.

## 28. Documentation Architecture

What it answers: how does knowledge about the system stay accessible and current, not just correct at the moment it was written?

Key decisions:
- **What to document**: architecture decisions (why, not just what — an ADR per significant decision), API contracts (ideally generated from schema/code, not hand-maintained separately), and onboarding/runbook docs for operational tasks (deploy, rollback, common incident response).
- **Keeping docs current**: prefer documentation that's generated from or co-located with code (API docs from schema, README per module) over standalone wikis that drift out of sync — the closer docs live to the code they describe, the more likely they stay true.
- **Architecture Decision Records (ADRs)**: for significant, hard-to-reverse decisions (database choice, auth strategy, monolith vs. services), write a short ADR capturing the decision, context, and alternatives considered — this is especially valuable when building with an AI coding agent, since it gives the agent (and future humans) the "why" that isn't visible in code alone.
- **Audience-specific docs**: separate docs for different audiences — a developer onboarding doc, an API reference for integrators, an operator runbook — rather than one document trying to serve everyone.

Default recommendation: ADRs for significant decisions, schema-generated API docs, a runbook for common operational tasks, all versioned alongside the code.

## 29. Release & Rollback Strategy

What it answers: how does a change get to production safely, and how fast can it be undone if it's wrong?

Key decisions:
- **Release cadence**: continuous deployment (every merge to main can ship) vs. batched releases — continuous deployment with good CI/CD and feature flags is generally preferable for small teams since it keeps changes small and rollback scope small.
- **Progressive rollout**: feature flags or canary releases to expose a change to a subset of traffic/users before full rollout, for anything higher-risk — catches issues before they're a full-scale incident.
- **Database migration safety**: design migrations to be backward-compatible with the previous code version during the deploy window (expand-then-contract pattern: add new column → deploy code using it → later remove old column) so a rollback of code doesn't require a rollback of the database.
- **Rollback mechanism**: a defined, practiced way to revert — redeploying the previous artifact/image, not "quickly patch forward" as the only plan — and rollback should be fast enough to matter (minutes, not requiring a new build).
- **Release communication**: for user-facing changes, especially on mobile where updates aren't instant, coordinate release notes/changelogs with the rollout.

Default recommendation: continuous deployment gated by CI, expand-then-contract migrations for backward compatibility, a tested one-command rollback to the previous artifact.

## 30. Maintenance & Support Architecture

What it answers: how does the system stay healthy and how do issues get resolved after launch?

Key decisions:
- **Dependency maintenance**: a regular (not purely reactive) process for updating dependencies, since deferred updates compound into painful, risky big-bang upgrades later.
- **Technical debt tracking**: track known shortcuts/debt explicitly (not just in developers' heads) so they're visible when prioritizing future work, especially important when much of the codebase is generated quickly by an AI agent and shortcuts may be less visible than in hand-written code.
- **Support/incident workflow**: a defined path from "something's wrong" (user report or alert) to diagnosis (using the observability stack, #17-19) to fix to postmortem for anything significant — postmortems should be blameless and focused on process/system gaps, not individual fault.
- **On-call / ownership**: even for a small team, define who's responsible for responding to production issues and how they're notified — undefined ownership is how incidents sit unaddressed.
- **Long-term ownership of generated code**: when a system is substantially built by an AI agent swarm, plan explicitly for how a human maintainer builds and keeps sufficient understanding of the codebase to debug and extend it — documentation (#28) and consistent architectural conventions matter more here, not less.

Default recommendation: scheduled dependency update cadence, a visible tech-debt list, a lightweight blameless postmortem process for anything customer-visible, explicit incident ownership even on a small team.
