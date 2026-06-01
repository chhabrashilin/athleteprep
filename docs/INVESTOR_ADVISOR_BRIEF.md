# GameIQ — Investor & Advisor Brief

> For founders, advisors, and early-stage investors evaluating the GameIQ opportunity. This document is honest about what is built, what is next, and where the real risks are.

---

## Thesis

Sports teams are collecting more video than they can meaningfully analyze.

The problem is not capture. GoPros, broadcast cameras, and smartphone setups have made recording cheap and ubiquitous. The problem is the intelligence gap between what gets recorded and what coaches can actually act on.

Most teams record 30–100 games per year. The average coaching staff reviews 20–40% of that footage seriously. Film review is manually intensive, produces inconsistent player feedback, and rarely generates structured data that persists across seasons.

The next platform opportunity is not more storage. It is the intelligence layer that turns video, structured context, and coaching expertise into decisions.

---

## Product

**GameIQ** is a coach-first AI game review platform.

Coaches upload game film, add structured metadata, tag key events with timestamps, and receive an AI-generated report with:

- Evidence-linked coaching insights with confidence scores
- Player-by-player performance reports
- Opponent tendency analysis
- Next-practice drill recommendations
- Coach verification and inline editing
- Shareable reports and export-ready views

The product is a full-stack MVP. It is functional, deployed, and ready for real coach demos.

---

## The Wedge: AI Game Review in 10 Minutes

**video + roster + key moments + notes → structured report**

This wedge is deliberately narrow. It does not require computer vision, real-time streaming, or complex integrations to deliver immediate value.

Why this wedge works:

1. **Practical before perfect** — Manual key moment tagging captures 80–90% of the analytical value at a fraction of the infrastructure cost of full computer vision. Coaches already tag events mentally — GameIQ gives that tagging structure.

2. **Useful immediately** — A coach with 5 tagged events and a notes block gets a useful, honest report. The product delivers ROI from the first session.

3. **Data moat through verification** — Every coach correction (marking an insight as inaccurate, editing an output) generates structured feedback that makes future reports better. This is a reinforcement signal that competitors cannot easily replicate.

4. **Natural expansion path** — The architecture is designed to absorb computer vision, scouting, player development, and media features without rebuilding the intelligence layer.

---

## Market Direction

The TAM for sports analytics tools spans professional teams, college programs, high school athletics, youth academies, and amateur leagues globally. Teams spending on video analysis today include:

- Collegiate athletic programs (NCAA D1, D2, D3)
- Academy and youth development programs
- Semi-professional leagues
- International amateur competitions

We are not targeting the top of the market (professional teams with full analytics staffs). We are targeting the **under-served middle** — serious teams without dedicated analysts who currently do film review manually.

*We will add specific market sizing with primary research as coach interviews progress.*

---

## Differentiation

GameIQ is not Hudl. It is not a highlight tool. It is not a chatbot.

| What GameIQ is | What GameIQ is not |
|----------------|-------------------|
| Evidence-linked AI reports | Generic analytics dashboard |
| Coach verification/editing | Video storage platform |
| Structured JSON outputs | Clip/highlight generator |
| Confidence-scored insights | Sports chatbot |
| Human-in-the-loop trust layer | Automated full-CV solution |

The key differentiator is **trust architecture**: every AI output shows what evidence supports it, how confident the AI is, and what assumptions were made. Coaches can verify, edit, and correct — and those corrections persist. This is not a black-box system.

---

## Technical Moat Roadmap

The product is designed to compound defensibility over time:

1. **Structured team data** — roster, game history, metadata — accumulated per team
2. **Coach verification feedback** — which AI outputs are accurate vs. wrong, per sport/level
3. **Historical reports** — cross-game trends, opponent intelligence over time
4. **Sport-specific intelligence** — trained on correction data from specific sports/levels
5. **Computer vision event detection** — automated key moment identification from video frames
6. **Player development profiles** — longitudinal performance data across seasons
7. **Recruiting/scouting network** — structured performance history for player evaluation

The data advantage grows the longer teams use the platform.

---

## Current MVP — What Is Actually Built

The MVP is complete and functional. This is not a mockup.

**Implemented:**
- Supabase Auth (email/password, PKCE, session middleware)
- Team workspaces with role-based access (owner, coach, analyst, player)
- Roster management (full CRUD, archive, search, position/status filter)
- Game/practice creation with 4-section metadata form
- Video upload to private Supabase Storage with 1-hour signed URL playback
- Manual timestamp tagging (12 event fields per event)
- AI readiness scoring before report generation
- AI report generation: mock provider (deterministic, evidence-linked) + OpenAI GPT-4o-mini (production)
- Strict Zod validation on all AI JSON outputs
- 14 AI guardrail rules enforced in system prompt
- Full report dashboard: insights, players, opponent, practice, evidence sections
- Insight detail pages with video seek to timestamp
- Coach verification (4 states) + inline editing with audit trail
- 4-mode shareable reports (private link, staff, player-specific, public summary)
- Secure tokens (144-bit entropy, `giq_` prefix, expiration, revocation)
- Export-ready print/PDF view with section selector
- Founder analytics (13 instrumented product events, admin dashboard)
- Landing page, demo experience, request-access form, feedback form
- Demo workspace with full cricket team/game/report

**Not yet built:**
- Automated video frame analysis / computer vision
- Team member invitation workflow
- Password reset flow
- Server-side PDF generation
- Season-level analytics / cross-game trend detection
- Subscription billing

---

## Risks

**AI accuracy** — The report quality depends directly on input quality. Reports generated with sparse notes and 2 events will be generic. This is documented honestly and addressed by the readiness badge and input guidance UX.

**Coach trust** — Coaches are skeptical of AI. The trust architecture (confidence scores, evidence links, verification/editing) is designed to earn trust incrementally rather than require it upfront.

**Manual tagging friction** — Tagging events takes time. Early coach interviews will determine whether this is a blocker or an acceptable workflow step. The long-term answer is automated event detection.

**Video processing costs** — Supabase Storage is affordable at small scale but needs a migration plan at higher upload volumes. Video compression and tiered storage are roadmap items.

**Competition** — Hudl, Catapult, Dartfish, and others operate in adjacent spaces. None currently offer this specific combination of AI-generated, evidence-linked, coach-verified reports at the target price point. The risk is that a large incumbent adds this as a feature.

**Sport-specific complexity** — Event types, terminology, and tactics vary enormously across sports. The current implementation handles multi-sport data but the AI prompt is not yet sport-specialized. Prompt packs per sport are a near-term priority.

---

## Next Milestones

**Validation (0–60 days):**
- 5–10 structured coach discovery interviews
- 3 teams complete a real game upload and report review
- Evaluation of report quality vs. coach expectations

**Product iteration (60–90 days):**
- Fix highest-friction UX issues identified in coach sessions
- Improve AI report quality based on real coach feedback
- Add team invitations

**Pilot hypothesis (90–120 days):**
- Identify 1–2 teams willing to use GameIQ for an entire season
- Evaluate whether the product fits naturally into their existing workflow
- Establish a first paid pilot hypothesis and pricing model

---

## What We Are Looking For from Advisors

- Introductions to coaches and athletic directors at college or academy level
- Feedback on the trust architecture and AI output quality
- Experience with sports tech go-to-market
- Domain expertise in specific sports (soccer, basketball, cricket, volleyball)
- Early-stage product/market fit frameworks

---

*Built and maintained by the GameIQ founding team.*
*Last updated: June 2026*
