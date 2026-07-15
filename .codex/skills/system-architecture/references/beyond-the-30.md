# Beyond the 30: Additional Architecture Heads Worth Considering

These are commonly missing from architecture checklists but matter for a genuinely production-grade system. Bring them up when relevant to the system being designed — they don't all apply to every project.

## Cost / FinOps Architecture
What it answers: what does this cost to run, and does the architecture make cost visible before it's a surprise?
- Tag/attribute cloud spend by service or tenant where multi-tenant, so cost-per-customer is knowable.
- Design usage-based cost drivers (per-SMS OTP, per-minute calling infra, per-GB storage/egress) into the pricing model early — these are easy to underestimate for products like Gate Plus that lean on SMS OTP and WebRTC calling.
- Set budget alerts before launch, not after the first surprising bill.

## Rate Limiting & Abuse Prevention
What it answers: how is the system protected from being overwhelmed or exploited, by bad actors or by its own bugs?
- Distinct from general security (#8) — this is specifically about volume: per-user, per-IP, and per-endpoint rate limits, especially on OTP-send, search, and any endpoint that costs money per call.
- Bot/abuse detection for public-facing forms (signup, OTP request) to prevent cost-draining abuse (e.g. SMS pumping fraud).

## Feature Flags & Experimentation Architecture
What it answers: how are new features rolled out, tested, and killed without a full deploy cycle?
- Distinct system from environment config (#24) — flags change more often and often need per-user/per-tenant targeting.
- Explicit flag lifecycle: every flag has an owner and a planned removal date; flags that outlive their rollout become permanent hidden complexity.

## Internationalization & Localization Architecture
What it answers: does the system support multiple languages/locales/currencies, and how deeply is that baked into the data model vs. bolted on?
- Decide early if this is in scope at all — retrofitting i18n into a system that assumed one language/locale (date formats, currency, text direction) is expensive.
- Store user-facing strings keyed for translation from the start even if only one language ships initially, if multi-language is even plausible for the roadmap.

## Accessibility Architecture
What it answers: can users with disabilities actually use this?
- Applies most concretely to frontend architecture (#3) — semantic HTML/component structure, keyboard navigation, screen-reader support are much cheaper to build in from the start than retrofit.
- Especially relevant for any app serving a broad or non-technical user base (e.g. resident-facing apps).

## AI/ML Integration Architecture
What it answers: where do AI/ML components sit in the system, and how are their failure modes handled differently from deterministic code?
- Treat model calls as an external dependency (see Integration Architecture, #10) with their own timeout/fallback/cost characteristics — non-deterministic output needs different error handling than a typical API call.
- Version prompts/models explicitly and log inputs/outputs for debugging and evaluation — "it just didn't work that one time" is much harder to debug without this.
- Design a human-review or confidence-threshold fallback path for AI-driven decisions that have real consequences (e.g. auto-approving something) rather than trusting model output unconditionally.

## Data Privacy & Compliance-by-Design
What it answers: is privacy a property of the architecture, or an afterthought bolted on before an audit?
- Data minimization: collect only what's needed for the stated purpose, especially for sensitive categories (ID documents, biometric-adjacent data like photos for access control).
- Right-to-deletion/export as a designed data-layer capability (can you actually delete or export one user's data across every table/service that touches it?) rather than a manual, error-prone one-off script written under audit pressure.
- Data residency requirements, if applicable, should inform infrastructure/region choices (#23) directly.
