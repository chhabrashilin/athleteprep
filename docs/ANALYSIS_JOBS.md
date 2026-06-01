# GameIQ — Analysis Job System

> This document describes the analysis job lifecycle, input snapshot strategy, output snapshot, versioning, permissions, and the route used to trigger report generation.

---

## 1. Purpose

An `analysis_job` row represents one attempt to generate a game report for a specific game. It acts as:

1. A queue entry (pending → running → completed/failed)
2. An audit trail — stores the exact input data used and the resulting output
3. A duplicate-prevention mechanism — if a job is already running, a second job will not start
4. A traceability record — future report re-generation always creates a new job, never overwrites an old one

---

## 2. Job Lifecycle

```
pending → running → completed
                 ↘ failed
```

| Status | Meaning |
|--------|---------|
| `pending` | Job created, not yet started. Set on insert. |
| `running` | Report generation has started. `started_at` is set. |
| `completed` | Generation succeeded. `completed_at` and `output_snapshot` are set. |
| `failed` | Generation failed. `failed_at` and `error_message` are set. |

Transitions are sequential. The orchestrator (`lib/analysis/generate-report.ts`) updates the job status at each step.

---

## 3. Input Snapshot

The `input_snapshot` field on `analysis_jobs` stores the complete `AnalysisInputSnapshot` at the time the report was generated.

This snapshot includes:
- Team name, sport, level, organization
- Game title, type, opponent, date, result, score, coach notes, opponent notes, summary notes
- Active roster (players with ID, name, position, jersey number, notes)
- Primary video asset (file name, duration, upload status)
- All event timestamps sorted chronologically (with player names resolved)

**Why this matters:** The snapshot makes reports reproducible. If the coach later asks "why did the AI say that?", we can inspect exactly what data was fed into the generator at report time.

---

## 4. Output Snapshot

The `output_snapshot` field on `analysis_jobs` stores a summary of what was created:

```json
{
  "reportId": "uuid",
  "version": 2,
  "insightCount": 4,
  "playerReportCount": 3,
  "practiceRecCount": 4,
  "opponentTendencyCount": 2,
  "overallConfidence": "medium"
}
```

The full structured output lives in `game_reports.raw_ai_output`.

---

## 5. Data Access Functions (`lib/db/analysis-jobs.ts`)

| Function | Description |
|----------|-------------|
| `createAnalysisJob(input)` | Creates a job in `pending` status |
| `markAnalysisJobRunning(jobId)` | Transitions to `running`, sets `started_at` |
| `markAnalysisJobCompleted(jobId, output)` | Transitions to `completed`, stores output |
| `markAnalysisJobFailed(jobId, error)` | Transitions to `failed`, stores error message |
| `setAnalysisJobInputSnapshot(jobId, snapshot)` | Updates the input snapshot after collection |
| `getLatestAnalysisJobForGame(teamId, gameId)` | Returns the most recent job (newest first) |
| `getAnalysisJobsForGame(teamId, gameId)` | Returns all jobs for a game |

---

## 6. Duplicate Prevention

Before creating a new job, `generateReportForGame` checks if the latest job is in `pending` or `running` status. If so, it returns an error rather than starting a second generation.

This prevents:
- Double-click generation
- Browser back/forward navigation triggering duplicate reports

---

## 7. Permissions

| Action | owner | coach | analyst | player | viewer |
|--------|-------|-------|---------|--------|--------|
| View job status | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create job (generate report) | ✅ | ✅ | ✅ | ❌ | ❌ |

Authorization is enforced at two layers:
1. `generateReportForGame` checks the user's `team_members.role` via Supabase.
2. RLS policies on `analysis_jobs` require team membership for `SELECT` and staff role for `INSERT`.

---

## 8. Report Versioning and Idempotency

When a report is generated:

1. All existing `game_reports` for the game are set to `is_current = false`.
2. The new report gets `is_current = true` and `report_version = previous_max + 1`.
3. Previous reports are never deleted — they are preserved as an audit history.

Version numbers start at 1 and increment on each regeneration.

The `getReportVersionNumber` function queries `max(report_version)` for the game and adds 1.

---

## 9. Server Action

Report generation is triggered via the `generateReportAction` server action:

```
app/teams/[teamId]/games/[gameId]/report/actions.ts
```

The action:
1. Calls `generateReportForGame(teamId, gameId)`
2. On success: calls `revalidatePath` for report, setup, game detail, and games list pages
3. Returns the result (success with `reportId` and `jobId`, or error)

The client-side `GenerateReportButton` component calls this action and handles loading/error states.

---

## 10. Transaction Limitation

Supabase JS does not support multi-statement transactions natively. The orchestrator inserts records sequentially:

1. `game_reports` (parent)
2. `coaching_insights` (child)
3. `player_reports` (child)
4. `practice_recommendations` (child)
5. `opponent_tendencies` (child)

If a child insert fails, the parent `game_reports` row already exists. This is an accepted MVP tradeoff. Failed child inserts are logged but do not roll back the parent.

**Future improvement:** Wrap in a Postgres RPC function (`SECURITY DEFINER`) to get atomic insertion.

---

## 11. Game Status Update

After a successful report generation, the orchestrator attempts to update the game's `status` to `"analyzed"`. This is best-effort — if it fails, the report is still saved and the failure is logged but not surfaced to the user.

---

## 12. Future: Background Jobs

In the current MVP, report generation runs synchronously within the server action. This works for mock AI (~200ms).

When real LLM calls are added (5–60+ seconds), the architecture needs to move to a background job pattern:

1. Server action creates the job and returns immediately with a `jobId`
2. A background worker (e.g. Vercel Cron, Inngest, BullMQ) picks up the job
3. Client polls job status via Supabase Realtime or polling endpoint
4. UI shows a live progress indicator

The job table is already designed for this — `started_at`, `completed_at`, `failed_at`, and `status` support the full async lifecycle.
