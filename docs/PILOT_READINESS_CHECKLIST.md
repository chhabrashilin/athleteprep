# GameIQ — Pilot Readiness Checklist

> A pre-flight checklist before showing GameIQ to a real coach. Run this before every external demo or pilot session.

**Legend:**
- ✅ Ready
- ⚠️ Needs Fix
- ❌ Not Ready
- N/A Not Applicable
- ? Not Tested

---

## Product

| Item | Status | Notes |
|------|--------|-------|
| Landing page loads without errors | ✅ | Verified via build |
| Landing page explains the product clearly | ✅ | 7 sections, MVP-honest positioning |
| Demo workspace can be created in < 30 seconds | ✅ | `/demo/setup` → redirect in ~10s |
| Demo team, roster, game, and report load correctly | ✅ | Madison Cricket XI, 12 events, full report |
| Core flow (team → roster → game → timestamps → report) works end-to-end | ✅ | Verified via code review |
| Report generation completes without error (mock mode) | ✅ | Deterministic mock, no external dependency |
| Report generation completes without error (OpenAI mode) | ? | Requires production API key and testing |
| Share link creation works | ✅ | 4 modes, token generation verified |
| Shared report opens in private/incognito window | ? | Requires runtime verification |
| Export/print view renders cleanly | ✅ | CSS print media verified |
| Coach verification (mark insight) works | ✅ | 4 states, badge updates |
| Inline insight editing works | ✅ | Edit flow and audit trail |
| Back navigation works throughout | ✅ | Breadcrumbs in all views |
| No placeholder or "coming soon" text visible in demo flow | ⚠️ | Settings page still has placeholder text — avoid showing settings in demo |

---

## Data and Privacy

| Item | Status | Notes |
|------|--------|-------|
| No sensitive medical data is requested or stored | ✅ | Player fields: name, jersey, position, height, weight, notes — no medical |
| Coach understands this is an MVP and what that means | ✅ | Landing page has explicit "MVP Honest" section |
| Privacy notice exists at `/privacy` | ✅ | MVP-appropriate placeholder with honest scope |
| Video privacy is explained (private bucket, not shared) | ✅ | Documented in KNOWN_LIMITATIONS and landing page |
| Coach can control share link visibility (private, staff, player-specific) | ✅ | 4 visibility modes implemented |
| Share links can be revoked | ✅ | Revocation supported |
| Process for deleting pilot team data is documented | ⚠️ | Supabase dashboard manual delete — document in pilot onboarding |
| No real player data is used in demo without consent | ✅ | Demo data uses fictional players |
| Coach knows their uploaded video is stored in private cloud storage | ? | Should be explained verbally during pilot onboarding |
| No youth athlete data protection (COPPA) requirements addressed | ⚠️ | If any pilot team has under-13 players, defer or add consent workflow |

---

## Security

| Item | Status | Notes |
|------|--------|-------|
| Auth works (sign up, sign in, sign out) | ✅ | PKCE flow, session middleware |
| Unauthenticated users cannot access team data | ✅ | Middleware enforced |
| RLS is enabled on all 17 tables | ✅ | Verified in MVP Readiness Report |
| Video bucket is private (not public) | ✅ | Private bucket, signed URLs only |
| Signed URLs are not included in share links | ✅ | `canShowVideo = false` in all share views |
| AI API keys are server-only (not in browser) | ✅ | Never prefixed with NEXT_PUBLIC_ |
| Service role key is server-only | ✅ | Never sent to client |
| Share tokens use strong entropy (144-bit) | ✅ | `crypto.randomBytes(18).toString('base64url')` |
| Admin routes are protected | ✅ | `ADMIN_EMAILS` env var check |
| No `.env` file is committed to git | ✅ | `.gitignore` verified |
| OpenAI monthly spend cap is set | ⚠️ | Must do before enabling `AI_PROVIDER=openai` in production |
| Production error tracking (Sentry) configured | ❌ | Not yet set up — P1 issue |
| Database backups enabled (Supabase Pro) | ⚠️ | Requires Pro plan upgrade before pilot stores real data |

---

## UX

| Item | Status | Notes |
|------|--------|-------|
| Coach can understand the workflow without hand-holding | ⚠️ | Setup checklist helps but no guided onboarding modal |
| Empty states exist for teams/games/players lists | ✅ | Verified |
| Report is readable and well-organized | ✅ | 6-section dashboard, confidence badges |
| Confidence scores and evidence links are visible | ✅ | Every insight shows both |
| Coach can find and use verification controls | ✅ | Available on every insight |
| Share modal is easy to use | ✅ | 4-mode selector, copy URL button |
| Export view is print-ready | ✅ | Section selector, no sidebar |
| Mobile viewing of shared report is acceptable | ? | Not runtime-tested |
| Timestamp form is usable in a reasonable time | ⚠️ | 12 fields — friction risk; monitor in pilot |
| No unexplained error states visible in demo flow | ✅ | All error paths handled |

---

## AI

| Item | Status | Notes |
|------|--------|-------|
| AI outputs are validated by Zod schema before storage | ✅ | No unvalidated outputs stored |
| AI hallucination guardrails are active (14 rules in system prompt) | ✅ | Prompt verified |
| AI does not claim to have analyzed video frames | ✅ | Explicitly forbidden in system prompt |
| Confidence scores are shown on all insights | ✅ | High/Medium/Low badges |
| Evidence references are shown and link to real events | ✅ | Evidence panel on insight detail |
| AI limitations are visible to the coach (assumptions field) | ✅ | Shown in report sections |
| Mock mode works without OpenAI API key | ✅ | Deterministic mock generator |
| Real mode (OpenAI) has been tested with a real game input | ? | Requires production API key test |
| Report is useful with 5+ well-labeled timestamps | ? | Requires real coach input to verify |
| Report quality is acceptable with the demo data | ✅ | Demo report is realistic and evidence-linked |

---

## Operations

| Item | Status | Notes |
|------|--------|-------|
| Production deployment is live and stable | ? | Requires Vercel deployment verification |
| All required environment variables are set in Vercel | ? | Must verify before pilot |
| Supabase project is configured with all 10 migrations | ? | Must verify on production project |
| Auth redirect URLs are set in Supabase dashboard | ? | Must verify |
| Storage bucket (`game-videos`) exists and is private | ? | Must verify |
| Founder has a support contact process for pilot coaches | ⚠️ | Define before pilot (email? Slack DM?) |
| Feedback collection is working (`/feedback` form) | ✅ | Form → `product_feedback` table |
| Admin analytics page is working | ✅ | `/admin/analytics` — verified in build |
| Founder can delete pilot team data if requested | ⚠️ | Via Supabase dashboard only — document process |
| Founder has tested the full demo flow in production (not just dev) | ? | Should be done before inviting any pilot coach |

---

## Go/No-Go Summary

| Context | Status |
|---------|--------|
| Local dev demo (mock mode) | ✅ Ready |
| Professor / class demo | ✅ Ready |
| Advisor / investor demo | ✅ Ready (with pitch docs) |
| Early coach demo (founder-guided, production) | ⚠️ Ready after P1 fixes (Sentry, Supabase Pro, OpenAI cap) |
| Self-serve pilot (coach uses independently) | ❌ Not yet — needs P1 UX fixes and onboarding |
| Public beta | ❌ Not ready |

---

## Before Every External Session — Quick Check

1. Can I create a demo workspace and reach the report in < 60 seconds? ✓
2. Is the share link working from a private browser window? ✓
3. Is the export view rendering cleanly? ✓
4. Do I have a feedback collection method ready? ✓
5. Am I prepared to explain manual tagging honestly? ✓
6. Am I prepared to explain the no-CV limitation clearly? ✓

---

*Last updated: June 2026*  
*See also: [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md), [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md)*
