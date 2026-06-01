# GameIQ — v1.2 Product Roadmap

> The next product version after v1.1 reliability work. Focus is on features real coaches will ask for during the first pilot. Items are ordered by expected user demand, informed by coach discovery conversations.

**Expected timing:** After v1.1 engineering sprint is complete and at least 3–5 coach discovery sessions have been run.  
**Rule:** Do not build any of these until coach interview data confirms demand. Prioritize based on what coaches actually ask for, not what the founder predicts.

---

## 1. Team Member Invitation Workflow

**User problem:** Team owners cannot invite coaches, analysts, or players to the workspace. The only path is direct database insertion — impossible for a non-technical coach to do.

**Proposed solution:**
- Owner can enter a teammate's email address in the team workspace
- System sends a Supabase-native invitation email with a unique join link
- Invited user clicks the link, creates an account (or signs in), and is auto-added to the team with the specified role
- Owner can see pending invitations and revoke them

**MVP version:**
- Email invitation only (no in-app link sharing)
- Roles: coach, analyst, player (owner is auto-assigned to creator)
- No bulk invitations in v1.2

**Success metric:**
- A team owner can invite a second user without founder intervention
- At least one pilot team has 2+ active members

**Complexity:** M  
**Dependencies:** Supabase email templates, auth callback route update

---

## 2. Password Reset Flow (Full Implementation)

**User problem:** No "Forgot password?" feature. Current workaround (Supabase dashboard) is not possible for non-founder users.

**Proposed solution:**
- "Forgot password?" link on the login page
- Email entry form that triggers `supabase.auth.resetPasswordForEmail`
- Recovery email contains a link back to the app
- `/auth/callback` already handles `type=recovery` — wire the recovery page
- Post-recovery redirect to settings or dashboard

**MVP version:**
- Email/password reset only (no SMS)
- Single recovery link per email (standard Supabase flow)

**Success metric:**
- Coach can recover their own account without contacting the founder

**Complexity:** S  
**Dependencies:** Supabase SMTP configuration, auth callback `type=recovery` handling

---

## 3. Report Comparison Across Games

**User problem:** Each game report is independent. A coach cannot see how a player performed this week versus last week, or whether a tactical issue is recurring.

**Proposed solution:**
- On the team workspace page, add a "Compare games" view
- Select 2 games → show key metrics side by side (avg confidence, insight count, verification rate)
- For a specific player: show their report summaries across games in a timeline
- Highlight repeated insight topics across games (e.g., "defensive shape" appearing in 3 of 4 reports)

**MVP version (v1.2):**
- Simple text comparison (last 2 games for a player)
- No visualization — a list-based comparison is sufficient
- Single sport only (or sport-agnostic text)

**Success metric:**
- Coach uses cross-game comparison to identify a recurring issue
- At least one pilot coach specifically requests this feature

**Complexity:** M  
**Dependencies:** Existing game_reports schema supports multiple reports per game

---

## 4. Saved Coaching Philosophy / Team Preferences

**User problem:** The AI prompt currently has no team-specific context beyond what the coach enters for each game. A team's preferred formation, playing style, and coaching priorities are not remembered.

**Proposed solution:**
- New "Team Preferences" section in the team workspace
- Fields: playing style, formation preference, primary tactical priorities (up to 5), coaching philosophy notes
- These are included in the AI input snapshot for every game in this team
- Coach can update preferences at any time

**MVP version (v1.2):**
- Free-text fields only (no structured dropdowns)
- Included in `GenerateReportInput` as `team_preferences` string

**Success metric:**
- Reports generated with team preferences feel more specific and less generic
- Coach notices the AI "knows" their team's style

**Complexity:** S  
**Dependencies:** New `team_preferences` column on `teams` table, update to AI input snapshot

---

## 5. Inline Report Quality Feedback

**User problem:** There is no prompt to rate report quality immediately after reading. The `/feedback` page requires navigation away and is rarely visited voluntarily.

**Proposed solution:**
- After the coach first views the completed report, show a sticky rating widget
- Rating: 1–5 stars + optional text comment
- Submits to `product_feedback` table with `game_id` and `report_id` as context
- Dismisses after submission or explicit dismiss
- The founder sees per-report ratings in the admin analytics page

**MVP version (v1.2):**
- Appears once per report (dismissed state stored in localStorage)
- Optional text comment (not required)

**Success metric:**
- > 50% of coaches who view a report submit a rating
- Rating data is actionable (founder can see per-report scores)

**Complexity:** S  
**Dependencies:** `product_feedback` table already exists — add `game_id` and `report_id` context columns

---

## 6. Collapsed Timestamp Form (UX Improvement)

**User problem:** The 12-field event timestamp form creates tagging friction. Core fields (time, label, type, importance) should be visible; details (description, tags, players) should be progressive disclosure.

**Proposed solution:**
- Default form shows: timestamp, label, event type, team context, importance
- "Add details" toggle reveals: description, specific players, tags
- Toggle state persists within the session
- Pre-filled defaults for common event types (reduce repetitive entry)

**Success metric:**
- Coach tags first 5 events in < 5 minutes (currently takes ~8–10 minutes)
- Fewer "abandoned halfway" sessions in analytics

**Complexity:** S  
**Dependencies:** None — UI-only change

---

## 7. Player-Specific Share Link Improvements

**User problem:** The `player_specific` visibility mode shows the player's report and their tagged practice recommendations. But a player who was not tagged in events (or for whom the AI did not generate a report row) sees nothing on their share link.

**Proposed solution:**
- Before creating a `player_specific` share link, validate that the player has a `player_reports` row
- If no row: show a warning ("No individual report found for this player — use Staff Only mode instead")
- Add optional "message from coach" field to player-specific share links
- Player share link shows coach message at top of the shared view

**Success metric:**
- Zero "blank share link" experiences for players
- Coaches can personalize player share links with a message

**Complexity:** S  
**Dependencies:** Share link creation flow update

---

## 8. Basic Drill Library

**User problem:** The AI generates next-practice drill recommendations by name (e.g., "4v4 pressing drill"). Coaches may not recognize the drill name or know how to run it.

**Proposed solution:**
- Create a small curated drill library per sport (20–30 drills)
- Each drill has: name, sport, focus area, duration, instructions, coaching points
- AI-generated drill names are matched to library entries where possible
- Coach can view drill details from the practice recommendations section

**MVP version (v1.2):**
- Cricket and soccer drill libraries only (to match likely pilot sports)
- Manual curation — no AI-generated library
- Link drill names in practice recommendations to library entries

**Success metric:**
- At least one coach opens drill details during a real game review session
- Drill recommendations feel actionable rather than named-only

**Complexity:** M  
**Dependencies:** New `drill_library` table, match logic in report rendering

---

## 9. Report Export Improvements

**User problem:** Browser print-to-PDF produces inconsistent results across browsers and OSes. Export history tracks metadata but not the actual PDF.

**Proposed solution (v1.2 partial):**
- Improve print CSS for consistent cross-browser output
- Add a "Share via email" button on the export page that opens the coach's email client with the share link pre-filled (mailto: link — no email server required)
- Track export events with browser/OS metadata for debugging

**Note:** Full server-side PDF generation (Puppeteer) is pushed to v1.3 due to complexity.

**Complexity:** S  
**Dependencies:** None — CSS improvement + mailto link

---

## 10. Sport-Specific Onboarding (Cricket and Soccer)

**User problem:** The app is sport-agnostic in tone but the demo uses cricket data. A soccer coach signing up sees cricket terminology in the demo and may feel the product isn't for them.

**Proposed solution:**
- Ask "What sport does your team play?" during team creation (already in form — use this data)
- First-visit welcome panel shows sport-specific example event types
- Demo workspace offers a sport-appropriate example (cricket OR soccer based on selection)
- AI prompt includes sport-specific terminology guidance

**MVP version (v1.2):**
- Cricket and soccer only
- Sport selection already exists — use it to branch welcome content

**Success metric:**
- Soccer coaches feel as "at home" as cricket coaches
- Sport-specific event type suggestions appear during timestamp tagging

**Complexity:** M  
**Dependencies:** Sport selection already in `teams.sport` — needs routing logic

---

## v1.2 Prioritization Guide

After coach discovery sessions, re-rank these items based on what coaches actually asked for. Expected top requests based on the known product model:

1. **Team invitations** — Almost certain to be top request from any team with > 1 coach
2. **Inline report feedback** — Low effort, high signal value for the founder
3. **Collapsed timestamp form** — Directly reduces the highest-friction step
4. **Saved coaching philosophy** — Medium-effort, high differentiation
5. **Player share link improvements** — Common demo question ("will my player see this?")

Items 6–10 should wait for explicit coach demand before being prioritized.

---

*See also: [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md), [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md)*  
*Last updated: June 2026*
