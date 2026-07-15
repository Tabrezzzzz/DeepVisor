# Data & Security

## 6. Database & Data Architecture

What it answers: how is data structured, kept consistent, and scaled?

Key decisions:
- **Database choice**: relational (PostgreSQL) by default for anything with meaningful relationships and integrity requirements; add specialized stores (document, key-value, search, time-series) only for a workload that genuinely needs it, alongside — not instead of — the relational core.
- **Schema ownership**: each module/bounded context owns its own tables; other modules access that data through the owning module's service/API, not direct joins across context boundaries, once the system is big enough that this matters.
- **Migrations**: use a migration tool with up/down scripts checked into version control (e.g. Prisma Migrate) — never hand-edit production schema. Every schema change is a reviewed, versioned artifact.
- **Consistency model**: default to strong consistency (ACID transactions) within a bounded context; only reach for eventual consistency (async replication, event-driven sync) across contexts where the latency/complexity tradeoff is justified.
- **Read/write scaling path**: know the escalation path before you need it — indexes → query optimization → read replicas → caching layer → sharding, roughly in that order of effort/payoff.
- **Soft deletes vs. hard deletes**: decide per-entity based on audit/compliance needs — financial and access-control records usually need soft delete + audit trail; ephemeral data can hard delete.

Default recommendation: PostgreSQL as the system of record, migration-tool-managed schema, module-owned tables, soft delete for anything audit-relevant.

## 7. Authentication & Authorization

What it answers: who is this request from, and what are they allowed to do?

Key decisions:
- **Authentication method**: password+session, OTP (SMS/WhatsApp, especially relevant for regions requiring DLT-compliant flows), OAuth/social login, or magic link — often more than one, chosen per user segment (e.g. OTP for residents on mobile, email+password for admin web).
- **Session strategy**: JWT (stateless, easy to scale, harder to revoke instantly) vs. server-side sessions (easy to revoke, needs shared session store like Redis for multi-instance deployments). For anything needing instant revocation (security guard access, admin accounts), lean server-side sessions or short-lived JWTs with refresh tokens.
- **Authorization model**: RBAC (role-based) for straightforward role hierarchies; ABAC/policy-based when permissions depend on resource attributes or context (e.g. "guard can only approve visitors for their assigned gate"). Multi-app products (resident/guard/admin) often need per-app role sets, not one global role enum.
- **Token lifecycle**: define access token lifetime, refresh token rotation, and revocation path (logout, device removal, admin-forced logout) explicitly — don't leave this implicit.

Default recommendation: OTP or credential-based auth per user segment, short-lived access tokens + rotating refresh tokens, RBAC as the base model with resource-scoped checks (e.g. "gate assignment") layered on top where needed.

## 8. Security Architecture

What it answers: what's the blast radius if this is attacked, and how is it minimized?

Key decisions:
- **Input validation & sanitization**: validate at every trust boundary (API input, file uploads, webhook payloads) — never trust client-supplied data, including data from your own frontend.
- **Secrets management**: never commit secrets to source control; use environment variables backed by a secrets manager in production (not just `.env` files); rotate immediately on any suspected exposure.
- **Transport & storage encryption**: TLS everywhere in transit; encrypt sensitive fields at rest (PII, credentials, tokens) beyond just disk-level encryption where the data is sensitive enough to warrant it.
- **Common vulnerability classes to design against**: injection (parameterized queries/ORMs), broken access control (authorization checks on every resource-owning endpoint, not just authentication), SSRF on any server-side URL fetch, and webhook signature verification for all inbound webhooks (Twilio, payment providers, etc.).
- **Rate limiting & abuse prevention**: throttle auth endpoints (especially OTP send) and any endpoint that costs money per call (SMS, third-party API calls) — this is both a security and a cost-control concern.
- **Dependency & supply chain hygiene**: automated dependency vulnerability scanning in CI, and a process for triaging/patching flagged issues rather than letting them accumulate.

Default recommendation: validation at every boundary, secrets manager (not plain env files) in production, signature verification on all webhooks, rate limits on auth and paid-per-call endpoints from day one.

## 9. Multi-Tenancy Architecture

What it answers: how is one tenant's data and access kept isolated from another's?

Key decisions:
- **Isolation model**: shared database + tenant_id column (cheapest, most common for SaaS with many small tenants) vs. schema-per-tenant vs. database-per-tenant (strongest isolation, more operational overhead). For a gated-community-style product, shared DB with a `community_id`/`tenant_id` scoping column is usually right unless a specific customer needs dedicated infrastructure.
- **Enforcement point**: tenant scoping must be enforced at the data access layer (e.g. automatically injected into every query, or via row-level security in Postgres), not only "remembered" in application code — a single missed `WHERE tenant_id = ?` is a cross-tenant data leak.
- **Cross-tenant operations**: explicitly design the (rare) cases where cross-tenant access is legitimate (platform admin support tooling) as a distinct, audited path — not a side effect of a missing filter.
- **Tenant-specific configuration**: decide how per-tenant settings (branding, feature flags, limits) are stored and loaded — usually a tenant-config table read once per request/session and cached.

Default recommendation: shared database with mandatory tenant scoping enforced at the data access layer (ORM middleware or row-level security), never left to per-query discipline alone.
