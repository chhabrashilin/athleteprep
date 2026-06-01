# GameIQ — Report Dashboard

> This document describes the full game report dashboard: its layout, components, evidence linking, video integration, permissions, and roadmap.

---

## 1. Purpose

The report dashboard is the primary product output of GameIQ — the surface that turns structured game data into actionable coaching intelligence.

It displays a fully generated AI report with:
- Executive summary and overall confidence
- Up to 5 coaching insights with evidence references
- Player-by-player feedback
- Opponent tendency analysis
- Next-practice recommendations
- Assumptions and limitations for trust transparency

---

## 2. Routes

| Route | Description |
|-------|-------------|
| `/teams/[teamId]/games/[gameId]/report` | Main report dashboard (server component) |
| `/teams/[teamId]/games/[gameId]/report/insights/[insightId]` | Insight detail with video seeking |

---

## 3. Main Report Page Layout

### States

| State | Condition | Content |
|-------|-----------|---------|
| No report | No `game_reports` row with `is_current = true` | Readiness card + generate button |
| Running | Latest job has `status = pending/running` | Job status card |
| Failed | Latest job has `status = failed`, no report | Error + retry |
| Report exists | `game_reports` row exists | Full dashboard |

### When Report Exists

1. **ReportHeader** — Title, game context, version badge, confidence badge, regenerate button
2. **ReportSectionNav** — Sticky anchor navigation (Overview / Insights / Players / Opponent / Practice / Evidence)
3. **ReportOverview** — Executive summary + report basis (what data was used)
4. **CoachingInsightsSection** — Up to 5 insight cards, each with a link to the detail page
5. **PlayerReportsSection** — Expandable player report cards
6. **OpponentTendenciesSection** — Tendency cards with evidence type badges
7. **PracticePlanSection** — Numbered recommendation cards with drills + coaching points
8. **AssumptionsLimitationsCard** — Transparency section

---

## 4. Insight Detail Page Layout

The insight detail page (`/report/insights/[insightId]`) shows a deep-dive for one insight.

Layout is two-column on desktop:

**Left column:**
- Why it matters
- Recommended action
- Assumptions
- Players involved
- Evidence list (with seek buttons when video is available)

**Right column:**
- Video player (GameVideoPlayer with seekTo ref)
- Current timestamp display
- Verification status (display-only — editing comes in Prompt 11)

Clicking a timestamp evidence card seeks the video to that moment and highlights the selected evidence.

---

## 5. Evidence Linking

Evidence items are stored as JSONB on `coaching_insights.evidence` and `opponent_tendencies.evidence`.

### Evidence Item Schema

```ts
interface EvidenceItem {
  id: string;
  type: "timestamp" | "coach_note" | "opponent_note" | "game_metadata" | "roster" | "video_status" | "manual_input";
  label: string;
  description?: string;
  timestampSeconds?: number;
  eventId?: string;      // references event_timestamps.id
  playerIds?: string[];  // player UUIDs involved
}
```

### Resolution

The `resolveEvidenceItem()` function in `lib/analysis/evidence.ts` enriches a raw evidence item:
- If `eventId` is present, looks up the full event from the evidence event map
- Resolves player IDs to display names
- Formats timestamp seconds into `MM:SS` / `H:MM:SS`

Evidence is resolved server-side and passed to client components. Client components never access the database directly.

### Types and Display

| Evidence type | Icon | Color | Meaning |
|--------------|------|-------|---------|
| `timestamp` | Clock | Sky | Key moment from event_timestamps |
| `coach_note` | FileText | Emerald | Coach-entered session notes |
| `opponent_note` | Swords | Amber | Opponent notes |
| `game_metadata` | Info | Slate | Game details (sport, score, etc.) |
| `roster` | Users | Violet | Roster data |
| `video_status` | Film | Slate | Video upload status |
| `manual_input` | Database | Slate | Manually entered data |

---

## 6. Video Timestamp Seeking

On the insight detail page:
1. `InsightDetailView` (client component) holds a `useRef<GameVideoPlayerHandle>`
2. Evidence cards with `timestampSeconds` show a "play" icon and are clickable
3. Clicking calls `videoRef.current.seekTo(seconds)` on the `GameVideoPlayer`
4. Selected evidence is highlighted
5. If no video is uploaded, evidence cards show timestamps but no seek action

`GameVideoPlayer` was updated in Prompt 8 to expose `seekTo(seconds)` and `getCurrentTime()` via `forwardRef` + `useImperativeHandle`.

---

## 7. Report Version Display

The `ReportVersionBadge` component shows:
- `v{number}` — report version number
- "Current" badge (green) if `is_current = true`
- "Older version" badge (amber) if viewing an older version

Multiple versions are preserved. When a report is regenerated, previous versions remain with `is_current = false`. The dashboard always loads the current version by default.

`getReportVersionsForGame()` returns all versions for display — not yet used in the main dashboard but ready for Prompt 11.

---

## 8. Permissions

| Action | owner | coach | analyst | player | viewer |
|--------|-------|-------|---------|--------|--------|
| View report | ✅ | ✅ | ✅ | ✅ | ✅ |
| Regenerate report | ✅ | ✅ | ✅ | ❌ | ❌ |

RLS ensures non-team-members cannot access any report data.

---

## 9. Data Access Functions

`getFullGameReportData(teamId, gameId, reportId?)` — fetches everything in parallel:
- Report metadata
- Team + game context
- All insights, player reports, practice recs, opponent tendencies
- Evidence event timestamps (resolved from evidence item `eventId` fields)
- All active players (for name resolution)
- Primary video asset + signed URL
- All report versions
- Latest analysis job

`getCoachingInsightById(teamId, gameId, insightId)` — single insight for detail page.

`getReportVersionsForGame(teamId, gameId)` — all versions for version selector (future).

---

## 10. Current Limitations

- **No coach verification/editing** — Verification badges display current status but controls are disabled. Prompt 11 implements this.
- **No sharing** — Share button is disabled. Prompt 11 implements share links.
- **No stored PDF download** — Export creates a browser PDF only; PDFs are not stored server-side. See `/docs/EXPORTS_AND_PRINTING.md`.
- **No player detail routes** — Player reports are expandable cards on the main page. Dedicated player routes are a future enhancement.
- **No version selector UI** — Multiple versions are stored but the UI only shows the current version. Future enhancement.
- **Video seeking only on insight detail** — The main report page does not include the video player (keeps the dashboard clean). Seeking happens on the insight detail page.
- **Mock AI disclosure** — When `report.aiGenerated = true` and provider is mock, a subtle "mock AI mode" label appears in the report header. This is intentional transparency.

---

## 11. Future: Coach Verification (Prompt 11)

Each insight, player report, and practice recommendation has a `verificationStatus` field (`unreviewed`, `accurate`, `partially_accurate`, `inaccurate`, `edited`). Prompt 11 will add:
- Click-to-verify controls on each card
- Inline text editing for AI-generated content
- Verification progress indicator
- Immutable verification history stored in `verification_feedback`

---

## 12. Sharing and Export

Both are now implemented (Prompts 12 and 13):
- Share button opens `ShareReportModal` — creates token-based share links with configurable visibility
- Export button opens `ExportReportModal` — navigates to `/report/export` for browser print/PDF
- See `/docs/SHARING_AND_ACCESS.md` and `/docs/EXPORTS_AND_PRINTING.md` for details

---

## 13. Future: Real LLM Integration

The report dashboard is built against the `GeneratedGameReport` type and `FullGameReportData` shape. Switching from mock to real LLM:
1. Add provider in `lib/ai/providers.ts`
2. Real LLM produces the same `GeneratedGameReport` shape
3. Dashboard renders identically — zero changes needed
