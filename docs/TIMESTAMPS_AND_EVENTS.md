# GameIQ — Manual Timestamps and Event Input

> This document describes the event timestamp feature: its purpose, data model, routes, permissions, video player integration, and roadmap for automation.

---

## 1. Purpose

Manual timestamps are the **human-in-the-loop evidence system** for GameIQ v1.

Because GameIQ does not yet implement automated computer vision or frame-by-frame analysis, coaches and analysts manually tag key moments in a game video. Each timestamp becomes a structured evidence record that the AI report engine references when generating coaching insights, player reports, and practice recommendations.

**The AI can say:**
> "Based on the 6 defensive transition events you marked between 12:30 and 47:15, the team consistently lost shape on quick counter-attacks."

**Instead of pretending it watched the video:**
> "The AI detected 14 defensive breakdowns using computer vision."

This distinction is fundamental to GameIQ's trust principles. See `/docs/AI_OUTPUT_PRINCIPLES.md`.

---

## 2. Why Timestamps Are the Evidence Layer

In GameIQ v1, the AI receives the following inputs:
- Game metadata (sport, type, date, opponent, result)
- Roster and player data
- Coach notes and opponent notes
- **Manual event timestamps** ← the primary structured evidence

Each timestamp is a structured event with:
- Exact video time (seconds)
- Optional duration (start → end)
- Label and description
- Event type
- Importance level
- Team context (own team, opponent, both, neutral)
- Tagged roster players
- Named opponent players
- Tags for filtering
- Metadata for future extension

The AI uses the full set of timestamps to identify patterns, link evidence to insights, and generate player-specific feedback.

---

## 3. Event Data Model

Defined in `types/database.ts` as `EventTimestamp`, backed by the `event_timestamps` table.

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `teamId` | uuid | Team scope — denormalized for RLS |
| `gameId` | uuid | FK → games |
| `videoAssetId` | uuid? | FK → video_assets (null if no video) |
| `createdBy` | uuid? | FK → profiles |
| `timestampSeconds` | number | Video position in seconds |
| `endTimestampSeconds` | number? | Optional end position |
| `label` | string | Short identifier (required) |
| `eventType` | string? | Category (custom text or suggested) |
| `teamContext` | string? | `own_team` | `opponent` | `both` | `neutral` | `unknown` |
| `description` | string? | Longer coaching note |
| `importance` | enum | `low` | `medium` | `high` | `critical` |
| `tags` | string[] | Normalized lowercase array |
| `playerIds` | uuid[] | Tagged roster player IDs |
| `opponentPlayerNames` | string[] | Named opponent players |
| `isAiGenerated` | boolean | False for manual events |
| `confidence` | enum? | For future AI-generated events |
| `metadata` | jsonb | Extension field |

---

## 4. TeamContext Values

| Value | Meaning |
|-------|---------|
| `own_team` | The event involves only your team |
| `opponent` | The event involves only the opponent |
| `both` | Both teams are involved |
| `neutral` | Neither team specifically (e.g. weather stoppage) |
| `unknown` | Not determined |

---

## 5. Event Types

Suggested event types are sport-specific (see `types/sports.ts`):

**Generic:** Turning point, Mistake, Scoring chance, Defensive issue, Transition moment, Set piece, Strong execution, Missed opportunity, Tactical pattern, Player development moment, Other.

**Soccer:** Goal, Shot chance, Turnover, Pressing moment, Defensive shape, Transition attack/defense, Set piece, Build-up pattern, Off-ball run, Other.

**Cricket:** Wicket, Boundary, Dot-ball pressure, Fielding error, Bowling plan, Batting decision, Running between wickets, Death over moment, Powerplay moment, Other.

**Basketball:** Scoring play, Defensive stop, Turnover, Transition opportunity, Screen action, Rebounding moment, Foul situation, Fast break, Half-court set, Other.

Coaches can always enter a **custom free-text** event type if none of the suggestions fit.

---

## 6. Route Structure

| Route | Description |
|-------|-------------|
| `/teams/[teamId]/games/[gameId]/timestamps` | Full timestamp workspace (live) |

The workspace is the primary UI for managing key moments.

---

## 7. Permissions

| Action | owner | coach | analyst | player | viewer |
|--------|-------|-------|---------|--------|--------|
| View timestamps | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create timestamp | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit timestamp | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete timestamp | ✅ | ✅ | ✅ | ❌ | ❌ |

Authorization is enforced at two layers:
1. **Application layer**: `canEdit` flag derived from `membership.role`.
2. **RLS layer**: `is_team_staff` for INSERT/UPDATE/DELETE on `event_timestamps`.

---

## 8. Timestamp Format Rules

Implemented in `lib/utils/time.ts`.

### Input formats accepted
| Format | Example | Parsed as |
|--------|---------|-----------|
| Plain seconds | `83` | 83 seconds |
| Plain float | `83.5` | 83.5 seconds |
| MM:SS | `1:23` | 83 seconds |
| MM:SS (padded) | `01:23` | 83 seconds |
| H:MM:SS | `1:02:15` | 3735 seconds |

### Display format
- Under 1 hour: `MM:SS` (e.g. `01:23`)
- 1 hour or more: `H:MM:SS` (e.g. `1:02:15`)

### Validation rules
- No negative timestamps
- Must be a valid format (plain number or colon-separated)
- Minutes and seconds must be 0–59 in colon format
- If video duration is known, timestamp is clamped to `[0, duration]`
- End timestamp must be greater than start timestamp if provided

---

## 9. Video Player Integration

The `GameVideoPlayer` component (`components/video/GameVideoPlayer.tsx`) is a `forwardRef` component exposing:

```ts
interface GameVideoPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}
```

### How the loop works

1. Coach plays video and pauses at a key moment.
2. Coach clicks "Add event at current time".
3. The workspace reads `videoRef.current.getCurrentTime()` and pre-fills the timestamp form.
4. Coach fills in label, importance, and other fields.
5. Coach submits the form — event is created via server action.
6. Coach later clicks a saved event in the list.
7. The workspace calls `videoRef.current.seekTo(event.timestampSeconds)`.
8. Video jumps to the event's timestamp.

### Current time display

The workspace shows the current video position in real-time using the `onTimeUpdate` callback, which fires on each `timeupdate` browser event (~4x per second during playback).

---

## 10. AI Readiness Logic

Implemented in `components/analysis/AIReadinessBadge.tsx`.

| State | Condition |
|-------|-----------|
| Not ready | No video AND no events |
| Needs context | Video uploaded, 0 events |
| Ready for first AI report | 1–4 events |
| Strong evidence base | 5+ events |

This readiness badge appears on:
- The timestamps page
- The game detail page
- The setup page

It is a readiness indicator only. It does not trigger AI analysis (that is Prompt 9).

---

## 11. Setup Checklist Behavior

The setup checklist (`components/games/GameSetupChecklist.tsx`) marks Step 4 "Key moments" as complete when at least one event timestamp exists for the game.

The checklist also shows:
- A link to the timestamps page when the step is incomplete.
- Guidance text: "5–10 key moments give the AI the best evidence for actionable insights."

---

## 12. Data Access Functions (`lib/db/timestamps.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getEventTimestampsForGame(teamId, gameId)` | `EventTimestamp[]` | All events, sorted by timestamp ascending |
| `getEventTimestampById(teamId, gameId, eventId)` | `EventTimestamp \| null` | Single event by ID |
| `getTimestampSummaryForGame(teamId, gameId)` | `TimestampSummary` | Count, critical/high count, unique players, event types |
| `createEventTimestampForGame(input)` | `EventTimestamp` | Creates event; throws on failure |
| `updateEventTimestampForGame(input)` | `EventTimestamp` | Partial update; throws on failure |
| `deleteEventTimestampForGame(teamId, gameId, eventId)` | `void` | Deletes event; throws on failure |

---

## 13. Server Actions (`lib/actions/timestamps.ts`)

| Action | Description |
|--------|-------------|
| `createEventTimestampAction(input)` | Create event + revalidate paths |
| `updateEventTimestampAction(input)` | Update event + revalidate paths |
| `deleteEventTimestampAction(teamId, gameId, eventId)` | Delete event + revalidate paths |

All actions call `revalidatePath` for the timestamps page, game detail, and setup page so Next.js re-renders with fresh data after mutations.

---

## 14. Current Limitations

- **Client-side filtering**: Event search and filters run in-memory on the client. For games with 100+ events, server-side filtering would be more efficient. Acceptable for MVP.
- **No batch operations**: Events must be tagged one at a time. Bulk import is a future enhancement.
- **No timeline visualization**: Events are shown as a sorted list, not a visual timeline. A scrubber-style timeline view is a future enhancement.
- **Single video per workspace**: The workspace shows the primary (most recent) video. Multi-video games are not yet supported in the UI.
- **No thumbnail preview**: Clicking an event jumps the video but does not show a frame thumbnail. Thumbnail generation is a future enhancement.
- **No undo**: Deleting an event requires a confirmation dialog but has no undo. Future: soft-delete with recycle bin.

---

## 15. Future: Automated Event Detection

In a future phase, the `is_ai_generated` flag and `confidence` field will support events created by an automated computer vision pipeline:

- Frame-by-frame analysis pipeline (separate microservice)
- Player and ball tracking
- Automated event type classification
- Confidence score per event
- Coach can accept, reject, or edit AI-generated events
- Manual events always take precedence over automated ones

Architecture does not need to change when this pipeline is added — the schema already supports it.

---

## 16. Future: Physical Clip Extraction

The `clips` table already supports `event_timestamp_id` for linking clips to timestamps. When FFmpeg-based clip extraction is implemented:

- Each timestamp will have a "Create clip" button.
- A background job extracts the video segment at `[timestamp_seconds, end_timestamp_seconds]`.
- The clip is stored in Supabase Storage and linked to the timestamp.
- Clips are accessible directly from the evidence row in a coaching insight.
