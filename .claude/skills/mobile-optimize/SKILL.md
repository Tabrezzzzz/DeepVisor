---
name: mobile-optimize
description: Audit and fix mobile/touch responsiveness for any page, component, or the whole app in this repo — layout breakpoints, touch targets, iOS zoom, safe-area insets, hover-only traps. Trigger: /mobile-optimize
---

# /mobile-optimize

Make a page, component, or the whole app work correctly on phones — not just "shrink until it fits," but touch-correct, zoom-safe, and readable at 375px width.

## Usage

```
/mobile-optimize                          # audit + fix the whole app
/mobile-optimize src/app/(root)/reports   # audit + fix one route/section
/mobile-optimize src/components/campaigns/AdSetTable.tsx   # single component
/mobile-optimize --audit-only             # run the heuristic scanner, report findings, fix nothing
```

If no path is given, treat the target as the whole `src/app` + `src/components` tree.

## Step 1 — Run the scanner first

Always start with the repeatable static-analysis pass instead of eyeballing files cold:

```
node scripts/audit-mobile-optimization.mjs
```

This flags, with file:line-ish precision:
- Fixed pixel widths in a CSS module with no `@media` block anywhere in the file
- Interactive elements (buttons, icon buttons, nav/menu items) sized under 44px — the Apple HIG / Material touch-target minimum
- `input`/`textarea`/`select` with `font-size` under 16px — triggers unwanted auto-zoom on iOS Safari focus
- Wide grids (`repeat(5+, ...)`) with no responsive narrowing
- Fixed top/bottom bars missing `env(safe-area-inset-*)` — content gets clipped under the iPhone notch/home indicator
- `:hover`-only reveals with no `:focus`/`:active`/`data-active` fallback — invisible/unreachable on touch devices
- Missing explicit `viewport` export in `src/app/layout.tsx`

The scanner is a heuristic net, not ground truth — false positives happen (e.g. a small `ThemeIcon` that is decorative, not tappable). Read the flagged block before changing it. It also won't catch everything — this repo's real mobile bugs (content jumping under `MobileAppChromeClient`'s bottom nav, a table that needs horizontal scroll instead of column collapse) require reading the component, not just grepping.

## Step 2 — Fix using this repo's actual patterns, not generic advice

This app is Next.js 16 (App Router) + Mantine v8 + Tailwind + CSS Modules. Do not invent a different mobile strategy (no separate `m.` mobile site, no UA-sniffing, no new CSS framework). Use what's already here:

**Breakpoint scale already in use** (`src/globals.css`, various `*.module.css`) — reuse these values, don't invent new ones:
- `760px` — the dominant mobile/desktop split (used 11+ times)
- `1020px` / `1080px` / `1100px` / `1180px` — secondary tablet/laptop breakpoints
- Prefer `@media (max-width: 760px)` for "mobile" unless the component already establishes its own breakpoint

**Mantine responsive props** — before writing a custom `@media` block, check if the Mantine component already supports a responsive prop object, e.g. `<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} />` (see `src/app/onboarding/components/OnboardingProvider.tsx` and `src/app/workspace/new/components/WorkspaceCreateClient.tsx` for the established pattern). This is preferred over hand-written media queries for Mantine components.

**Safe-area insets** — for anything fixed to the top or bottom of the viewport, follow `src/components/layout/MobileAppChromeClient.tsx`:
```
paddingTop: 'env(safe-area-inset-top)'
className="... pb-[calc(0.45rem+env(safe-area-inset-bottom))] ..."
```
And in CSS: `padding: 12px 0 calc(7rem + env(safe-area-inset-bottom));` (see `src/globals.css` around the app-shell rules).

**Touch targets** — minimum 44x44px for anything tappable (buttons, icon buttons, nav items, checkboxes rendered as custom controls). The existing convention for form inputs is `min-height: 44px` / `46px` (see `OnboardingProvider.module.css`).

**iOS zoom prevention** — any text input/textarea/select must render at `font-size: 16px` or larger. If the design wants smaller visual text, scale via a wrapping `transform` or accept 16px — never ship a sub-16px input font.

**Bottom navigation / mobile chrome** — this app already has a dedicated mobile shell (`MobileAppChromeClient.tsx`) with a 5-column bottom nav (`grid-cols-5`) shown via `md:hidden`. If a new page needs mobile-specific navigation or actions, extend that component's pattern rather than building a parallel one. Any page content must reserve bottom padding so it isn't hidden behind the fixed bottom nav — check existing pages for `padding-bottom: calc(7rem + env(safe-area-inset-bottom))` or equivalent.

**Tables** — this app has several data-dense tables (`CampaignTable`, `AdSetTable`, `AdsTable`, `PerformanceTable`). On mobile these should scroll horizontally within a contained wrapper (`overflow-x: auto` on a wrapper div, not the whole page — check `overflow-x: hidden` is set on the page shell per `src/globals.css`) rather than collapsing columns, unless the component already has a card/list mobile variant.

**Hover-only UI** — anything that only appears via CSS `:hover` (tooltips, action buttons revealed on row hover, dropdown affordances) needs a touch-usable path: either always-visible on mobile (`@media (max-width: 760px) { opacity: 1 !important; }`), or triggered by tap/focus with a `data-active`/`:focus-within` fallback.

**Dark mode** — this app has a `dark` class strategy (`:global(.dark) .xyz`). If you change desktop styles for a mobile fix, verify the change doesn't break the existing `:global(.dark)` overrides in the same file.

## Step 3 — Verify

- Re-run `node scripts/audit-mobile-optimization.mjs` and confirm the findings you targeted are gone (some findings may be acceptable false positives — say why you left them).
- Run `npm run lint` and `npm run typecheck`.
- For UI changes, start the dev server and check the page at a 375px-wide viewport (iPhone SE) and a 768px-wide viewport (iPad portrait) in a browser before reporting done. Confirm:
  - No horizontal scroll on the page itself (only intentional scroll containers, e.g. tables)
  - Nothing is clipped behind the bottom nav or notch
  - Every tap target is comfortably tappable with a thumb
  - Tapping/focusing reveals anything that was hover-only on desktop
- Do not claim the task is complete without this manual check — lint/typecheck verify correctness, not that the layout actually looks right on a phone.

## What NOT to do

- Don't add a new CSS-in-JS library, a new breakpoint system, or a mobile detection library (`react-device-detect`, etc.) — Mantine's responsive props + the existing `@media` breakpoints are sufficient and consistent with the rest of the app.
- Don't gate features behind `useMediaQuery`-based conditional rendering unless the desktop and mobile experiences are genuinely structurally different (e.g. `MobileAppChromeClient` vs `Topbar`/`Sidebar`) — prefer CSS-only responsive layout wherever the same markup can just reflow.
- Don't reduce touch targets below 44px to "match" a dense desktop design — dense desktop tables and 44px mobile targets are not mutually exclusive; use different densities per breakpoint.
