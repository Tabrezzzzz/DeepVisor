# Domain & Design

## 1. Business Domain Architecture

What it answers: what is this system actually modeling, in the language of the business, not the database?

Key decisions:
- **Ubiquitous language**: define core entities and terms with the business, use them consistently in code, docs, and API naming. A "resident" in Gate Plus should never be called `user_type_2` in code.
- **Bounded contexts**: identify the sub-domains that have their own models and rules even if they share entities. E.g. "Resident" means something different to Billing than to Access Control — don't force one god-model.
- **Core vs. supporting vs. generic subdomains**: spend design effort on what differentiates the product (core), keep supporting domains simple, and buy/borrow generic ones (auth, payments) instead of building them.
- **Domain events**: identify the significant state changes the business cares about (`ResidentCheckedIn`, `VisitorApproved`) — these become the backbone of integration, audit, and notification architecture later.

Default recommendation: write a one-page domain glossary + bounded context map before any schema or API design. For small teams/solo builders, this can be a simple markdown table (entity, definition, owning context) rather than full DDD ceremony.

Common pitfalls:
- Letting the database schema define the domain language instead of the reverse.
- One giant "User" entity trying to serve auth, profile, billing, and permissions at once.
- Skipping this for "simple" apps, then discovering conflicting definitions of a core entity 6 months in.

## 2. System Design & Module Boundaries

What it answers: how is the system decomposed, and what can change independently of what?

Key decisions:
- **Monolith vs. modular monolith vs. microservices**: default to a **modular monolith** unless there's a specific, present-tense reason for microservices (independent scaling needs, separate team ownership, genuinely different tech requirements per service). Microservices chosen for "best practice" reasons alone are a common source of accidental complexity.
- **Module boundaries**: draw them along the bounded contexts from domain modeling, not along technical layers. A module should own its data and expose a clear interface — other modules shouldn't reach into its tables directly.
- **Coupling direction**: define which modules are allowed to depend on which. Shared/generic modules (auth, notifications) can be depended on by everything; core domain modules should not depend on each other bidirectionally.
- **Shared code strategy**: decide explicitly whether to use a shared package/monorepo structure (e.g. Turborepo) or keep apps fully self-contained. Self-contained apps trade some duplication for independence and simpler deploys — a reasonable choice for small teams, especially with 2-3 client apps sharing one backend.
- **Communication style between modules/services**: in-process function calls (monolith/modular monolith) vs. synchronous HTTP/gRPC vs. async events — pick based on whether the caller needs an immediate response and how tolerant the flow is to eventual consistency.

Default recommendation for small-to-mid teams (1-10 engineers) building a new product: modular monolith, one deployable backend, clear internal module boundaries mapped to bounded contexts, extract a service only when a concrete scaling or ownership pressure appears.

Common pitfalls:
- Premature microservices: network calls, deployment complexity, and distributed transactions introduced before there's a real reason.
- Modules that share a database table directly instead of going through each other's interfaces — this quietly recreates a monolith's coupling without any of its simplicity.
- No documented boundary at all — every function can call every other function, and nobody can safely refactor.
