# Google Ads Integration Todo

## 1. Credentials And Setup

- [x] Confirm `.env` contains `GOOGLE_ADS_CLIENT_ID`.
- [x] Confirm `.env` contains `GOOGLE_ADS_CLIENT_SECRET`.
- [x] Confirm `.env` contains `GOOGLE_ADS_DEVELOPER_TOKEN`.
- [x] Keep `GOOGLE_ADS_LOGIN_CUSTOMER_ID` blank unless requests must route through a manager account.
- [x] Confirm `GOOGLE_ADS_SCOPES=https://www.googleapis.com/auth/adwords`.
- [ ] Add tunnel callback URI in Google Cloud OAuth client.
- [ ] Add localhost callback URI in Google Cloud OAuth client.
- [ ] Restart Next.js after environment changes.

## 2. Platform Model

- [x] Add `google` to supported integration platform types.
- [x] Ensure `platforms` has a Google Ads row.
- [x] Update integration metadata for Google Ads icon, label, status, and requirements.
- [x] Remove preview-only behavior from the Google Ads card once OAuth is implemented.
- [x] Keep server-only Google credentials off the client bundle.

## 3. OAuth Flow

- [x] Add Google Ads support to `/api/integrations/connect/[platform]`.
- [x] Build Google OAuth URL with offline access and consent when refresh token is needed.
- [x] Add Google Ads support to `/api/integrations/callback/[platform]`.
- [x] Exchange authorization code for access token and refresh token.
- [x] Store Google token metadata through the existing integration token vault.
- [x] Support reconnect and refresh-token replacement.
- [x] Handle OAuth denial, missing code, invalid state, and token exchange errors.
- [x] Redirect back to `/integration` with clear success or error state.

## 4. Google Ads Adapter

- [x] Create `src/lib/server/integrations/adapters/google.ts`.
- [x] Implement `buildAuthorizationUrl`.
- [x] Implement `exchangeCodeForToken`.
- [x] Implement `refreshAccessToken`.
- [x] Implement Google Ads API request helper with `developer-token`.
- [x] Add optional `login-customer-id` header when configured.
- [x] Normalize Google API errors into user-safe messages.
- [x] Add request logging guard similar to Meta debug behavior.

## 5. Account Discovery

- [x] Fetch accessible Google Ads customer IDs after OAuth.
- [x] Fetch customer details for each accessible account.
- [x] Store discovered Google Ads accounts in `ad_accounts`.
- [x] Normalize Google customer ID, display name, currency, and timezone.
- [x] Mark manager accounts separately from advertiser accounts when detectable.
- [x] Show account picker on `/integration`.
- [x] Require a primary Google Ads account selection before first sync.

## 6. Account Selection

- [x] Add `/api/integrations/google/ad-accounts`.
- [x] Add `/api/integrations/google/select-ad-account`.
- [x] Reuse shared selected ad account state where possible.
- [x] Enqueue first sync job after account selection.
- [x] Show sync progress and final status in the integration UI.
- [x] Allow reconnect without losing selected account history.

## 7. Sync Pipeline

- [x] Add Google sync job type support.
- [x] Sync account metadata.
- [x] Sync campaigns.
- [x] Sync ad groups.
- [x] Sync ads.
- [x] Sync assets/creatives where available.
- [x] Sync daily performance metrics.
- [ ] Sync hourly performance metrics if supported and useful.
- [x] Update sync state after each successful stage.
- [x] Store raw payload JSON for fields that do not map cleanly yet.
- [x] Add retry behavior for transient Google API failures.
- [x] Add clear failure messages for quota, permission, and developer-token errors.

## 8. Data Normalization

- [x] Map Google campaigns into shared `ad_entities`.
- [x] Map Google ad groups into shared `ad_entities`.
- [x] Map Google ads into shared `ad_entities`.
- [x] Map Google assets into creative tables or Google-specific metadata.
- [ ] Normalize spend, impressions, clicks, CTR, CPC, CPM, conversions, conversion value, and ROAS.
- [x] Preserve Google-specific metrics in JSON fields or new typed columns.
- [ ] Confirm report RPCs work for `platform = google`.

## 9. Analytics

- [ ] Account overview KPIs.
- [ ] Platform comparison: Meta vs Google Ads.
- [ ] Campaign drilldowns.
- [ ] Ad group drilldowns.
- [ ] Ad-level drilldowns.
- [ ] Creative/asset performance.
- [ ] Daily, weekly, and monthly trends.
- [ ] Hourly performance heatmap.
- [ ] Budget pacing.
- [ ] Funnel metrics from impressions to conversions.
- [ ] Top movers and losers.
- [ ] Current period vs previous period comparisons.
- [ ] Account health score.

## 10. Creative Analytics

- [ ] Creative fatigue detection.
- [ ] Best and worst creative ranking.
- [ ] Asset-level performance where Google exposes data.
- [ ] Headline and description performance for search ads.
- [ ] Creative testing matrix.
- [ ] Kill, keep, or scale recommendation per creative.
- [ ] Creative library filters by platform, format, date, and performance.

## 11. Audience And Placement Analytics

- [ ] Location breakdowns.
- [ ] Device breakdowns.
- [ ] Network or placement breakdowns where available.
- [ ] High-cost segment detection.
- [ ] Underused opportunity detection.
- [ ] Geo opportunity map.
- [ ] Lead quality breakdowns after CRM data is available.

## 12. Budget And Scaling Intelligence

- [ ] Budget waste detection.
- [ ] Campaigns ready to scale.
- [ ] Campaigns that should be cut back.
- [ ] Spend spike detection.
- [ ] Conversion drop detection.
- [ ] Diminishing return detection.
- [ ] Suggested daily budget changes.
- [ ] Portfolio budget allocation across Meta and Google.

## 13. AI Intelligence

- [ ] Daily Google Ads summary.
- [ ] Weekly cross-platform executive summary.
- [ ] Plain-English campaign diagnosis.
- [ ] Root-cause explanation for KPI changes.
- [ ] Recommended next actions with confidence score.
- [ ] AI-generated experiment ideas.
- [ ] AI-generated report commentary.
- [ ] Assistant answers for Google Ads questions.
- [ ] Alert prioritization by urgency.

## 14. Reports

- [ ] Google Ads account report.
- [ ] Google campaign report.
- [ ] Google ad group report.
- [ ] Google ad report.
- [ ] Cross-platform report.
- [ ] Saved report views.
- [ ] PDF export.
- [ ] CSV export.
- [ ] Scheduled email reports.
- [ ] Shareable report links.
- [ ] Report archive.
- [ ] Custom KPI selection.

## 15. Dashboard UX

- [ ] Add Google Ads to global platform selector.
- [ ] Add Google Ads to global ad account selector.
- [ ] Add Google data to KPI cards.
- [ ] Add Google data to campaign health table.
- [ ] Add Google sync status to dashboard.
- [ ] Add Google alerts to priority panel.
- [ ] Add cross-platform comparison view.
- [ ] Add useful empty states for no Google connection and no synced account.

## 16. Integration UX

- [x] Active `Connect Google Ads` button.
- [x] Connected state.
- [x] Reconnect button.
- [x] Disconnect button.
- [x] Account selector.
- [x] Manual sync button.
- [x] Sync progress modal.
- [x] Last successful sync timestamp.
- [x] Permission diagnostics.
- [x] Missing credential diagnostics.
- [x] No account found diagnostics.

## 17. Notifications

- [ ] Google token expired notification.
- [ ] Google sync failed notification.
- [ ] Google account disconnected notification.
- [ ] Spend spike notification.
- [ ] CPL/CPA increase notification.
- [ ] Conversion drop notification.
- [ ] Weekly Google Ads digest.
- [ ] Cross-platform alert preferences.

## 18. Admin And Debug

- [ ] Admin token status view without exposing secrets.
- [x] Google Ads API test-call endpoint for admins.
- [ ] Sync job viewer.
- [ ] Failed job retry.
- [x] Permission checker.
- [x] Developer token validation check.
- [x] Customer access diagnostics.
- [x] DB object health check.

## 19. Product Analytics

- [ ] Track Google connect starts.
- [ ] Track Google OAuth success and failure.
- [ ] Track account selection completion.
- [ ] Track first sync success and failure.
- [ ] Track report usage for Google Ads.
- [ ] Track dashboard usage after Google connection.
- [ ] Track drop-off points in the integration flow.
- [ ] Track route/API errors by integration stage.

## 20. Verification

- [x] Run `npm run types:supabase`.
- [x] Run `npx tsc --noEmit`.
- [x] Run `npm run lint`.
- [ ] Test tunnel OAuth callback.
- [ ] Test localhost OAuth callback.
- [ ] Test connect, account discovery, account selection, and first sync.
- [ ] Test refresh-token flow.
- [ ] Test reconnect flow.
- [ ] Test no-access-account behavior.
- [ ] Test missing developer token behavior.
- [ ] Test reports after Google sync.
- [ ] Test dashboard after Google sync.
