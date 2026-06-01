# GameIQ — Coach Pilot Plan

> A practical 4-week plan for running the first coach pilots. The goal is validation, not growth. Listen more than pitch.

---

## Pilot Goal

Validate whether GameIQ saves coaches time and produces useful reports from real game workflows — not demo data.

**The core question:** Does a real coach, using their own game video and their own team, find the output useful enough to use again?

**Secondary questions:**
- Is manual tagging an acceptable workflow step?
- Is the AI report trustworthy enough to share with players?
- What would make this product a must-have?
- What is missing for their specific sport?

---

## Ideal Pilot Coaches

Look for coaches who:

| Criteria | Why it matters |
|----------|---------------|
| Already record games or practices | They have film to upload — no new behavior required |
| Have 1–2 upcoming games during the pilot period | Provides real input, not hypothetical |
| Coach a team of 5–15 players | Small enough to care about individual feedback |
| Are willing to spend ~20 minutes tagging | Must be honest upfront about the time commitment |
| Have a basic laptop for film review | Mobile tagging is not yet optimized |
| Coach cricket, soccer, basketball, or volleyball | Sports where the AI prompt is most sport-literate |

**Best profile (strongest signal):**
- Head coach or assistant coach at a university club or academy team
- Has complained about post-game film review time before
- Is comfortable with apps (not necessarily "techy")

**Avoid initially:**
- Professional teams with dedicated analysts (they have better tools)
- Teams that do not record games (no film = nothing to upload)
- Coaches who are deeply AI-skeptical (not the right early user)
- Youth teams with under-13 players (data consent complexity)

---

## Recruit Approach

**Week 0 outreach channels (in order of likelihood to succeed):**
1. Direct warm introductions from university sports programs (cricket clubs, soccer clubs)
2. LinkedIn messages to university assistant coaches ("Hi, I'm building a film review tool...")
3. Sports Discord/Slack servers for coaches and analysts
4. Reddit communities: r/coachingsoccer, r/cricket, r/coaching
5. Request-access form from the landing page (inbound — highest intent)

**Outreach message template:**
> "Hi [Name], I'm building GameIQ — an AI tool that turns game film and tagged key moments into coaching reports. I'm looking for 3–5 coaches who'd be willing to try it with one real game in the next 2–3 weeks. In exchange for 1–2 hours of your time, you'd get a free AI coaching report for a real game and direct input into the product roadmap. Would you be open to a 10-minute call?"

**Honest positioning in outreach:**
- Say it's an early MVP built by one founder
- Say it does not yet analyze video automatically
- Say manual tagging is required (10–20 minutes per game)
- Say you are looking for honest feedback, not just positive reactions

---

## Week 0 — Recruit and Prepare

**Goals:**
- Identify 5 candidate coaches
- Schedule discovery calls
- Prepare pilot onboarding materials
- Deploy to production and test the full flow

**Tasks:**
- [ ] Run the full production demo flow (not mock mode) from a fresh account
- [ ] Confirm Supabase Pro is active and backups are enabled
- [ ] Confirm Sentry is capturing errors
- [ ] Confirm `AI_PROVIDER=openai` works with a real game input
- [ ] Write a one-page "GameIQ Pilot Guide" for coaches (plain language, not technical)
- [ ] Prepare a feedback form link or survey (Google Form is fine)
- [ ] Send outreach to 10+ coaches (expect 3–5 responses)
- [ ] Schedule 3 discovery calls

**Outputs:**
- 3–5 coaches confirmed for pilot
- Production deployment verified
- Pilot guide ready to send

---

## Week 1 — Discovery and Demo

**Goals:**
- Understand each coach's current film review workflow
- Show the product
- Identify the highest-value pain points
- Collect initial interest level and commitment

**For each coach:**
- Run a 20–30 minute discovery call (see `COACH_DISCOVERY_GUIDE.md`)
- Ask about current workflow before showing the product
- Show the demo using the demo workspace (not their data yet)
- Watch for excitement and confusion — note both
- Ask: "Would you be willing to upload one game this week?"

**Questions to ask (in addition to `COACH_DISCOVERY_GUIDE.md` questions):**
- "How many games do you record per season?"
- "Who reviews film — you, an assistant, or together?"
- "What tool do you use to watch film now? (Hudl, YouTube, native player?)"
- "After a game, how long before you usually have feedback for players?"
- "What format does that feedback take? (Team meeting, written report, text message?)"

**Outputs:**
- Notes from each discovery call
- Each coach commits to uploading one game in Week 2
- List of top friction points identified per coach

---

## Week 2 — First Real Game Workflow

**Goals:**
- Get at least 1 real game video uploaded and reported
- Observe where friction actually appears
- Generate a real AI report

**Structure:**
- Schedule a 45–60 minute "game review session" with each pilot coach
- Founder should be present (Zoom screen share or in person if local)
- Coach uploads their own game video
- Coach tags key moments (founder helps if needed — but note how much help was needed)
- Generate AI report
- Review report together

**Founder role during session:**
- Observe more than assist
- Note: How long did tagging take? What fields were confusing? What did the coach say when they saw the report?
- Ask: "Which insight surprised you?" "Which one would you remove?"
- Do NOT defend the AI when it's wrong — thank them and note it

**After the session:**
- Send the report share link so the coach can share with staff or players
- Ask: "Did you use it? What happened?"

**Outputs:**
- ≥ 1 real game report generated from real coach data
- Written notes on friction points
- Coach's initial reaction to report quality (on a 1–5 scale)

---

## Week 3 — Real Usage and Feedback

**Goals:**
- Coach uses the report with their team or staff
- Collect qualitative and quantitative feedback
- Identify must-fix vs. nice-to-have issues

**For each coach:**
- Check in (15-minute call or async message) to see if they shared the report
- Ask: "Did you share this with your players?" "What did they think?"
- Ask: "Which insights did you verify as accurate?" "Which were wrong?"
- Ask: "Did this save you time compared to your normal process?"
- Ask: "Would you use this after every game?" "What would need to change?"

**Feedback collection:**
- Ask each coach to complete the short feedback form (`/feedback`)
- Collect verification rate from analytics: what % of insights were marked accurate vs. inaccurate?
- Collect share/export rate: did the coach share the report?

**Outputs:**
- Per-coach feedback notes
- Verification/edit rate from analytics
- Top 3 must-fix issues identified per coach

---

## Week 4 — Evaluate and Decide

**Goals:**
- Synthesize pilot findings
- Decide whether to expand, pivot, or fix first
- Define first paid pilot hypothesis

**Analysis tasks:**
- [ ] Review all coach call notes
- [ ] Analyze product analytics (verification rate, share rate, export rate)
- [ ] Score each report against the quality rubric in `REPORT_QUALITY_EVALUATION.md`
- [ ] Identify top recurring friction points
- [ ] Identify most-requested missing features
- [ ] Classify each pilot coach: "would use again," "interested but blocked," "not for us"

**Decision framework:**

| Signal | What it means |
|--------|--------------|
| ≥ 2 coaches would use it again without prompting | Strong product-market fit signal — expand pilot |
| Coaches love the report but hate the tagging | UX problem — fix tagging before expanding |
| Coaches don't trust the AI output | Trust problem — more evidence grounding, verification UX |
| Coaches don't have video to upload | Target profile problem — find coaches who already record |
| Report quality is generic / not sport-specific | AI quality problem — improve prompt before expanding |

**First paid pilot hypothesis:**
- Define the smallest possible paid offer ("$X/month for one team, unlimited reports for one season")
- Ask at least one pilot coach: "If this worked perfectly, would you pay $X/month?"
- Do not charge until the product delivers consistent value

**Outputs:**
- Written pilot summary (3–5 pages)
- Decision: expand pilot / fix and retry / reposition
- v1.1 engineering sprint scope confirmed
- v1.2 product priorities confirmed

---

## Pilot Success Criteria

### Strong Signal (greenlight to expand)

- Coach uploads a real game without the founder's help
- Coach tags ≥ 5 events and generates a report
- ≥ 50% of coaching insights are marked "accurate" or "partially accurate"
- Coach shares the report with at least one player or staff member
- Coach says they would use it after every game (or asks "when can my other coaches use this?")
- Coach provides specific feature requests (not just "make it better")

### Weak Signal (fix before expanding)

- Coach likes the concept but does not upload a real game
- Coach refuses manual tagging ("I don't have time for that")
- Coach generates a report but dismisses it immediately
- Report quality is rated ≤ 2/5 on average
- Coach does not share or export the report

### Failure Signal (stop and reassess)

- No coach completes the full workflow
- Manual tagging is universally rejected
- AI reports are consistently inaccurate or generic
- Product creates confusion or anxiety rather than confidence

---

## Pilot Metrics to Track

| Metric | Target (initial) |
|--------|-----------------|
| Coaches recruited | 5 |
| Coaches who complete the full workflow | ≥ 3 |
| Avg time to first tagged event | < 5 minutes from video upload |
| Avg number of events tagged | ≥ 5 per game |
| Avg report quality rating (1–5) | ≥ 3.5 |
| % insights verified as accurate or partially accurate | ≥ 50% |
| % coaches who share or export report | ≥ 60% |
| % coaches who say they would use it again | ≥ 2 out of 5 |

---

*See also: [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md), [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md), [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md)*  
*Last updated: June 2026*
