# GameIQ — Known Limitations

This document honestly describes what GameIQ v1 does and does not do. These are not bugs — they are intentional scope decisions for the MVP.

---

## AI and Analysis

### No automated video frame analysis

GameIQ v1 does **not** analyze video frames automatically. The AI report is generated from structured inputs — game metadata, roster data, manually tagged key moments, coach notes, and opponent notes — not from computer vision.

**Why:** Automated sports video analysis at quality levels useful for coaching requires significant infrastructure investment and specialized models that are not yet affordable for early-stage products. Manual tagging captures 80–90% of the value at a fraction of the cost.

**What coaches get instead:** A structured, evidence-linked report based on the events they tagged. The AI reasons over the tagged events — it does not invent events or claim to have analyzed frames it has not seen.

**Roadmap:** Computer vision and automated event detection are planned for future phases.

---

### No automated player tracking or ball tracking

GameIQ v1 does not track player positions, ball trajectories, or formation patterns automatically. All event data is manually tagged by coaches or analysts.

---

### No real-time or live in-game analysis

GameIQ is designed for post-game film review, not real-time in-game coaching support.

---

### Anthropic and Gemini providers are stubs

The AI layer supports OpenAI fully. Anthropic (`claude-3-5-haiku-latest`) and Gemini (`gemini-1.5-flash`) exist as clean stubs in `lib/ai/` that throw a configuration error if selected. Only **Mock** and **OpenAI** are production-ready in v1.

**To enable real AI:** Set `AI_PROVIDER=openai`, `OPENAI_API_KEY=sk-...`, and `NEXT_PUBLIC_ENABLE_REAL_AI=true`.

---

### Report quality depends on input quality

The AI report is only as good as what coaches put in. Reports generated with 2–3 tagged events and no coach notes will be generic. Reports with 10+ well-labeled events, coach notes, and opponent notes will be specific and actionable.

**Guidance:** Add at least 5 tagged key moments and a coach notes block before generating a report. The readiness badge on the report page shows the current readiness level.

---

### No retry logic for malformed AI JSON

If the AI provider returns malformed JSON, the system fails with a clear error rather than retrying. One generation attempt is made per request. If it fails, the coach can retry.

---

### No RAG over historical reports

The AI prompt does not include historical reports from past games. Each report is generated independently. Season-level trend detection and cross-game context are planned for future phases.

---

## Video

### Video sharing is not supported

Even for `private_link` and `staff_only` share modes, video is not shared. The `canShowVideo` flag is always `false` in the shared report view model. Shared reports show all text content but no video player.

**Why:** Sharing signed video URLs with unknown recipients raises copyright, bandwidth, and security concerns. Explicit video sharing with coach opt-in is planned for future releases.

---

### No server-side video processing

Video files are uploaded directly to Supabase Storage. No thumbnail generation, duration extraction, or format transcoding occurs server-side in v1.

**Workaround:** Coaches can enter the video timestamp for each event manually — the timestamp input accepts `MM:SS`, `H:MM:SS`, or seconds.

---

### Video signed URLs expire after 1 hour

Supabase Storage signed URLs are valid for 1 hour. If a coach opens the timestamps page and leaves the tab open for more than 1 hour, the video player will need to be refreshed to get a new signed URL.

---

## Export and PDF

### Browser PDF export only — no server-side PDF

The export view uses browser print-to-PDF via `window.print()`. There is no server-side PDF generation (Puppeteer, Playwright, or similar) in v1. This means:
- Export quality depends on the browser and OS print driver.
- PDFs cannot be automatically stored or emailed.
- The coach must manually trigger the print dialog.

**Roadmap:** Server-side PDF generation with automatic export record storage is planned.

---

### Export records are not downloadable

The `exports` table tracks export history (timestamp, sections included, generated-by), but the actual PDF file is not stored server-side — it exists only in the coach's browser download.

---

## Sharing and Access

### Share links do not deduplicate view counts

Each page load of a shared report increments `view_count`. Multiple loads from the same user in the same session count as multiple views. True unique visitor tracking is a future enhancement.

---

### No email delivery of share links

Share links are created in the app and must be manually copied and sent. There is no email integration — coaches must copy the URL and share it themselves.

---

### Player-specific sharing is basic

The `player_specific` visibility mode shows only the selected player's report and their tagged practice recommendations. It requires that a `player_reports` row exists for that player in the database. If a player was not tagged in any events or the AI did not generate a player report for them, the shared link shows no player content.

---

## Authentication and Users

### Email/password auth only

Only email + password sign-in is supported. OAuth providers (Google, GitHub, Apple) are not yet integrated, though the auth callback route is designed to support them.

---

### No password reset flow

There is no "Forgot password?" feature in v1. Password resets must be initiated manually through the Supabase dashboard. A recovery flow using `/auth/callback?type=recovery` is planned.

---

### No team invitations

There is no invitation workflow. Team owners create the team and invite members through the Supabase dashboard or by directly inserting `team_members` rows. In-app invitations via email are planned.

---

### Player role has same data access as staff in v1

The `player` role is defined in the schema and enforced at the write level (players cannot create/edit/delete team data). However, players can read all team data — including other players' reports and the full coaching report — rather than being limited to their own section.

**Roadmap:** Player-scoped access (showing only the player's own report) is planned via the `player_specific` share link model and a dedicated player-facing view.

---

## Analytics and Reporting

### No season analytics

GameIQ v1 supports single-game analysis only. There is no aggregation across multiple games, no season-long trend detection, and no cross-game insight comparison.

---

### No performance trend tracking

Individual player development tracking across games is not yet implemented. Each game report is independent.

---

## Integrations

### No wearable or biometric data integration

Heart rate, GPS tracking, acceleration, and other wearable data are out of scope for v1. The architecture does not block this future integration — it would add new event types and a new input source to the AI snapshot.

---

### No video platform integrations

Video must be uploaded directly to Supabase Storage. There is no integration with Hudl, YouTube, Vimeo, or other video platforms.

---

## Infrastructure

### No payments or subscriptions

GameIQ v1 has no billing system. All features are accessible to any authenticated user. Payments and seat-based pricing are planned for Phase 8+.

---

### No automated test suite

Unit and integration tests are not currently set up. TypeScript strict mode, ESLint, and the production build (`npm run build`) serve as the automated quality gate. A proper test suite (Vitest, Playwright) is planned.

---

### Supabase free tier pauses after inactivity

Supabase free-tier projects pause after approximately 1 week of inactivity. The app will show a configuration error until the project is unpaused. For production use, upgrade to Supabase Pro.

---

## Honest Summary

GameIQ v1 is a complete, functional MVP that delivers real value to coaches who use it seriously. The AI analysis is honest — it reasons over inputs coaches provide, not over video frames it cannot see. The report quality is high when inputs are high quality.

The limitations above are known, documented, and prioritized for future releases. None of them block the core demo flow or prevent real coaching teams from using the product today.

---

## Next Steps

For the prioritized fix list, see [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md).

For the v1.1 engineering plan that addresses the most important limitations, see [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md).

For the computer vision roadmap explaining when and how automated video analysis will be added, see [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md).
