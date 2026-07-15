# Application Layers: Frontend, Backend/API, Service Layer

## 3. Frontend / Presentation Architecture

What it answers: how is UI structured, and how does it stay maintainable as it grows?

Key decisions:
- **State management split**: separate server state (data from the API — use a data-fetching/cache library) from client/UI state (form inputs, modals, toggles — local component state or a lightweight store). Don't put server data in a global store manually; it goes stale and causes bugs.
- **Component architecture**: co-locate by feature, not by type — a `residents/` folder with its components, hooks, and API calls beats a global `components/` + `hooks/` + `api/` split for anything beyond a small app.
- **Multi-app strategy**: when there are multiple client apps (e.g. resident/guard/admin apps) sharing one backend, decide per-app whether shared UI packages are worth the coupling cost vs. each app owning its own UI — especially when the apps have very different UX constraints (e.g. a low-literacy field-worker app vs. an admin dashboard).
- **Offline/connectivity handling**: for mobile or field-use apps, decide explicitly what happens with no network — queue-and-sync, read-only cached view, or hard block — this is a design decision, not an afterthought.
- **Accessibility & constrained-UX audiences**: if a user segment is non-technical or operating under stress/time pressure (e.g. a security guard app), constrain the UI explicitly: large touch targets, minimal taps per task, single primary action per screen.

Default recommendation: feature-folder structure, dedicated server-state library, explicit offline strategy stated even if the answer is "not supported in v1."

## 4. Backend / API Architecture

What it answers: what's the contract between clients and the server, and how is it structured internally?

Key decisions:
- **API style**: REST for straightforward resource CRUD (most CRUD-heavy internal products), GraphQL when clients need flexible, varied data shapes and over/under-fetching is a real cost, gRPC for internal service-to-service calls needing performance and strict contracts. Don't default to GraphQL for its own sake.
- **Layered backend structure**: separate routing/controllers (HTTP concerns) → service layer (business logic) → data access layer (queries) — this is what makes the service layer (#5) testable independent of HTTP.
- **Versioning approach**: decide URL versioning (`/v1/`) vs. header-based versioning up front — see Versioning Strategy (#27) for the deeper tradeoffs.
- **Request/response contracts**: use schema validation (e.g. Zod, class-validator) at the API boundary — validate before business logic ever sees the payload, and generate types from the schema rather than hand-duplicating them.
- **Idempotency**: for any mutating endpoint that might be retried (payments, OTP triggers, webhook handlers), design idempotency keys in from the start — retrofitting this after a duplicate-charge incident is much more painful.
- **Real-time layer**: if the product needs live updates (calling, presence, live status), decide WebSocket/WebRTC infrastructure (e.g. LiveKit for calling) as a distinct concern from the REST API, with an explicit fallback (e.g. phone number fallback when WebRTC fails).

Default recommendation: REST + OpenAPI-style schema validation for most product APIs, layered controller/service/data structure, idempotency keys on all payment/OTP/webhook endpoints from day one.

## 5. Service Layer / Business Logic

What it answers: where does business logic live, and how is it kept independent of transport and storage details?

Key decisions:
- **Logic placement**: business rules live in the service layer, not in controllers (which should stay thin — parse request, call service, format response) and not in the database (avoid smart triggers/stored procedures carrying business logic unless there's a strong consistency reason).
- **Transaction boundaries**: define where a database transaction starts and ends relative to a business operation — a single business action (e.g. "approve visitor") should usually be one transaction even if it touches multiple tables.
- **Cross-module orchestration**: when a business operation spans multiple domain modules (e.g. checking in a visitor touches Access Control, Notifications, and Audit), decide whether that's direct service-to-service calls (simple, synchronous, tightly coupled) or domain events (looser coupling, better for optional side effects like notifications).
- **Business rule testability**: service layer functions should be callable and testable without spinning up HTTP or a real database where possible (see Testing Architecture, #21) — this is often the single biggest lever for a maintainable backend.

Default recommendation: thin controllers, fat services, one transaction per business operation, domain events for optional/non-critical side effects (notifications, analytics) and direct calls for required-consistency effects (access grant + audit log).
