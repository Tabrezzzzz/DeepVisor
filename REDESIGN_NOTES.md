# DeepVisor Redesign Notes

## What Changed
- Reworked the app direction from the old vertical/salon framing into an AI Performance Marketing Command Center.
- Added a root orange/black theme, platform-theme overrides, larger app-shell controls, and a full dark sidebar with Lucide navigation.
- Rebuilt public home, login, signup, `/signup`, and `/register` around the new visual language.
- Replaced the old onboarding content with performance-marketing setup options while keeping existing `business_profiles` field compatibility.
- Rebuilt Overview, Campaigns, Insights, Reports, Approvals, and Settings with denser dashboard cards, command panels, tables, and graph-like metric sections.
- Restored Calendar to the real queue-backed client after the static replacement, preserving create/edit/approve queue flows.
- Kept Integration on the real OAuth/account-selection client and restyled the account adding flow with orange focus, larger controls, Lucide icons, and dark-safe surfaces.

## Wiring
- Overview and Campaigns read selected platform/ad-account data and only fall back to demo rows when no synced campaign data exists.
- Insights reads active trend findings and selected-account signals.
- Reports reads archived report records and preserves viewer/download routes.
- Approvals reads notifications and calendar queue items, with server actions for queue approve/dismiss.
- Settings reads business profile, integrations, account rollup, subscription tier, notifications, and report archive.
- Calendar reads the existing business intelligence workspace, queue items, queue templates, and campaign review options.

## Screenshot Influence
- Wide dark rail, 44-48px controls, compact topbar, segmented actions, thin outlined Lucide icons, dense cards, and black chart panels were taken from the reference screenshots.
- Accent color is constrained to `#fd4b23`; platform blue/green/pink variables are overridden to orange/black so account switching no longer changes the app skin.

## Backend And Schema Debt
- Existing database and action fields still include legacy names such as `booking_link` for compatibility. The new UI does not surface salon copy from those fields.
- Some old files under `_archive`, `(unused)`, and generated Supabase types still contain legacy terms and were intentionally left alone.
- The signup aliases required a proxy update so `/signup` and `/register` are treated like `/sign-up` instead of redirecting to `/login`.

## Verification
- Playwright screenshots captured:
  - `.qa/home-current.png`
  - `.qa/login-current.png`
  - `.qa/sign-up-current.png`
  - `.qa/signup-alias-fixed.png`
  - `.qa/login-dark-fixed.png`
  - `.qa/dashboard-clean-context-current.png`
- Clean browser context correctly redirects protected pages to `/login`; authenticated Playwright inspection still needs a usable session state. No auth tokens were stored.
- Targeted ESLint passed with 0 errors. Remaining warning: existing `react-hooks/exhaustive-deps` warning in `src/app/(root)/integration/components/IntegrationClient.tsx`.
- `npm run build` was not run because the user explicitly asked not to build yet.

## Remaining Follow-Up
- Run authenticated Playwright QA after providing a fresh storage state or allowing a manual login in a persistent browser profile.
- Run `npm run lint` and `npm run build` after authenticated visual QA.
- Consider renaming backend/schema fields in a later migration if the product fully leaves service-business terminology.

## Integration Roadmap
- Meta Ads: keep as the primary live account source; continue improving first-sync visibility, account selection, campaign review generation, and lead-quality ingestion.
- Google Ads: keep credential diagnostics and account selection in the Integration flow; complete production OAuth hardening and campaign metric parity.
- CRM and lead tracking: connect qualified lead, call, and revenue outcomes so CPL/CAC/ROAS recommendations can move beyond ad-platform proxy metrics.
- Report export: keep archived viewer/download routes and expand report templates for executive, client, lead quality, waste, creative fatigue, and platform comparison use cases.
- RBAC and client workspaces: formalize owner/admin/analyst/client-viewer permissions across Settings, Reports, Calendar, and Approvals.
- Billing/subscription: connect plan limits to the visible Settings plan cards and enforce account/platform limits consistently.
- Production QA: run authenticated Playwright coverage for Dashboard, Campaigns, Insights, Reports, Calendar, Approvals, Settings, and Integration before build/release.
- Schema cleanup: plan a compatibility migration for legacy service-business field names once all backend readers are updated.
