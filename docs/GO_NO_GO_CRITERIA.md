# GameIQ — Go/No-Go Criteria

> Clear, honest criteria for each readiness milestone. Use this before every external demo, pilot session, and launch decision.

---

## Level 1 — Local Founder Demo

**Question:** Can I demo this to myself or a technical friend without embarrassment?

### Go Criteria
- [ ] `npm run dev` starts without errors
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm run build` passes (no failed routes)
- [ ] Demo workspace creates in < 30 seconds (`/demo/setup`)
- [ ] Report dashboard loads with all sections visible
- [ ] Share link opens in a private browser window
- [ ] Export view renders cleanly

### No-Go Criteria
- Any route throws a 500 error in the demo flow
- Report generation fails in mock mode
- Build fails with TypeScript errors
- Demo workspace does not redirect to report after creation

**Current status: ✅ GO**

---

## Level 2 — Advisor or Professor Demo

**Question:** Can I present this to someone who will evaluate the project for academic, investment, or advising purposes?

### Go Criteria (all Level 1 criteria, plus)
- [ ] README is polished and explains the product clearly
- [ ] Pitch docs exist (`PITCH_PRODUCT_ONE_PAGER.md`, `TECHNICAL_BRIEF.md`)
- [ ] Known limitations are clearly documented and the founder can articulate them
- [ ] Report quality is strong enough to demonstrate the value proposition
- [ ] The demo takes < 12 minutes and tells a coherent story
- [ ] The founder can answer: "Why not start with computer vision?" confidently
- [ ] The founder can answer: "How do you prevent hallucinations?" confidently
- [ ] No obvious fake metrics, fake users, or overclaiming

### No-Go Criteria
- README still references "Phase X" internal notes
- Demo data looks obviously fake or broken
- The founder cannot explain the trust architecture in plain language
- Pitch docs claim traction or partnerships that don't exist

**Current status: ✅ GO**  
*All pitch docs exist. README is polished. Known limitations documented.*

---

## Level 3 — Early Coach Demo

**Question:** Can I show this to a real coach and not waste their time or lose their trust?

### Go Criteria (all Level 2 criteria, plus)
- [ ] Production deployment is live (not localhost)
- [ ] Auth works in production (sign up → dashboard flow)
- [ ] Demo workspace works in production (not just dev)
- [ ] Report generation works in production (mock mode at minimum)
- [ ] Share link works in production (opens correctly from different device)
- [ ] Export view prints correctly in Chrome or Safari
- [ ] The founder can explain manual tagging honestly and without apology
- [ ] The founder can explain the no-CV limitation without being defensive
- [ ] Privacy caveats are prepared (what data is stored, who can see it)
- [ ] A feedback collection method is ready (link to `/feedback` or Google Form)
- [ ] The founder has a response ready for "how do I add my team?"

### No-Go Criteria
- Production is not deployed or is on the free tier (Supabase project paused)
- Auth callback fails in production (redirect URL not configured)
- Report generation fails in production with an unhandled error
- No error tracking in place (Sentry not configured — blind in production)
- The founder has not personally run the full flow in production before the demo

**Current status: ⚠️ CONDITIONAL GO** *(updated 2026-06-02 — Prompt 25)*  
*Auth flow fully hardened (Prompt 24B): confirm-password, email validation, safe-redirect helper, profile guarantee. share_links.token UNIQUE constraint added (Prompt 25). Remaining prerequisites: Sentry (P1), Supabase Pro (P1), browser smoke test completed by founder, OpenAI spend cap before enabling real AI.*

---

## Level 4 — Real Coach Pilot (Coach Does It Themselves)

**Question:** Can a coach use this product without the founder present and have a good experience?

### Go Criteria (all Level 3 criteria, plus)
- [ ] Sentry is capturing production errors
- [ ] Supabase is on Pro plan (backups enabled, no auto-pause)
- [ ] CI/CD pipeline exists (no broken builds can ship)
- [ ] OpenAI spend cap is set in dashboard
- [ ] `tokens_used` and `estimated_cost_usd` tracked per report
- [ ] Settings page works (profile update, password reset)
- [ ] Share token UNIQUE constraint is in place
- [ ] New user onboarding is clear enough to complete without hand-holding
- [ ] Rate limiting on analysis generation endpoint is configured
- [ ] Data deletion process is documented and the founder can execute it within 24 hours
- [ ] A support contact method is defined (email or direct message)
- [ ] Privacy disclosure is given to pilot coaches before they upload data
- [ ] Pilot coach sign-up includes acknowledgment of MVP status and data handling

### No-Go Criteria
- No error tracking (founder cannot diagnose production issues)
- Supabase free tier (project can pause during pilot)
- No spend cap (costs uncontrolled)
- Settings page still shows placeholder text
- No data deletion path documented

**Current status: ❌ NOT YET READY** *(updated 2026-06-02 — Prompt 25)*  
*Blockers: Sentry (P1-1), Supabase Pro (P1-3), settings page (P1-5), spend cap (P0-1), rate limiting (P1-8). CI/CD is in place. Auth fully hardened. share_links UNIQUE constraint added. Automated tests 167/167.*

---

## Deployment Go/No-Go (Prompt 22 Addition)

These are deployment-specific criteria added in Prompt 22. They complement the readiness levels above by focusing on whether the _infrastructure_ is correctly configured for each deployment type.

### Ready for Founder Demo Deployment

**Question:** Is the Vercel + Supabase stack correctly set up to run a live demo?

- [ ] `npm run build` passes (no TypeScript or lint errors)
- [ ] Auth works in production (sign up → email confirmed → sign in → dashboard)
- [ ] Demo workspace creates via `/demo/setup` in < 30 seconds
- [ ] Mock AI report generates successfully
- [ ] Share link opens from an incognito window
- [ ] Export view renders and print dialog opens
- [ ] No secrets in `.env.example` (placeholder values only)
- [ ] No secrets in any `NEXT_PUBLIC_` variable

### Ready for Coach Pilot Deployment

**Question:** Is the production environment safe and stable enough for real coaches to use it with their real game data?

- [ ] Supabase Pro plan active (no auto-pause during pilot)
- [ ] All 20 steps in [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md) pass
- [ ] All items in [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md) completed
- [ ] RLS verified: non-members cannot read team data
- [ ] Storage verified: all buckets are private
- [ ] `NEXT_PUBLIC_ENABLE_MOCK_DATA=false` (coaches use real data)
- [ ] `NEXT_PUBLIC_PILOT_MODE=true` (honest MVP positioning)
- [ ] `ADMIN_EMAILS` set to the founder's email(s)
- [ ] Support contact method defined (email or DM) and communicated to pilot coaches
- [ ] Privacy disclosure given to each coach before they upload video data
- [ ] Data deletion process documented (see upcoming Prompt 23 — Operational Runbook)
- [ ] If real AI enabled: spend cap set in OpenAI dashboard

**No-Go Criteria for Coach Pilot:**
- Supabase project is on the free tier (will pause)
- No error tracking in place (founder cannot diagnose production issues blindly)
- No spend cap when `NEXT_PUBLIC_ENABLE_REAL_AI=true`
- Smoke test not completed by the founder personally before first coach session

### Not Ready for Public Beta Unless

- Full privacy policy (legally reviewed — not the MVP placeholder)
- Self-serve data deletion workflow in the product UI
- Team member invitation workflow (coaches can invite other coaches/players by email)
- Password reset flow for non-founders
- Player role scoping (players see only their own report section)
- Rate limiting on all public-facing endpoints
- Real monitoring with automatic alerting (not just manual Supabase checks)
- Automated E2E test coverage on the critical flows with a dedicated test Supabase project
- Admin role stored in the database, not in an env var
- Storage and video limits defined per team or per account

**Current status of public beta:** ❌ NOT READY — multiple months of v1.1 + v1.2 work required.

---

## Level 5 — Public Beta

**Question:** Can we let anyone sign up and use this product unsupervised?

### Go Criteria (all Level 4 criteria, plus)
- [ ] Full privacy policy (legally reviewed, not MVP placeholder)
- [ ] Self-serve data deletion workflow in the product
- [ ] Team member invitation workflow (coaches can invite others)
- [ ] Password reset flow fully implemented
- [ ] OAuth sign-in (at minimum Google) for lower-friction registration
- [ ] Rate limiting on all public-facing endpoints
- [ ] Production monitoring with automatic alerting (not just Sentry — uptime + performance)
- [ ] Player role scoping (players can only see their own data)
- [ ] Consent workflow for player data (explicit acknowledgment before sharing player reports)
- [ ] Automated test suite (unit + E2E) covering at least the critical flows
- [ ] Admin role stored in database, not env var
- [ ] Audit log for privileged operations
- [ ] Supabase storage policies verified against expected access patterns
- [ ] AI output quality validated across multiple real sports (not just demo data)
- [ ] Legal review of platform terms, data handling, and liability

### No-Go Criteria
- Privacy policy is the MVP placeholder
- No self-serve deletion
- No team invitations (blocks multi-user teams)
- No password reset for non-founder users
- No automated tests
- No uptime monitoring

**Current status: ❌ NOT READY — multiple months of work required**

---

## Level 6 — First Paid Pilot

**Question:** Can we charge a real coach for access?

### Go Criteria (all Level 4 criteria, plus the following minimum additions)
- [ ] At least 2 pilot coaches have completed the full workflow with real data
- [ ] Report quality consistently scores ≥ 30/50 on the quality rubric
- [ ] At least 1 coach has said "I would use this every game" unprompted
- [ ] Pricing hypothesis is defined ("$X/month for 1 team")
- [ ] At least 1 coach has said yes to the pricing hypothesis
- [ ] Billing infrastructure exists (Stripe or equivalent — even manual invoicing is acceptable for first paid pilot)
- [ ] The founder can honor a service commitment (uptime, support, data safety)

### No-Go Criteria
- No coach has used the product with real game data
- Report quality is consistently generic
- No coach has confirmed willingness to pay
- Production is not stable enough to make a service commitment

**Current status: ❌ NOT READY — validation must come first**

---

## Quick Reference Summary

| Level | Context | Status |
|-------|---------|--------|
| 1 — Local demo | Founder/technical friend | ✅ GO |
| 2 — Advisor/professor demo | Academic/investor presentation | ✅ GO |
| 3 — Early coach demo | Founder-guided, production | ⚠️ Conditional (P1 fixes needed) |
| 4 — Self-serve coach pilot | Coach uses independently | ❌ Not yet |
| 5 — Public beta | Unrestricted signup | ❌ Not yet |
| 6 — First paid pilot | Charging real coaches | ❌ Validation first |

---

*See also: [`PILOT_READINESS_CHECKLIST.md`](PILOT_READINESS_CHECKLIST.md), [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md), [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md), [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md)*  
*Last updated: 2026-06-02 — Prompt 25: Final Full Test Sweep and Release Candidate Lock*
