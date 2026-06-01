# GameIQ — Product Risk Register

> A structured register of the major risks facing GameIQ as it moves from MVP to pilot. Review this monthly and update when new evidence changes the likelihood or mitigation status of any risk.

**Review cadence:** Monthly  
**Owner:** Founder  
**Last updated:** June 2026

---

## Risk Scoring

**Likelihood:** Low / Medium / High  
**Impact:** Low / Medium / High  
**Priority:** L×I → Low, Medium, High, Critical

---

## Risk 1 — Coaches Reject Manual Tagging

**Description:** The core input mechanism for AI reports is manual key moment tagging — a coach or analyst watches the game and labels significant events. If coaches find this too time-consuming or friction-heavy, they will not complete the workflow, and the product fails to deliver a report.

**Likelihood:** Medium  
**Impact:** High  
**Priority:** High

**Early warning signs:**
- Coach discovery interviews: "I don't have time to tag events"
- Pilot sessions: coaches stop tagging after 2–3 events
- Analytics: low `timestamp_created` count per game (< 3)
- High drop-off between `game_created` and `analysis_completed`

**Mitigation:**
- Reduce form friction (collapse optional fields — P2-2 in issues)
- Frame tagging as "10-minute film review, not full re-watch"
- Build assisted tagging (CV Phase 2) as the long-term answer
- Offer to do the first tagging session with the coach (pilot hand-holding)
- If demand for auto-tagging is near-universal, reprioritize CV Phase 2

**Review cadence:** After each pilot session

---

## Risk 2 — AI Reports Are Too Generic

**Description:** If the AI report produces generic coaching advice ("improve communication," "work on fitness") rather than specific, game-linked observations, coaches will not trust or use it.

**Likelihood:** Medium  
**Impact:** High  
**Priority:** High

**Early warning signs:**
- Report quality rubric score < 25/50 (especially low specificity dimension)
- Coach quotes: "This could be about any game" or "I already knew all of this"
- Low verification rate — coaches don't bother to verify because the output is dismissible
- No coach shares the report with players

**Mitigation:**
- Improve input quality guidance (require ≥ 5 events + coach notes before generation)
- Improve readiness badge to block generation when inputs are too sparse
- Iterate on system prompt (add sport-specific terminology, require specific player references)
- Store prompt versions alongside reports to track improvement over time
- Build the AI evaluation harness (V1.1 item #10) to measure quality changes

**Review cadence:** After every pilot report generated

---

## Risk 3 — Coaches Do Not Trust AI Output

**Description:** Coaches are skeptical by nature. If the AI confidently states something that is obviously wrong, coaches will dismiss the entire report — and won't return. A single high-confidence, clearly wrong insight destroys more trust than ten uncertain, correct ones.

**Likelihood:** Medium  
**Impact:** High  
**Priority:** High

**Early warning signs:**
- Coach marks ≥ 2 insights as "Inaccurate" in the same report
- Coach says "the AI doesn't understand our sport"
- Coaches edit all output rather than verifying any of it
- Coach verification rate: > 40% inaccurate verdicts

**Mitigation:**
- Show confidence scores prominently — low confidence prevents overclaiming
- Emphasize evidence linking in the demo ("the AI says this because of these 3 events you tagged")
- Make "Inaccurate" marking easy and encouraged — train coaches that correcting is the intended flow
- Use corrections as future prompt improvement data
- Consider starting with mock mode in pilot (no real AI hallucination risk)

**Review cadence:** After each pilot report review session

---

## Risk 4 — Video Upload Is Too Slow or Unreliable

**Description:** Game video files are typically 2–10 GB. Uploading on a standard home or university WiFi connection can take 10–30 minutes. If the upload fails mid-way or the coach doesn't know it's happening, they will not complete the workflow.

**Likelihood:** Medium  
**Impact:** Medium  
**Priority:** Medium

**Early warning signs:**
- Pilot coaches report upload failures
- Coach abandons after upload stage (analytics: `game_created` but no `timestamp_created`)
- Support requests: "I tried to upload but nothing happened"

**Mitigation:**
- Add upload progress indicator (already implemented with drag-drop state)
- Add resumable upload (TUS protocol — V1.1 research item, V1.2 implementation)
- Provide a guide on compressing video before upload (700MB is fine; 8GB is not)
- Offer an alternative: "If your video is too large, compress with Handbrake first"

**Review cadence:** After each pilot upload session

---

## Risk 5 — Existing Tools Add Similar Features

**Description:** Hudl, Catapult, and other established sports tech companies could add AI-generated coaching reports as a feature. They have existing distribution, existing video libraries, and existing coach relationships.

**Likelihood:** Low (near-term) / High (12–24 months)  
**Impact:** High  
**Priority:** Medium

**Early warning signs:**
- Product announcements from Hudl, Catapult, or Stats Perform about AI reports
- A coach says "Hudl is adding something like this"
- AI sports analytics startups raise significant rounds

**Mitigation:**
- Move quickly on coach relationships and distribution before incumbents act
- Build features incumbents won't prioritize: evidence linking, coach verification, human-in-the-loop trust layer
- Establish sport-specific data moat through verification feedback — harder to replicate than the product itself
- Position as "the trust layer" — not just report generation but the verification and learning loop

**Review cadence:** Quarterly

---

## Risk 6 — Product Is Too Broad Across Sports

**Description:** Cricket and soccer have fundamentally different event types, terminology, and tactical concepts. Building a sport-agnostic product risks being mediocre at both. Coaches may reject the product because it doesn't "speak their sport."

**Likelihood:** Medium  
**Impact:** Medium  
**Priority:** Medium

**Early warning signs:**
- Pilot coach says "the AI doesn't understand cricket/soccer terms"
- Event type list doesn't match the coach's mental model of their sport
- AI report uses generic language when sport-specific language would be better

**Mitigation:**
- Start with one or two sports for the pilot (cricket + soccer most likely)
- Build sport-specific AI prompt packs (V1.2 item)
- Let coaches add custom event types (currently supported via free-text label)
- Position as "works for any sport" in marketing but deliver sport-specific depth for pilot sports

**Review cadence:** After first 5 pilot reports

---

## Risk 7 — Privacy Concerns Block Adoption

**Description:** Coaches may be unwilling to upload team strategy, player performance notes, or game video to a third-party service — especially if the team or institution has data governance rules.

**Likelihood:** Low (club teams) / Medium (university teams)  
**Impact:** Medium  
**Priority:** Medium

**Early warning signs:**
- Coach or athletic department asks about data ownership
- A university IT department blocks access to the platform
- Coach says "I'd need to check with [administration] before uploading"

**Mitigation:**
- Use private video storage (already implemented)
- Clearly document what data goes to OpenAI (add UI disclosure)
- Offer mock AI mode for sensitive sessions (no data leaves the platform)
- Do not target institutional programs in the MVP pilot — focus on independent club teams
- Prepare a one-page data handling summary for coaches who ask

**Review cadence:** As new pilot coach conversations happen

---

## Risk 8 — Report Quality Depends Too Much on User Input

**Description:** Report quality is directly proportional to input quality. A coach who adds 2 vague events and no notes will receive a generic, unsatisfying report. This creates a "garbage in, garbage out" perception that damages the product's reputation even if the core system is sound.

**Likelihood:** High  
**Impact:** Medium  
**Priority:** High

**Early warning signs:**
- Pilot coach generates a report from ≤ 3 events with no notes
- Report quality score < 20/50
- Coach says "the report is useless" without having tagged meaningful events

**Mitigation:**
- Enforce minimum readiness gate before allowing report generation (5+ events, some coach notes)
- AI readiness badge already exists — make "Not Ready" state more visible and actionable
- Provide examples of good vs. bad event descriptions during onboarding
- In pilot sessions, help coaches tag their first 5 events with good descriptions

**Review cadence:** After every pilot report

---

## Risk 9 — Founder Overbuilds Before Validation

**Description:** The most common early-stage startup failure. Building features no one asked for, adding complexity before validating core value, and optimizing for the wrong problems.

**Likelihood:** Medium  
**Impact:** High  
**Priority:** High

**Early warning signs:**
- More than 2 sprints without a real coach conversation
- Building CV/payments/analytics before any pilot coach has completed the full workflow
- Prioritizing visual polish over core workflow validation
- Feature list growing without corresponding coach demand evidence

**Mitigation:**
- The `30_DAY_FOUNDER_PLAN.md` forces coach-first time allocation
- This risk register exists to name the pattern explicitly
- Rule: Do not start a new engineering sprint without at least 3 coach interviews first
- Do not start v1.2 features without at least 2 pilot coaches completing the full workflow
- Keep a "deferred features" list (this document serves that purpose)

**Review cadence:** Weekly self-check

---

## Risk 10 — OpenAI Cost Spiral

**Description:** With no rate limiting and no per-team cost tracking, a single heavy pilot user could generate unexpected OpenAI charges. At ~$0.01–0.05 per report (GPT-4o-mini), 1,000 reports would cost $10–50. Manageable, but without visibility it could surprise.

**Likelihood:** Low (at pilot scale)  
**Impact:** Low-Medium  
**Priority:** Low (but fix immediately for peace of mind)

**Early warning signs:**
- Unexpected OpenAI invoice increase
- Admin analytics shows high `analysis_completed` event count from a single user
- A bug causes repeated report generation

**Mitigation:**
- Set a hard monthly spend cap in OpenAI dashboard (do this today)
- Add `tokens_used` and `estimated_cost_usd` to `analysis_jobs` (V1.1 item #3)
- Add per-team report generation rate limit (P1-8 in issues)
- Monitor admin analytics for unusual `analysis_completed` spikes

**Review cadence:** Monthly (check OpenAI invoice)

---

## Risk Summary Table

| # | Risk | Likelihood | Impact | Priority | Status |
|---|------|------------|--------|---------|--------|
| 1 | Coaches reject manual tagging | Medium | High | High | Monitor in pilot |
| 2 | AI reports too generic | Medium | High | High | Monitor; AI eval harness planned |
| 3 | Coaches don't trust AI | Medium | High | High | Trust architecture in place |
| 4 | Video upload unreliable | Medium | Medium | Medium | Resumable upload in V1.2 |
| 5 | Incumbent adds feature | Low→High | High | Medium | Move fast on distribution |
| 6 | Product too broad across sports | Medium | Medium | Medium | Cricket+soccer first |
| 7 | Privacy blocks adoption | Low→Medium | Medium | Medium | Club teams first |
| 8 | Input quality determines report quality | High | Medium | High | Readiness gate + pilot guidance |
| 9 | Founder overbuilds before validation | Medium | High | High | 30-day plan enforces discipline |
| 10 | OpenAI cost spiral | Low | Low-Medium | Low | Set spend cap immediately |

---

*Last updated: June 2026*  
*Review monthly. Update likelihood/impact when pilot data changes the picture.*
