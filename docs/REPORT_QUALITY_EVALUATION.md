# GameIQ — Report Quality Evaluation Plan

> How to judge whether AI reports are good. Use this rubric during coach pilots, when changing the AI prompt, and before any public expansion.

---

## Why This Matters

The MVP's primary value proposition is the quality of the AI report. A generic, poorly evidenced, or hallucinated report destroys trust immediately. A specific, honest, evidence-linked report earns it.

Report quality must be evaluated on two axes:
1. **Internal validity** — Does the report follow the rules? (hallucination prevention, evidence grounding, schema correctness)
2. **External usefulness** — Does a real coach find it useful?

Both must pass for the product to succeed.

---

## Part 1 — Internal Validity Checklist

Run this checklist on every AI report generated during the pilot. Can be done by the founder without a coach.

| Check | Pass Criteria | Fail Indicator |
|-------|--------------|----------------|
| All evidence_ids reference real event_timestamps rows | Every `evidence_id` in the report exists in the input snapshot | Any ID that doesn't match a real event |
| No player names invented | Every player name in the report appears in the roster input | A name that does not match any roster entry |
| Confidence levels are appropriate | "High" insights reference ≥ 2 distinct events; "Low" insights acknowledge limited data | "High" confidence with 0 or 1 evidence references |
| Assumptions are disclosed | Any inference beyond available data is labeled as an assumption | A claim made without qualification when data is incomplete |
| No video frame analysis claimed | No phrase like "I can see," "the footage shows," "at [timestamp] the camera shows" | Any language suggesting the AI watched the video |
| JSON schema validates | Zod validation passes before storage | A report that required schema patching to persist |
| All 5 coaching insights are present | Full top-insights array with 5 items | Fewer than 5 insights, or `null` items |
| Player reports reference only roster players | Each player_reports entry corresponds to a player in the roster | A report for a player not in the roster |
| Practice recommendations include drill names | Every practice recommendation has a `drill_name` field | Vague "work on defending" without a named drill |
| Opponent tendencies include recommended responses | Every tendency has a `recommended_response` | A tendency with no actionable counter |

**Score:** Count passes out of 10. A report scoring < 8 should not be shared with a coach without review.

---

## Part 2 — External Usefulness Rubric

Score each dimension 1–5 after a coach has reviewed the report.

### Scoring Scale

| Score | Meaning |
|-------|---------|
| 1 | Poor — unusable, actively wrong, or confusing |
| 2 | Weak — has some content but not trustworthy or not useful |
| 3 | Acceptable — somewhat useful, coach sees the value but has significant complaints |
| 4 | Good — coach finds it useful, would use it again with minor improvements |
| 5 | Excellent — coach finds it immediately actionable, shares without editing |

---

### Dimension 1: Accuracy

**Question:** "How accurate are the coaching insights compared to what you observed in the game?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Insights are mostly wrong or contradict what happened |
| 3 | Insights are partially right — some match, some don't |
| 5 | Insights match the coach's own observations closely |

**Follow-up question:** "Which insight was most accurate? Which was most wrong?"

---

### Dimension 2: Specificity

**Question:** "Are the insights specific to your team and this game, or do they feel generic?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Feels like a generic coaching article — "communicate better," "be more disciplined" |
| 3 | Some specificity — references the game situation but not specific players or moments |
| 5 | Mentions specific players, specific moments, specific tactical patterns |

**Follow-up question:** "Which parts felt like they were written for your team specifically?"

---

### Dimension 3: Evidence Linkage

**Question:** "When you clicked on an insight's evidence, did it help you understand why the AI made that observation?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Evidence doesn't connect — the events listed don't obviously support the insight |
| 3 | Evidence partially supports — some events are relevant, some feel random |
| 5 | Evidence is directly relevant — coach can see exactly why the AI said what it said |

---

### Dimension 4: Coach Trust

**Question:** "How much do you trust this report — would you act on these insights without double-checking?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Would not act on any of it without re-watching every clip |
| 3 | Would act on 2–3 insights after a quick spot-check |
| 5 | Would act on most insights without needing to verify each one |

---

### Dimension 5: Player Usefulness

**Question:** "Would your players find their individual reports useful? Would they understand and act on the feedback?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Too vague or too technical — players wouldn't know what to do differently |
| 3 | Partially useful — a few specific points, surrounded by generic advice |
| 5 | Clear, actionable, player-ready — coach would share without edits |

**Follow-up question:** "Did you share a player report? What was the player's reaction?"

---

### Dimension 6: Practice Plan Actionability

**Question:** "Could you run the suggested practice session from this report without looking anything else up?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Drill names are generic or unfamiliar, no coaching points |
| 3 | Some drills are recognizable, coaching points are partially useful |
| 5 | Specific drills the coach knows, with relevant coaching points and player priorities |

---

### Dimension 7: Opponent Tendency Usefulness

**Question:** "Are the opponent tendencies specific enough to prepare your team before the next game against this opponent?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Too general — "the opponent was aggressive" |
| 3 | Somewhat useful — identifies a pattern but the recommended response is vague |
| 5 | Specific enough to add to a team meeting presentation |

---

### Dimension 8: Clarity

**Question:** "Was the report easy to read and understand? Did any language confuse you?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Dense, jargon-heavy, or poorly organized |
| 3 | Readable but some sections feel long or repetitive |
| 5 | Clear, scannable, well-organized — coach absorbed it in under 10 minutes |

---

### Dimension 9: Time Saved

**Question:** "Compared to your normal post-game review process, how much time did this save you?"

| Score | What it looks like |
|-------|--------------------|
| 1 | Took longer than manual review |
| 3 | About the same time, but the output is more structured |
| 5 | Saved at least 60 minutes compared to manual review |

---

### Dimension 10: Would Use Again

**Question:** "Would you want a report like this after every game?"

| Score | What it looks like |
|-------|--------------------|
| 1 | "No — not worth the setup time" |
| 3 | "Maybe — if the tagging were faster" |
| 5 | "Yes — this would change how I review film" |

---

## Scoring and Interpretation

**Sum of scores across 10 dimensions (max = 50):**

| Total Score | Interpretation |
|-------------|---------------|
| 40–50 | Excellent — report is delivering clear value. Expand pilot. |
| 30–39 | Good — value is visible but improvements needed. Continue pilot, prioritize top friction. |
| 20–29 | Acceptable — coach sees the concept but current quality is insufficient. Fix AI quality before expanding. |
| < 20 | Poor — fundamental quality problem. Reassess AI prompt, evidence grounding, or input quality requirements. |

---

## Coach Evaluation Questions (Full List)

Use in pilot Week 2 and Week 3 check-ins.

**About specific insights:**
- "Which insight was most useful to you?"
- "Which insight was wrong or unhelpful?"
- "Which insight would you remove?"
- "Was there an important moment from the game that didn't appear in the report?"

**About the overall report:**
- "Did this save you time? How much?"
- "Would you share this with your players as-is, or would you edit it first?"
- "Would you use this after every game?"
- "What would make this report worth $X/month to you?"

**About trust:**
- "Did the confidence scores feel appropriate?"
- "Did you understand what the evidence references mean?"
- "Did you trust the AI or feel the need to double-check?"

**About the product:**
- "What was the hardest part of getting the report?"
- "What was the most surprising thing — good or bad?"
- "What's missing that would make this a must-have?"

---

## Internal Evaluation Log Template

Use this after every pilot game report.

```
Date: [date]
Coach: [first name, role, sport]
Game: [opponent, context]
Events tagged: [count]
Coach notes present: [yes/no]
Opponent notes present: [yes/no]
AI provider: [mock / openai]

Internal validity score: [X/10]
Failed checks (if any): [list]

External usefulness scores:
  Accuracy:              [1-5]
  Specificity:           [1-5]
  Evidence linkage:      [1-5]
  Coach trust:           [1-5]
  Player usefulness:     [1-5]
  Practice actionability:[1-5]
  Opponent usefulness:   [1-5]
  Clarity:               [1-5]
  Time saved:            [1-5]
  Would use again:       [1-5]
  TOTAL:                 [X/50]

Key coach quotes:
- "[quote]"
- "[quote]"

Top issues identified:
1. [issue]
2. [issue]

Actions:
- [action]
```

---

## Prompt Improvement Cycle

When a report scores < 35/50, before changing the AI prompt:

1. Check input quality first — were there fewer than 5 events? No coach notes? Generic event labels?
2. Check the internal validity checklist — is the issue the AI or the input?
3. If the input is good but the output is weak, update the system prompt and increment `prompt_version`
4. Re-run the same input through the new prompt
5. Compare scores before and after

**Rule:** Never change the system prompt without a before/after quality comparison using the same input.

---

*See also: [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md), [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) (AI debt section)*  
*Last updated: June 2026*
