# GameIQ — AI Output Principles

> These rules govern every AI-generated output in the product. All prompts, parsing logic, display code, and output storage must comply with these principles. They are not suggestions — they are product requirements.

---

## 1. Evidence-Based Output

Every major AI claim must be traceable to an available input.

Available inputs in V1:
- Game metadata (sport, date, opponent, score, venue, competition type)
- Roster and player data
- Manual event timestamps (with descriptions, players involved, importance)
- Coach notes
- Opponent notes
- Optional stat or scorecard data
- Prior reports for the same team (when available in future phases)

**The AI must never fabricate:**
- Players not in the roster
- Timestamps not entered by the user
- Scores or statistics not provided
- Events that were not tagged
- Tactical patterns with no evidence in the inputs
- Quotes or statements attributed to real people

If evidence is limited, the AI must say so explicitly and lower the confidence level accordingly.

---

## 2. Confidence Scoring

Every insight must carry a confidence level. The level must be accurate, not optimistic.

| Level | Criteria |
|-------|----------|
| **High** | Directly supported by multiple timestamps, explicit coach notes, or clear structured inputs. Little interpretation required. |
| **Medium** | Supported by some inputs but requires interpretation. The evidence points in this direction but is not conclusive. |
| **Low** | Plausible inference from limited data, a single data point, or indirect signals. Highly dependent on assumptions. |

Rules:
- Never assign High confidence when evidence is thin.
- When in doubt, assign Medium or Low rather than High.
- Confidence must be computed based on actual input quantity and quality, not inflated to seem impressive.
- Low confidence insights are still valuable. They surface hypotheses for the coach to verify.

---

## 3. Assumptions Declaration

If the AI makes an assumption to fill a data gap, it must declare that assumption explicitly.

Examples of valid declared assumptions:
- "Assumed home team is defending the right side in the first half based on common convention for the entered formation."
- "Assumed the 3 unlabeled transition timestamps are defensive breakdowns, based on coach note mentioning 'poor transition shape.'"
- "No statistical data was provided. This insight is based solely on event timestamps and coach notes."

Assumption rules:
- State assumptions in plain language.
- Never bury assumptions — surface them at the insight level, not only in a footer.
- Assumptions should help the coach understand the reasoning, not cover up weak analysis.

---

## 4. Hallucination Prevention

Hallucination — generating plausible-sounding but unsupported content — is a critical product failure.

Prevention rules:

1. **Grounding instruction in prompts:** Every prompt must explicitly instruct the AI to base its output only on the provided structured data. It must not use general sports knowledge to invent specifics.

2. **Output schema enforcement:** AI outputs must conform to a predefined JSON schema. Any field that cannot be populated from inputs must be left null or marked as unavailable.

3. **Post-generation validation:** All AI outputs must be validated against a zod schema before being stored or displayed. Fields that fail validation must not be shown.

4. **No inventing player names:** If the AI references a player by name, that name must appear in the provided roster. The prompt must include the roster and instruct the AI to reference only listed players.

5. **No inventing timestamps:** If the AI references a specific game moment, that moment must correspond to an entered event timestamp. The prompt must include the timestamp list.

6. **No video frame claims:** The AI must not claim to have analyzed video frames or detected events visually unless a computer vision module is implemented and connected. In V1, phrasing like "I can see in the video..." is prohibited.

Correct V1 AI framing:
> "Based on the 6 transition-related timestamps entered by the coach and the note about 'poor recovery shape,' the team appears to have struggled with defensive transition in the second half."

Prohibited framing:
> "After analyzing the match footage, it's clear the right back repeatedly lost positional discipline on the defensive line."

---

## 5. Insight Structure

Every coaching insight must be stored as structured JSON with these fields:

```json
{
  "id": "uuid",
  "title": "string",
  "summary": "string",
  "why_it_matters": "string",
  "evidence": [
    {
      "type": "timestamp | coach_note | metadata | stat",
      "reference": "string",
      "value": "string"
    }
  ],
  "confidence": "high | medium | low",
  "assumptions": ["string"],
  "recommended_action": "string",
  "affected_players": ["player_id"],
  "verification_status": "unreviewed | accurate | partially_accurate | inaccurate | edited",
  "edited_content": "string | null"
}
```

All fields are required. If a field cannot be populated, use `null` or an empty array — never omit the key.

---

## 6. Player Report Structure

Each player report must include:

```json
{
  "player_id": "uuid",
  "player_name": "string",
  "summary": "string",
  "strengths": ["string"],
  "areas_for_improvement": ["string"],
  "key_moments": [
    {
      "timestamp_id": "uuid",
      "description": "string",
      "significance": "string"
    }
  ],
  "recommended_focus": "string",
  "confidence": "high | medium | low",
  "assumptions": ["string"],
  "data_coverage": "string"
}
```

`data_coverage` must describe how much data was available for this player: e.g., "Player was involved in 4 of 12 tagged events." If a player was not involved in any tagged events, the report must say so clearly rather than fabricating analysis.

---

## 7. Practice Recommendation Structure

Each practice recommendation must include:

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "rationale": "string",
  "priority": "high | medium | low",
  "target_players": ["player_id"],
  "linked_insights": ["insight_id"],
  "drill_suggestions": ["string"],
  "confidence": "high | medium | low"
}
```

Drill suggestions are optional free-text. If the AI is not confident about specific drills, it should say so rather than inventing generic advice with false specificity.

---

## 8. Output Tone and Language Rules

**Required tone:** Direct, professional, coach-friendly, specific, humble about uncertainty.

**Prohibited tone:** Condescending, overconfident, vague, motivational-poster-style, tabloid-style, insulting.

Specific prohibitions:
- Do not use language that could shame or demotivate athletes.
- Do not make personal judgments about an athlete's character, attitude, or effort.
- Do not diagnose injuries or make medical claims.
- Do not use superlatives without evidence ("best," "worst," "always," "never").
- Do not use hedge language that drains all meaning ("it seems like maybe there could potentially be...").
- Do not write more than necessary. Concise is better.

Good example:
> "The team conceded 3 goals from set pieces in the second half. All three were tagged as defensive organization breakdowns in the coach's timestamps. This is a high-priority area for the next training session."

Bad example:
> "Your defenders were absolutely terrible at set pieces and frankly it's shocking this kind of carelessness keeps happening."

---

## 9. Human-in-the-Loop Verification

The AI is a first draft, not the final word.

The verification workflow ensures coaches remain in control:

1. Every AI-generated insight, player report, and recommendation is shown with a verification control.
2. Coaches can mark each item: **Accurate**, **Partially Accurate**, **Inaccurate**, or **Edited**.
3. If a coach marks something Inaccurate, the system should record this for future prompt improvement.
4. If a coach edits a section, the original AI text and the edited text are both stored.
5. A report with significant unverified items should be shown with a status indicator ("X insights unreviewed").
6. Verification state must not be lost on re-analysis. Verified items should be flagged for re-review if the underlying data changes.

---

## 10. Good vs. Bad AI Output Examples

### Example 1: Team Defensive Transition

**Good:**
> **Title:** Defensive Transition Vulnerability  
> **Summary:** The team appears to have had recurring defensive transition issues, particularly in the second half. Six of the 14 tagged events were coded as defensive transition breakdowns.  
> **Evidence:** Event timestamps #3, #7, #9, #11, #12, #14 — all tagged as defensive breakdown moments. Coach note: "We kept getting caught on the counter in the second half."  
> **Confidence:** High  
> **Assumptions:** Timestamps were tagged consistently by the coach. All tagged transitions are assumed to be defensive (not offensive) based on event type selection.  
> **Recommended action:** Dedicate 20 minutes of the next session to defensive shape recovery after turnovers.

**Bad:**
> "After watching the full match footage, it's clear your team consistently failed to recover their defensive shape after losing the ball. Your holding midfielder in particular was the main culprit in giving away transition opportunities."

---

### Example 2: Player-Level Feedback

**Good:**
> **Player:** Jordan Kim  
> **Summary:** Jordan was involved in 3 of 14 tagged events. Two were tagged as positive contributions (goal assist, key interception). One was tagged as a defensive breakdown.  
> **Strengths:** Strong involvement in offensive build-up, particularly in the first half.  
> **Areas for improvement:** One defensive transition moment where Jordan was caught out of position (timestamp 0:34:12).  
> **Data coverage:** Jordan was involved in 3 of 14 tagged events. Analysis is limited by available data.  
> **Confidence:** Medium

**Bad:**
> "Jordan had an excellent game overall with no real weaknesses to speak of. A true leader on the pitch who elevated everyone around them."

*(No evidence, false certainty, fabricated superlatives.)*

---

### Example 3: Practice Recommendation

**Good:**
> **Title:** Set Piece Defensive Organization  
> **Rationale:** 3 of the 5 goals conceded came from opponent set pieces, based on coach-entered timestamps. Coach note confirms: "We were poorly organized at corners."  
> **Priority:** High  
> **Drill suggestions:** Back post zonal marking practice. Set piece walkthrough and positioning drill.  
> **Confidence:** High

**Bad:**
> "You should work on everything — your defense, your offense, your set pieces, your fitness, and your communication. A general improvement session would be beneficial."

*(Vague, unhelpful, not evidence-linked.)*

---

## 11. V1 Prompt Preamble Template

Every AI prompt in V1 must begin with a grounding statement similar to:

```
You are an elite sports analyst assistant. Your job is to analyze the following structured game data and produce a coaching report.

You must base ALL of your analysis ONLY on the data provided below. Do not invent players, timestamps, events, scores, or tactical patterns that are not supported by the provided inputs.

If data is limited, acknowledge the limitation clearly and reduce your confidence level.
Do not claim to have watched or analyzed video unless explicitly told that visual analysis data is available.

Available data:
[STRUCTURED_GAME_DATA]
[ROSTER_DATA]
[EVENT_TIMESTAMPS]
[COACH_NOTES]
[OPPONENT_NOTES]
[OPTIONAL_STATS]

Produce your output as valid JSON conforming to the GameIQ report schema.
```

This preamble is a requirement. It must not be removed from prompts.
