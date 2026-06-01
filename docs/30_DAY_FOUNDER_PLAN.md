# GameIQ — 30-Day Founder Execution Plan

> The most important thing right now is not building more features. It is getting real coaches to use the product that already exists.

**Start date:** June 2026  
**Mode:** Coach-first validation. Engineering in service of validation, not in service of the roadmap.

---

## Governing Rule

> No new features ship until at least 2 pilot coaches have completed the full workflow with real game data.

Every hour spent building a feature that no coach has requested is an hour not spent talking to coaches. The `30_DAY_FOUNDER_PLAN.md` exists to make this concrete.

---

## Week 1 — Stabilize and Prepare

**Theme:** Get the product ready for real users. Fix P1 issues. Prepare coach outreach.

### Goals
- Production deployment is stable and verified
- P0 operational task complete (OpenAI spend cap)
- At least 1 P1 issue fixed (Sentry or CI/CD)
- Coach outreach sent to 10+ candidates
- Pilot materials ready

### Tasks

**Engineering (Days 1–3):**
- [ ] Set OpenAI monthly spend cap in dashboard (30 min — do this first)
- [ ] Set up GitHub Actions CI/CD (`.github/workflows/ci.yml`) — 2 hours
- [ ] Install Sentry, configure `SENTRY_DSN`, test error capture — 3 hours
- [ ] Add share_links UNIQUE constraint migration (migration file + deploy) — 1 hour
- [ ] Verify production deployment end-to-end (full demo flow in production, not dev) — 2 hours
- [ ] Upgrade Supabase to Pro (if not already) and confirm backups enabled — 30 min

**Preparation (Days 3–5):**
- [ ] Write 1-page "GameIQ Pilot Guide" for coaches (what it does, what you'll do, what we ask of you)
- [ ] Set up a simple feedback form (Google Form or `/feedback` link)
- [ ] Identify 15 potential pilot coaches (university clubs, academy teams, coaches known through network)
- [ ] Draft outreach email (see `COACH_PILOT_PLAN.md` for template)
- [ ] Send outreach to all 15 candidates
- [ ] Schedule 3 discovery calls for Week 2

### Outputs
- Production deployment verified
- OpenAI spend cap set
- Sentry capturing errors
- CI/CD running on every push
- 15 outreach emails sent
- 3 discovery calls scheduled

### Success Criteria
- I can create a demo workspace and reach the report in < 60 seconds in production
- I receive at least 3 responses from outreach
- At least 3 discovery calls are scheduled

---

## Week 2 — Coach Discovery

**Theme:** Listen. Do not pitch. Understand how coaches think about film review.

### Goals
- Run 3–5 discovery conversations
- Run at least 1 full product demo
- Collect initial product reactions
- Update product notes with findings

### Tasks

**Discovery calls (Days 6–10):**
- [ ] Run 3 discovery calls using `COACH_DISCOVERY_GUIDE.md` as the script
- [ ] Ask about current film review workflow before showing product
- [ ] Run demo during at least 2 calls (use demo workspace — not a blank account)
- [ ] Watch for excitement and confusion — write down specific quotes
- [ ] At the end of each call: "Would you be willing to upload one game this week?"
- [ ] After each call: write 5-bullet debrief (what surprised you? what do they care about most?)

**Following up:**
- [ ] Send "Pilot Guide" PDF to each interested coach within 24 hours of the call
- [ ] Get commitment from 3+ coaches to participate in Week 3

**Engineering (Days 8–10 only if time exists — discovery is the priority):**
- [ ] Settings page: wire profile update and password reset trigger (P1-5) — 3 hours

### Outputs
- 3 written call debriefs
- 3 coaches committed to Week 3 pilot session
- Preliminary feedback notes on what coaches care about most
- Any product changes obviously needed (note them, don't build yet)

### Success Criteria
- At least 3 discovery calls completed
- At least 2 coaches commit to a Week 3 pilot session
- You have at least 5 specific coach quotes to reference

---

## Week 3 — First Real Workflows

**Theme:** Observe. Help when needed. Note every friction point.

### Goals
- Get at least 1 real game video uploaded by a coach
- Generate at least 1 real AI report from real coach data
- Observe where friction actually appears (not where you predicted it would be)

### Tasks

**Pilot sessions (Days 11–17):**
- [ ] Schedule 45–60 min pilot session with each committed coach
- [ ] Coach uploads their own game video (assist only if truly stuck)
- [ ] Coach tags key moments (note how long it takes and which fields they skip)
- [ ] Generate report together (mock mode is fine — use OpenAI if they want to see "real" AI)
- [ ] Review the report together — ask "which insight surprised you?" "which would you remove?"
- [ ] Send share link so they can share with players or staff
- [ ] After the session: write debrief with friction log (what confused them? what did they love?)

**Follow-up (Days 15–17):**
- [ ] Check in with each coach 2–3 days after the session
- [ ] "Did you share the report? What happened?"
- [ ] Ask for a 1–5 rating + qualitative comment
- [ ] Score each report against the rubric in `REPORT_QUALITY_EVALUATION.md`

**Engineering (only if a clear P1 blocker appeared during sessions):**
- [ ] Fix the most painful friction point observed — one small fix only
- [ ] Do not start v1.2 features this week

### Outputs
- ≥ 1 real game report generated from real coach data
- Friction log from each session
- Per-report quality scores
- Initial verification/share/export rates from analytics
- Updated `REPORT_QUALITY_EVALUATION.md` with real scores

### Success Criteria
- At least 1 real report generated
- At least 1 coach shares the report with a player or staff member
- You have specific answers to: "How long did tagging take?" "What was the coach's first reaction to the report?"

---

## Week 4 — Decide What to Build Next

**Theme:** Synthesize findings. Make the decision about v1.1 engineering scope. Define the next pilot expansion.

### Goals
- Understand what is working and what is not
- Prioritize the v1.1 engineering sprint
- Decide the next pilot expansion plan
- Define the first paid pilot hypothesis

### Tasks

**Analysis (Days 18–21):**
- [ ] Review all discovery call notes and pilot session debriefs
- [ ] Review product analytics (`/admin/analytics`) — funnel drop-offs, verification rates, share rates
- [ ] Score each report against the quality rubric
- [ ] Classify each pilot coach: "would use again," "interested but blocked," "not for us"
- [ ] Identify top 3 recurring friction points
- [ ] Identify top 3 most-requested missing features

**Decisions to make (Days 22–25):**
- [ ] v1.1 engineering sprint scope: which 5 items from `V1_1_ENGINEERING_ROADMAP.md` to build first?
- [ ] Sport focus decision: cricket-first, soccer-first, or general?
- [ ] Pilot expansion decision: recruit 5 more coaches, or fix first?
- [ ] First paid pilot hypothesis: "We would charge $X/month for [specific value proposition]"
- [ ] Ask at least 1 pilot coach: "If this worked perfectly, would you pay $X/month?"

**Communication (Days 25–28):**
- [ ] Write a 1-page pilot summary (what we learned, what we're building next)
- [ ] Send thank-you email to each pilot coach with next steps
- [ ] Update `PRODUCT_RISK_REGISTER.md` based on pilot findings
- [ ] Update `PRIORITIZED_ISSUES.md` based on friction logs

**Engineering (Days 25–30):**
- [ ] Start the top 2–3 v1.1 engineering items (after decisions are made)

### Outputs
- Written pilot summary (share with advisors)
- Updated priority list
- v1.1 sprint scope confirmed
- First paid pilot hypothesis stated
- At least 1 coach's answer to the "would you pay?" question

### Success Criteria
- You can answer: "Did coaches find this useful?"
- You can answer: "What is the #1 thing to fix next?"
- You can answer: "Should we keep going, pivot, or stop?"
- At least 1 coach has expressed clear willingness to use GameIQ for a full season

---

## Daily Practice

### Every morning (10 minutes)
1. Check Sentry dashboard — any production errors overnight?
2. Check admin analytics — any new users or events since yesterday?
3. Review one coach call note from this week
4. Write one sentence: "Today's most important task is ___"

### Every evening (10 minutes)
1. Write a brief note on what happened today
2. Did you talk to a coach? (If not 3 days in a row — that's the problem to fix)
3. Did you build something no coach asked for? (If yes — why?)

---

## Weekly Self-Check Questions

Answer these at the end of each week:

1. How many coaches did I speak with this week?
2. What was the single most important thing I learned?
3. Did I build anything this week? Was it in response to a coach request?
4. What is the #1 risk right now?
5. What would I do differently next week?

---

## What to Do If Pilots Fail

**If coaches refuse manual tagging:**
- Explore whether analyst role (not head coach) is the right early user
- Explore whether a "quick tag" mode (5 fields only) reduces friction
- Start CV Phase 1 (video utilities) earlier than planned
- Do not build full CV before more coach conversations

**If AI report quality is consistently poor:**
- Fix the system prompt before running more pilots
- Increase the readiness gate (require 8+ events before generating)
- Explore whether the mock AI is actually a better starting point than OpenAI

**If coaches love it but won't commit to ongoing use:**
- Run a 2-game trial: "Upload your next 2 games and tell us if it's worth it"
- Identify the one feature that would make it a must-have
- Ask: "What would need to be true for you to use this every week?"

**If no coaches respond to outreach:**
- Change the channel (direct message > email)
- Get a warm intro from someone they trust
- Run a public demo at a coaching conference or university sports department meeting

---

*See also: [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md), [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md), [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md)*  
*Last updated: June 2026*
