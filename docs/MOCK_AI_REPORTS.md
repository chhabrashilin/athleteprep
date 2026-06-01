# GameIQ — Mock AI Report Generation

> This document explains why mock AI exists, how the generator works, what data it uses, and how real LLM integration will replace it.

---

## 1. Why Mock AI?

GameIQ's AI report pipeline is designed to support both mock and real LLM providers via a provider-agnostic service layer (`lib/ai/providers.ts`).

In early development and MVP, the mock generator:
- Lets the full pipeline be built and tested without API keys or costs
- Produces realistic, data-grounded output that the frontend can be built against
- Validates that the data model, persistence, and UI can handle real structured output
- Demonstrates the evidence-based design to investors and beta users
- Can be used as a fallback if the real LLM API is unavailable

The mock generator is not random — it is deterministic and fully grounded in the input data. This is by design.

---

## 2. Input Contract

The mock generator receives an `AnalysisInputSnapshot` (defined in `types/analysis.ts`):

```ts
interface AnalysisInputSnapshot {
  team: { id, name, sport, organizationName, level }
  game: { id, title, sport, gameType, opponentName, gameDate, homeAway, venue,
          competitionName, teamScore, opponentScore, result,
          summaryNotes, coachNotes, opponentNotes }
  roster: AnalysisRosterPlayer[]
  video: AnalysisVideoSummary | null
  events: AnalysisEvent[]
  generatedAt: string
}
```

Events include resolved player names (not just IDs), making the generator fully self-contained.

---

## 3. Output Structure

The generator returns a `GeneratedGameReport`:

```ts
interface GeneratedGameReport {
  title: string
  executiveSummary: string
  overallConfidence: "high" | "medium" | "low"
  assumptions: string[]
  limitations: string[]
  coachingInsights: GeneratedCoachingInsight[]    // up to 5
  playerReports: GeneratedPlayerReport[]           // per tagged player
  practiceRecommendations: GeneratedPracticeRecommendation[]  // up to 5
  opponentTendencies: GeneratedOpponentTendency[]  // up to 4
}
```

---

## 4. How the Generator Works

### Executive Summary

Constructed from real data:
- Number of events analyzed
- Coach notes presence
- Video upload status
- Game result and score
- Top event types (from frequency analysis)
- Roster size
- High-impact event count
- Honesty disclaimer about mock AI scope

### Coaching Insights (up to 5)

Each insight is generated from a different evidence angle:

| Priority | Source |
|----------|--------|
| 1 | High/critical importance events cluster |
| 2 | Most frequently recurring event type |
| 3 | Most recurring tag across events |
| 4 | Coach notes content analysis |
| 5 | Own-team vs. opponent event breakdown |

Each insight references:
- Real event IDs (for DB linking)
- Actual event labels and timestamps
- Coach/opponent note snippets
- Affected player IDs from the events

If no events exist, a single low-confidence meta-insight is generated explaining the data gap.

### Confidence Scoring

```ts
function confidenceFromCount(count: number): ConfidenceLevel {
  if (count >= 4) return "high"
  if (count >= 2) return "medium"
  return "low"
}
```

Overall report confidence is weighted:
- Events: up to 20 points (2 per event, capped at 10)
- Coach notes: 5 points
- Video: 3 points
- Opponent notes: 2 points
- 20+ → high, 8+ → medium, else → low

### Player Reports

Generated for:
1. Players tagged in at least one event (primary — from actual event data)
2. Up to 2 untagged roster players if fewer than 3 players were tagged (secondary — low confidence)

Each report references:
- Actual event labels and timestamps the player was involved in
- Positive vs. development-area event classification
- Data coverage statement (e.g. "Jordan was involved in 3 of 12 events")

### Practice Recommendations (up to 5)

Generated from:
1. Top recurring event type → sport-specific drill
2. High-impact events → team film review session
3. Coach notes → themed session
4. Opponent notes/events → opponent preparation
5. General session wrap-up (only if fewer than 3 recommendations above)

Drill names are sport-specific (Soccer, Cricket, Basketball, etc.) via `getDrillForEventType()`.

### Opponent Tendencies (up to 4)

Generated from:
- Opponent notes content (direct reference to the actual text)
- Events tagged with `teamContext = "opponent"` or `"both"`
- If no opponent data: one low-confidence "more data needed" entry

---

## 5. What the Generator Never Does

Following `AI_OUTPUT_PRINCIPLES.md`, the generator:

- Never fabricates player names not in the roster
- Never invents timestamps not in the event list
- Never claims to have watched video frames
- Never creates injury or medical assessments
- Never uses superlatives without evidence
- Never produces motivational-poster-style output
- Never invents scores or statistics
- Always references the actual DB IDs for evidence linking

---

## 6. Limitations Declared

Every generated report includes explicit limitations:

- "This report is based on manually entered timestamps and notes — not automated video analysis."
- "Automated player tracking and ball tracking are not active in this MVP."
- "Video was uploaded, but frame-level computer vision analysis was not performed."
- Contextual limitations based on missing data (no coach notes, few events, etc.)

---

## 7. Switching to a Real LLM

When Prompt 10+ adds real LLM integration:

1. A new file is created: `lib/ai/openai.ts` (or `lib/ai/anthropic.ts`)
2. It exports a function with the same signature: `generateReport(input: AnalysisInputSnapshot): GeneratedGameReport`
3. `lib/ai/providers.ts` adds a new `case "openai":` that calls it
4. Setting `AI_PROVIDER=openai` in `.env.local` switches providers
5. The rest of the pipeline (orchestrator, DB persistence, UI) is completely unchanged

The `AnalysisInputSnapshot` becomes the LLM prompt input. The generator builds a structured prompt from it following the `AI_OUTPUT_PRINCIPLES.md` preamble template, calls the API, parses the JSON response into `GeneratedGameReport`, and returns it.

Zod validation will be added at the parse step to catch hallucinated or malformed AI output before it reaches the database.

---

## 8. Development Usage

The mock generator is always active unless `NEXT_PUBLIC_ENABLE_REAL_AI=true` and a real provider is configured:

```env
AI_PROVIDER=mock          # default — use mock generator (no API key needed)
AI_PROVIDER=openai        # use OpenAI (requires OPENAI_API_KEY)
AI_PROVIDER=anthropic     # use Anthropic (requires ANTHROPIC_API_KEY)
NEXT_PUBLIC_ENABLE_REAL_AI=true  # must be set to unlock real providers
```

In development, leave `AI_PROVIDER=mock`. Reports will be generated instantly without any API cost.
