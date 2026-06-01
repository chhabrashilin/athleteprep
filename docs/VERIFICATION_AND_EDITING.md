# Verification and Report Editing

GameIQ is not a black-box AI tool. Every AI-generated output can be reviewed, verified, corrected, and edited by coaches. This document describes how the verification and editing system works.

---

## Purpose

AI models make assumptions, miss context, and occasionally produce outputs that don't match what the coaching staff observed. The verification layer lets coaches:

1. Mark insights as accurate, partially accurate, or inaccurate.
2. Add coach notes and corrections to individual outputs.
3. Edit the content of any AI-generated report item.
4. See the original AI output alongside any edits.
5. Build an audit trail of review activity.

This creates trust in the product: coaches are always in control of what their staff and players see.

---

## Trust-Layer Philosophy

GameIQ follows this flow:

1. AI generates a structured report (coaching insights, player reports, practice plan, opponent tendencies).
2. Each output includes evidence, confidence level, and assumptions.
3. Coaches review AI output in the report dashboard.
4. Coaches verify, correct, or edit outputs using the UI.
5. The app stores the original AI output and the human correction separately.
6. Future model-personalization (Prompt 12+) will eventually learn from these corrections.

---

## Target Types

Verification and editing applies to:

| Target Type | Table | Supports `is_edited` | Supports `verification_status` |
|---|---|---|---|
| `coaching_insight` | `coaching_insights` | ✅ | ✅ |
| `player_report` | `player_reports` | ✅ | ✅ |
| `practice_recommendation` | `practice_recommendations` | ✅ (migration 0007) | ✅ (migration 0007) |
| `opponent_tendency` | `opponent_tendencies` | ✅ (migration 0007) | ✅ (migration 0007) |
| `game_report` | `game_reports` | Via `edited_output` jsonb | Via `verification_feedback` only |

---

## Verification Statuses

| Status | Meaning |
|---|---|
| `unreviewed` | Default — no coach has reviewed this item yet |
| `accurate` | Coach confirmed the AI output is correct |
| `partially_accurate` | Coach found the output partially correct |
| `inaccurate` | Coach found the output incorrect |
| `edited` | Coach edited the content (implies human review) |

---

## Editing Behavior

When a coach edits a report item for the **first time**:

1. The current AI-generated fields are saved to `original_ai_content` (JSONB).
2. The coach's edited values are written to the record.
3. `is_edited` is set to `true`.
4. `verification_status` is set to `edited`.
5. A `verification_feedback` row is inserted with `verification_status = 'edited'`.

On **subsequent edits**:

- `original_ai_content` is **never overwritten** — it always holds the first AI output.
- Only the live fields are updated.

For `game_reports`, there is no `is_edited` column. Instead:
- Edits are written to the `edited_output` JSONB column.
- The original AI summary is preserved inside `edited_output.originalAiSummary`.
- `raw_ai_output` is never touched.

---

## Verification Feedback Storage

Every verification action (including edits) inserts a row into `verification_feedback`:

| Column | Description |
|---|---|
| `target_type` | One of the 5 target types above |
| `target_id` | UUID of the target record |
| `verification_status` | The status set by the coach |
| `feedback_text` | Optional coach note |
| `correction_text` | Optional correction text |
| `submitted_by` | User ID of the coach |
| `team_id` | Team scope |
| `game_id` | Game scope |
| `game_report_id` | Report scope |

The table is **append-only** — rows are never updated or deleted. This creates a full audit trail.

---

## Permissions

| Role | Can view verification badges | Can verify | Can edit |
|---|---|---|---|
| owner | ✅ | ✅ | ✅ |
| coach | ✅ | ✅ | ✅ |
| analyst | ✅ | ✅ | ✅ |
| player | ✅ | ❌ | ❌ |
| viewer | ✅ | ❌ | ❌ |

Edit and verify controls are hidden entirely in the UI for players and viewers. Server actions also enforce this check independently, so unauthorized roles cannot call edit/verify endpoints even directly.

---

## Editable Fields

### Coaching Insights
- Title
- Summary
- Why it matters
- Recommended action
- Assumptions

### Player Reports
- Summary
- Strengths (list)
- Improvement areas (list)
- Recommended focus
- Player-facing summary

### Practice Recommendations
- Title
- Description
- Drill name
- Duration (minutes)
- Coaching points (list)

### Opponent Tendencies
- Title
- Description
- Recommended response
- Tags

### Game Report Summary
- Report title
- Executive summary
- Assumptions
- Limitations

---

## UI Behavior

### On the Report Dashboard
- Each card shows a **verification badge** (Unreviewed / Accurate / Partially Accurate / Inaccurate / Edited).
- Staff roles see **verification control buttons** (Accurate / Partially Accurate / Inaccurate).
- Staff roles see an **Edit** button that opens a modal form.
- A **Coach-edited** badge appears when `is_edited = true`.
- Verification feedback is saved without page reload — the status updates optimistically.

### On the Insight Detail Page
- Full verification controls appear in the right panel.
- Coach can both verify AND edit from the detail page.
- Verification history is shown (most recent 3 entries).

### Saving States
- Edit forms show loading state during save.
- On success, the modal closes and the server revalidates the route.
- On error, a clear message is shown without losing form state.

---

## Data Access Layer

| Function | File | Description |
|---|---|---|
| `submitVerificationFeedback` | `lib/db/verification.ts` | Insert feedback + update target status |
| `getVerificationFeedbackForTarget` | `lib/db/verification.ts` | Fetch feedback history for a single item |
| `getVerificationFeedbackForReport` | `lib/db/verification.ts` | Fetch all feedback for a report |
| `updateCoachingInsight` | `lib/db/report-editing.ts` | Edit insight fields + preserve original |
| `updatePlayerReport` | `lib/db/report-editing.ts` | Edit player report fields + preserve original |
| `updatePracticeRecommendation` | `lib/db/report-editing.ts` | Edit practice rec fields + preserve original |
| `updateOpponentTendency` | `lib/db/report-editing.ts` | Edit tendency fields + preserve original |
| `updateGameReportSummary` | `lib/db/report-editing.ts` | Edit report summary, write to edited_output |

---

## Current Limitations

- Evidence items cannot be edited (only content fields above).
- Verification history on the report dashboard is not shown (only on the insight detail page).
- No real-time sync — other users see updates after page reload.
- Verification feedback does not yet feed back into model fine-tuning.

---

## Future Roadmap

- Model personalization from coach corrections (Prompt N+)
- Bulk verification ("mark all as accurate")
- Diff view between original AI output and coach edits
- Verification summary statistics per report
- Notification when a team member verifies or edits
