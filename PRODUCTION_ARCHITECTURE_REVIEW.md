# DeepVisor Production Architecture Review

Date: July 10, 2026

Scope: production readiness, multi-workspace architecture, Meta/Facebook developer compliance, Google Ads architecture, and privacy requirements for the current DeepVisor app.

## Current Architecture Observed

- App runtime: Next.js app router with server components, route handlers, Supabase SSR auth, Supabase admin client, and client dashboards.
- Data platform: Supabase Postgres, RLS policies, migrations, Supabase Vault-style RPCs for integration secrets, and Supabase Edge Functions.
- Core tenant model: `organizations`, `organization_memberships`, and `business_profiles`.
- Current business context: `getRequiredAppContext` loads the authenticated user, then resolves a cached organization/business context.
- Current selection model: active platform/ad account is resolved from cookies named `platform_integration_id` and `ad_account_row_id`.
- Integrations: Meta and Google Ads are represented as `platform_integrations`, `ad_accounts`, sync jobs, credentials, and performance tables.
- Meta sync: structure, performance, lead forms/leads, audience breakdowns, hourly rows, and intelligence artifacts exist in server sync modules.
- Google Ads integration: OAuth URL/token exchange, workspace credentials, accessible customer discovery, selected ad account storage, and Google sync modules exist. Google should be treated as an activated reporting integration, not a preview channel.
- Privacy surface: a public privacy policy exists and describes connected platform data, retention, AI processing, and email-based deletion requests.

## Production Readiness Rating

| Area | Status | Findings |
| --- | --- | --- |
| Domain model | Partial | Organizations and memberships exist, but app context still chooses the first membership. Multi-workspace switching needs a first-class selected workspace model. |
| Data model | Partial | Business-scoped tables and RLS exist, but many app routes use service-role access and manual `business_id` filters. That needs a full authorization audit. |
| API boundaries | Partial | Route handlers are mostly business-scoped, but validation and role checks are inconsistent. Add schema validation and shared authz helpers before launch. |
| Security | Partial | Token storage uses secret references, which is the right direction. Remaining blockers are secret deletion/rotation, rate limits, audit logs, and service-role containment. |
| Privacy/compliance | Not ready | Privacy policy exists, but Meta data deletion callback and review-ready Platform Data language are not implemented. |
| Infrastructure | Partial | Supabase migrations and functions exist. Missing production CI gates, staging parity, deployment runbooks, and migration checks. |
| Scalability | Partial | Sync orchestration exists, but needs idempotency guarantees, locks, retry budgets, dead-letter states, and query budgets for larger accounts. |
| Observability | Not ready | No confirmed correlation IDs, structured logs, Sentry-style error tracking, provider API telemetry, or health dashboard. |
| Testing | Not ready | `package.json` exposes lint/build only; no test scripts are defined for unit, integration, or Playwright smoke coverage. |
| Recovery | Not ready | No documented RPO/RTO, restore drill, deletion recovery policy, or incident workflow. |

Production verdict: DeepVisor has a credible app foundation, but it is not production-ready for multi-business paid use until workspace authorization, Meta privacy/deletion, service-role containment, observability, and CI/test gates are closed.

## Multi-Workspace Architecture

Use the existing tenant model instead of creating a new parallel workspace table.

### Target Model

- `organizations`: the workspace container. Agency and business types remain valid.
- `organization_memberships`: user-to-workspace membership with role.
- `business_profiles`: business configuration attached to an organization.
- `platform_integrations`: connected provider account scoped to one business profile.
- `ad_accounts`: provider ad account rows scoped to one business profile and platform.
- New preference table or profile setting: selected workspace and selected business per user.
- Existing selection cookies should become workspace-scoped, for example by storing `{ organizationId, businessId, platformIntegrationId, adAccountId }` and validating every value against membership.

### Required Flow Changes

1. Add "Create workspace" and "Switch workspace" flows.
2. Make onboarding create or update the current selected workspace, not assume a single default workspace.
3. Update `getRequiredAppContext` so it loads the selected organization membership first, validates role, then resolves the business profile.
4. Add invite/member APIs with role checks: owner, admin, member, viewer.
5. Re-scope all settings, reports, campaigns, leads, calendar, and integrations to the selected workspace.
6. Add workspace-level audit logs for membership, integrations, sync, export, delete, and billing changes.

### Authorization Rule

Every server action and route handler must prove:

1. The user is authenticated.
2. The user is a member of the selected organization.
3. The requested `business_id` belongs to that organization.
4. The user's role allows the operation.
5. Any selected platform/ad account belongs to that same business.

Service-role access should be allowed only after those checks pass.

## Meta / Facebook Developer Compliance Architecture

Official Meta sources checked:

- Meta Platform Terms: https://developers.facebook.com/terms/dfc_platform_terms/
- Data Deletion Request Callback: https://developers.facebook.com/documentation/development/create-an-app/app-dashboard/data-deletion-callback
- App Review: https://developers.facebook.com/documentation/resp-plat-initiatives/individual-processes/app-review
- Marketing API Access Tier update, May 4, 2026: https://developers.meta.com/blog/updates-to-ads-management-standard-access-feature/
- Permissions reference: https://developers.facebook.com/docs/permissions/
- Lead retrieval guidance: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving

### Compliance Gaps

- The app does not currently expose a Meta data deletion callback route.
- The privacy policy has deletion language, but it needs tighter Meta Platform Data language and a clear data deletion route or form.
- Permission use is not documented in a review-ready inventory.
- API call/error telemetry is not explicit, which matters for Marketing API Access Tier evidence.
- There is no visible App Review evidence bundle for permission justification, test user flow, and callback URLs.

### Required Meta Controls

- Add `POST /api/meta/data-deletion` or equivalent callback route.
- Verify Meta signed requests with the app secret.
- Store deletion requests in a durable table with status, confirmation code, user/provider id, workspace id when known, and completion timestamps.
- Delete or queue deletion for Meta-derived data: tokens, integrations, ad accounts, campaigns, ad sets, ads, creatives, leads, reports, intelligence, raw payload cache, sync state, and provider identifiers.
- Return the response shape Meta expects: confirmation URL and code.
- Add a public deletion status page.
- Add in-app disconnect and delete-data controls for each connected integration.
- Do not delete shared workspace data immediately when one member disconnects unless that user is the data controller/owner for that workspace or deletion is requested by an authorized workspace admin.

### Permission Direction

Current OAuth default scopes in code:

- `ads_read`
- `business_management`
- `pages_show_list`
- `pages_read_engagement`
- `instagram_basic`

Recommended review:

- Keep `ads_read` for reporting and metrics.
- Use `ads_management` only if campaign create/edit/publish features are live for customers.
- Use `leads_retrieval`, `pages_show_list`, and page permissions only if lead sync is available and documented.
- Remove `instagram_basic` unless the app uses Instagram account metadata in a way the UI can demonstrate.
- Prefer Meta Business Login configuration when possible so permission review and business account selection remain controlled.

## Google Ads API Architecture

Official Google sources checked:

- Google Ads API OAuth overview: https://developers.google.com/google-ads/api/docs/oauth/overview
- Google Ads Query Language overview: https://developers.google.com/google-ads/api/docs/query/overview
- Google Ads API metrics reference: https://developers.google.com/google-ads/api/fields/v24/metrics
- Developer token and access levels: https://developers.google.com/google-ads/api/docs/api-policy/developer-token
- Access Levels and Permissible Use: https://developers.google.com/google-ads/api/docs/api-policy/access-levels
- Production access levels and RMF: https://developers.google.com/google-ads/api/docs/productionize/access-levels

### Current Google Implementation

- Google OAuth is implemented with `https://www.googleapis.com/auth/adwords`.
- The app can use env-level Google Ads credentials or workspace-level credentials stored in `google_ads_workspace_credentials`.
- Workspace credentials include `client_id`, Vault-backed client secret, Vault-backed developer token, optional `login_customer_id`, and scopes.
- Accessible customers are discovered through the Google Ads API and normalized into app `ad_accounts`.
- Google sync modules exist under `src/lib/server/sync/google`.

### Required Backend Model

Google Ads should be modeled as a first-class provider with this hierarchy:

1. Manager account, optional: `login_customer_id`.
2. Customer account: the selected Google Ads account.
3. Campaign.
4. Ad group.
5. Ad.
6. Asset, keyword, audience, conversion action, and search term surfaces where supported by the API and permissions.

The shared `ad_entities` model can store Google campaigns/ad groups/ads, but Google-specific metadata must be preserved:

- campaign channel type: Search, Performance Max, Display, Video, Shopping, Demand Gen, App, Local.
- campaign bidding strategy and budget.
- campaign primary status and serving state.
- ad group type and primary status.
- ad final URLs and asset relationships where available.
- conversion action source and category.
- customer currency, timezone, manager status, and account status.

### Required Metrics

Use Google Ads API metrics and segments through GAQL. Core rows should include:

- Delivery: impressions, clicks, cost micros, interactions, engagement rate.
- Efficiency: CTR, average CPC, average CPM, cost per conversion, conversions, conversion value.
- Business outcome: ROAS from conversion value divided by cost, CPA, conversion rate.
- Quality/search: search impression share, search lost IS budget, search lost IS rank, top impression share, absolute top impression share.
- Campaign health: optimization score where available, budget limited status, serving status, policy/disapproval signals.
- Segments: date, device, advertising channel type, network, conversion action, hour where useful.

Never create fake current-month Google rows from lifetime summaries. Google report charts must use dated rows for date charts and clearly label lifetime/account-summary rows separately.

### Access And Production Requirements

- A Google Ads developer token is required for API calls.
- Token access level controls production access and quotas. Current Google docs describe Test Account, Explorer, Basic, and Standard access levels.
- Explorer/Basic can support early production reporting, but Standard Access and RMF planning are required if DeepVisor grows into broad campaign management.
- Store refresh tokens only as Vault secret references.
- Support both app-level and workspace-level Google credentials, but the UI must show which mode is active.
- Add telemetry for API operations, quota pressure, customer-level errors, GAQL errors, and refresh-token failures.

### Google Ads Frontend Design Contract

Design direction from `frontend-design`: refined operational command center, not a Google Ads clone. Use DeepVisor typography, orange/black controls, original Google Ads icon colors only for platform identity, and dense scannable tables with clear metrics.

Google should be active in these product surfaces:

- Header selector: show real Google Ads customer name, customer ID, currency, timezone, and manager/direct account state. Do not show `PREVIEW` for connected Google Ads.
- Integrations page: Google card should support connect, reconnect, select customer, configure workspace credentials, sync now, view diagnostics, and disconnect.
- Dashboard: Google-selected overview should replace Meta-only lead language with Google Ads terms: conversions, conversion value, CPA, ROAS, CTR, CPC, impression share, and budget-limited risk.
- Campaigns page: the main table should support Google campaigns with channel type, status, budget, spend, conversions, conversion value, ROAS, CPA, CTR, CPC, impression share, and recommendation.
- Campaign drilldown: Campaign -> Ad groups -> Ads -> Assets/Keywords/Search terms where data exists.
- Reports page: filters should include Google customer, campaign, ad group, channel type, device, network, conversion action, and date range.
- Insights page: insights should detect budget-limited winners, high CPA campaigns, low CTR/high impression campaigns, lost impression share from rank/budget, weak conversion value, and campaign/channel mix issues.
- Leads page: Google Ads should not be forced into Meta lead-form UI. For Google, show conversions and imported/offline conversion status unless lead form assets are explicitly synced later.
- Calendar/Approvals: budget reviews, search term reviews, CPA spikes, limited-by-budget checks, conversion tracking checks, and report delivery tasks should be generated from Google data.
- Settings: show Google Ads credential mode, developer token access level if known, manager account, selected customer, OAuth consent status, sync freshness, and quota/error health.

### Google-Specific Page Layouts

1. Google Account Setup
   - Left: credential mode, OAuth status, developer token status, manager login customer ID.
   - Right: customer picker with searchable accessible accounts and account metadata.
   - Bottom: diagnostics timeline for OAuth, customer discovery, sync, and latest GAQL error.

2. Google Campaigns
   - Top: four metric cards on the left, channel mix or efficiency chart on the right.
   - Primary surface: full-width campaign table with sticky filters and clear row click targets.
   - Row drawer: budget, bidding, conversion, impression-share, and recommendation blocks.

3. Google Ad Groups
   - Campaign context header.
   - Ad group table with status, type, bid/bidding context, spend, conversions, CPA, CTR, CPC, and search impression share.
   - Comparison panel for best/worst ad groups.

4. Google Ads / Assets
   - Creative asset matrix grouped by ad, asset type, policy state, impressions, clicks, CTR, conversions, and cost.
   - No Meta-style preview iframe unless Google creative preview API support is implemented.

5. Google Search Terms / Keywords
   - Query table with spend, clicks, conversions, CPA, match type, keyword, campaign, ad group, and action recommendation.
   - Controls for negative keyword suggestions should remain review-only until mutate flows are implemented.

6. Google Reports
   - Default active charts: campaign ranking bars and spend-vs-conversions efficiency.
   - Alternate charts: channel mix, impression-share loss, CPA distribution, device performance, conversion action mix, and budget-limited map.
   - All chart labels must state whether the source is daily, segment, or account-summary data.

### Google Campaign Mutation Boundary

Google Ads campaign create/edit should remain disabled until a Google-specific builder exists. Do not route Google selection into the Meta campaign builder. When users click "New campaign" with Google selected, show a Google campaign planning page with:

- synced account context,
- required API access level,
- supported campaign types,
- draft plan fields,
- and a clear "publishing not enabled yet" state until mutate services and policy checks are implemented.

## Production Remediation Plan

### Phase 1: Tenant Safety

- Add selected workspace persistence.
- Update app context to resolve selected membership.
- Add shared `requireWorkspaceRole` and `requireBusinessAccess` helpers.
- Audit every `createAdminClient` caller and add explicit authz checks.
- Scope platform/ad-account cookies by workspace.

### Phase 2: Meta Compliance

- Add Meta data deletion callback and public deletion status page.
- Update privacy policy for Platform Data, deletion, retention, sharing, and AI processing.
- Create permission inventory and App Review evidence package.
- Add Marketing API call/error telemetry.

### Phase 2B: Google Ads Activation

- Remove remaining Google preview/coming-soon language from reporting, dashboard, header, and integrations surfaces.
- Keep Google campaign publishing disabled until a Google-specific campaign builder and mutation authorization model exists.
- Add Google customer/ad account setup diagnostics.
- Add GAQL-backed campaign, ad group, ad, keyword/search term, conversion, and report data models.
- Add Google Ads quota/error telemetry and developer-token access level visibility.

### Phase 3: Production Operations

- Add CI for lint, typecheck, build, migrations, and tests.
- Add Playwright smoke coverage for auth, onboarding, workspace switching, integrations, reports, campaigns, and leads.
- Add structured logs, correlation IDs, Sentry-style error tracking, health checks, and alerting.
- Add sync job idempotency, locks, retries, dead-letter status, and operator replay.

### Phase 4: Scale And Recovery

- Add query/index budgets for reporting tables.
- Add retention and deletion jobs.
- Define backups, restore drills, RPO/RTO, incident runbooks, and release rollback.
- Add workspace billing and limits.

## Open Decisions

- Whether agencies can own multiple client business profiles inside one organization, or each client gets a separate organization.
- Whether deletion is user-level, workspace-level, provider-level, or all three.
- Whether campaign publishing will be enabled in production; this determines if `ads_management` is required.
- Whether leads are treated as high-sensitivity PII with shorter retention than campaign metrics.
- Whether Google Ads credentials remain app-level by default or workspace-level for agencies.
