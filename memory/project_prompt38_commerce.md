---
name: project-prompt38-commerce
description: Prompt 38 — Cricket Commerce Marketplace, Vendor Portal, Team Kit Orders, Sponsorship, and Commerce Safety. Migration 0024, 26 new routes, 57 test files passing (1118 tests).
metadata:
  type: project
---

Prompt 38 implemented the full cricket commerce foundation. All quality gates pass.

**Why:** Real cricket leagues need a safe vendor catalog, team kit ordering, and sponsorship management system without payment processing risk.

**How to apply:** Commerce is provider-gated. Default mode is `request_only` — catalog browsing and order requests work without payment config. Set `CRICKET_PAYMENTS_ENABLED=true` + Stripe keys only when ready for real payments.

## What Was Added

- Migration: `0024_cricket_commerce_marketplace.sql`
- Tables: 13 new tables (vendors, products, variants, reviews, carts, cart_items, orders, order_items, team_kit_requests, sponsorship_packages, sponsorship_inquiries, commerce_events, product_categories)
- 26 new routes across /cricket/store/*, /cricket/vendor/*, /cricket/leagues/[slug]/commerce/*, /cricket/teams/[teamSlug]/kits/*, /cricket/sponsorship, /cricket/leagues/[slug]/sponsors/*
- Commerce policy engine: prohibited category enforcement (gambling, alcohol, supplements, weapons, etc.)
- Provider architecture: request_only (default) + Stripe (gated behind env flag)
- Tests: 1118 total (57 files), includes 29 new validation tests, 14 policy tests, 13 provider tests, 13 UI component tests

## Quality Gate Results
- Lint: 0 errors
- Typecheck: 0 errors
- Tests: 1118/1118 pass
- Build: Success

## Key Files
- `lib/cricket/commerce/policy.ts` — policy engine
- `lib/cricket/commerce/providers/` — checkout provider architecture
- `lib/cricket/validation/vendors.ts`, `commerce.ts`, `team-kit.ts`, `sponsorship.ts`
- `lib/cricket/commerce/vendors/`, `products/`, `cart/`, `orders/`, `team-kits/`, `sponsorship/`

## Operator Next Steps
```
npx supabase db push
npm run dev
```
Then test marketplace, vendor portal, product approval, cart/order request, team kit request, sponsorship inquiry.

[[project-prompt37-community]]
