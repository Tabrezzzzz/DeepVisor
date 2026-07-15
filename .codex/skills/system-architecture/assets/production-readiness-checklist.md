# Production Readiness Checklist

> Grade each of the 10 cores as Ready / Partial / Missing, with the specific gap noted. Use this for reviewing an existing or planned system, not for greenfield design (use architecture-doc-template.md for that).

## Domain
- [ ] Core entities have a documented, agreed-on definition
- [ ] Module/context boundaries are drawn and roughly respected in code
- [ ] Gap:

## Data
- [ ] Schema changes go through versioned migrations, never manual edits
- [ ] Each module's data ownership is clear
- [ ] Backups exist and have been test-restored at least once
- [ ] Gap:

## API
- [ ] All endpoints validate input at the boundary
- [ ] Versioning scheme defined even if only v1 exists so far
- [ ] Idempotency handled for retry-sensitive endpoints (payments, OTP, webhooks)
- [ ] Gap:

## Security
- [ ] No secrets in source control; secrets manager used in production
- [ ] Authorization checked on every resource-owning endpoint, not just authentication
- [ ] Rate limiting on auth and paid-per-call endpoints
- [ ] Webhook signatures verified
- [ ] Gap:

## Infrastructure
- [ ] Infrastructure defined as code / reproducible, not manually configured
- [ ] Local dev environment spins up with one command
- [ ] Environment parity between staging and production
- [ ] Gap:

## Scalability
- [ ] Application instances are stateless (can run >1 instance)
- [ ] Database connection pooling configured explicitly
- [ ] Known likely bottleneck identified, with a scaling plan for it
- [ ] Load tested against a realistic peak scenario
- [ ] Gap:

## Observability
- [ ] Structured logs with correlation IDs
- [ ] Error tracking tool in place (e.g. Sentry)
- [ ] Liveness + readiness health checks
- [ ] Alerts scoped to user-visible symptoms, not noise
- [ ] Gap:

## Testing
- [ ] Service layer covered by unit tests
- [ ] Critical flows covered by integration/E2E tests
- [ ] Tests gate CI merge (not just present, but enforced)
- [ ] Gap:

## Deployment
- [ ] CI/CD pipeline: lint → test → build → deploy, gated
- [ ] Rollback is a tested, fast, one-command operation
- [ ] Database migrations are backward-compatible during deploy windows
- [ ] Gap:

## Recovery
- [ ] RPO/RTO targets explicitly defined
- [ ] Documented incident response path (detect → diagnose → fix → postmortem)
- [ ] Clear ownership for who responds to production incidents
- [ ] Gap:

## Overall Risk Summary
- Highest-priority gaps (top 3, ranked by blast radius if they bite):
  1.
  2.
  3.
