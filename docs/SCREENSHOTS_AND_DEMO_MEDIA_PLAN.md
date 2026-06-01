# GameIQ — Screenshots & Demo Media Plan

> A checklist of screenshots and demo media to capture for pitch decks, portfolio, documentation, and the public README.

---

## Screenshot Capture Checklist

Before capturing any screenshot:
1. Enable demo mode (`NEXT_PUBLIC_ENABLE_MOCK_DATA=true`)
2. Create the demo workspace (`/demo/setup`)
3. Confirm Madison Cricket XI report is loaded and looks complete
4. Use a clean browser profile with no extensions
5. Set browser to 1440×900 (laptop) or 1920×1080 (desktop)
6. Clear any test/dev banners from view

---

### 1. Landing Page Hero

**Route:** `/`
**What to show:** Headline, subheadline, primary CTA ("Request Early Access" or "Watch Demo"), hero section only
**Why it matters:** First impression for coaches, investors, and recruiters
**Avoid:** Showing dev-mode banners, error states, test data in URL
**Privacy:** None — public page

---

### 2. Dashboard

**Route:** `/dashboard`
**What to show:** Team summary cards, setup checklist (all steps checked), recent AI reports panel, demo CTA if visible
**Why it matters:** Shows the coach's home view — demonstrates the workflow entry point
**Avoid:** Showing personal email in profile area
**Privacy:** Use demo account only; no real user data

---

### 3. Team Workspace

**Route:** `/teams/[teamId]`
**What to show:** Team name (Madison Cricket XI), sport badge, roster count, game count, recent report links, progress cards
**Why it matters:** Shows the team context layer — demonstrates workspace concept
**Avoid:** Admin-only controls if visible
**Privacy:** Demo data only

---

### 4. Roster Page

**Route:** `/teams/[teamId]/players`
**What to show:** Full roster list with player names, jersey numbers, positions, active status, search bar
**Why it matters:** Demonstrates structured player data that feeds into AI reports
**Avoid:** Any real player names from actual teams
**Privacy:** Demo data only — all player names are fictional

---

### 5. Game Detail / Setup

**Route:** `/teams/[teamId]/games/[gameId]`
**What to show:** Game metadata (Match vs Lakeside CC, date, result, score), 4-step workflow checklist (all steps complete), coach notes preview
**Why it matters:** Shows the pre-analysis setup flow — establishes how context is structured
**Avoid:** Internal game IDs in URL if sensitive-looking
**Privacy:** Demo data only

---

### 6. Timestamp Tagging Page

**Route:** `/teams/[teamId]/games/[gameId]/timestamps`
**What to show:** Video player on left, event list on right — 12 tagged events visible, AI readiness badge showing "Ready" (green), one event expanded with full detail
**Why it matters:** This is the key differentiator — the evidence layer that makes AI reports trustworthy
**Avoid:** Showing the raw video file URL
**Privacy:** Demo data only; video is demo content

---

### 7. Report Dashboard

**Route:** `/teams/[teamId]/games/[gameId]/report`
**What to show:** Full multi-section dashboard — executive summary, top 5 insights with confidence badges (High/Medium/Low), section anchor nav, report version badge
**Why it matters:** The main product output — demonstrates the AI report quality and structure
**Avoid:** Truncated or loading state; ensure all 5 insights are visible
**Privacy:** Demo data only

---

### 8. Insight Detail with Evidence

**Route:** `/teams/[teamId]/games/[gameId]/report/insights/[insightId]`
**What to show:** Insight title, description, confidence badge, evidence section listing specific tagged events (event label, timestamp, players), video seek button
**Why it matters:** Demonstrates the trust architecture — every claim is traceable to a specific tagged moment
**Avoid:** Showing an insight with low evidence (pick a "High" confidence insight)
**Privacy:** Demo data only

---

### 9. Verification and Editing

**Route:** `/teams/[teamId]/games/[gameId]/report/insights/[insightId]` (with verification panel visible)
**What to show:** Verification status buttons (Accurate / Partially Accurate / Inaccurate / Edited), one insight marked as "Edited" with the edit badge visible
**Why it matters:** Demonstrates human-in-the-loop trust layer — coaches control the AI output
**Avoid:** Showing multiple "Inaccurate" verdicts — it looks like the AI is bad rather than demonstrating the feature
**Privacy:** Demo data only

---

### 10. Share Modal

**Route:** `/teams/[teamId]/games/[gameId]/report` (with share modal open)
**What to show:** Share modal with 4 visibility mode options, token field (blurred or partially redacted), expiration setting, copy button
**Why it matters:** Demonstrates the sharing architecture — useful for coaches who want to share with players or staff
**Avoid:** Showing full share token URL — redact the token value in screenshot
**Privacy:** Redact the actual token. Do not screenshot a valid shareable link.

---

### 11. Shared Report Page

**Route:** `/share/reports/[token]`
**What to show:** Clean shared report layout (no sidebar, no team nav), report title, executive summary, insights section — demonstrating the public-facing presentation mode
**Why it matters:** Shows what players/staff see when they open a shared link
**Avoid:** Showing the actual token in the URL bar — blur it
**Privacy:** Use demo share token; do not create real tokens for screenshots

---

### 12. Export-Ready Report

**Route:** `/teams/[teamId]/games/[gameId]/report/export`
**What to show:** Full print-ready view with all sections visible, section selector visible on left (all checked), clean layout with no sidebar or header chrome
**Why it matters:** Demonstrates professional-grade output — looks like a real scouting report
**Avoid:** Showing the browser print dialog open (takes a second screenshot just before triggering print)
**Privacy:** Demo data only

---

### 13. Admin Analytics (Use With Caution)

**Route:** `/admin/analytics`
**What to show:** Funnel visualization, event count summary cards, recent events feed
**Why it matters:** Demonstrates product thinking and founder analytics infrastructure
**Avoid:** Showing real user emails, real usage data, or any personally identifiable information — this page shows real event data
**Privacy warning:** Only screenshot this page if using a demo account with zero real user data. Blur any real emails or user IDs visible.

---

## Demo Video Plan

### 60-Second Product Walkthrough (Social/Email)

**Goal:** Show the core value prop without narration — let the product speak.

**Sequence:**
1. Landing page (3 sec)
2. Dashboard → team workspace (5 sec)
3. Game detail with setup checklist (5 sec)
4. Timestamp tagging workspace (10 sec — show adding one event)
5. Generate report button → loading state (5 sec)
6. Report dashboard with all insights visible (10 sec — scroll through)
7. Open one insight → evidence section (8 sec)
8. Verification controls (5 sec)
9. Share modal open (4 sec)
10. Export-ready view (5 sec)

**Format:** MP4, 1920×1080, no talking — add music or titles only

---

### 5-Minute Founder Demo (Coach/Investor Meeting)

**Goal:** Full demo following the COACH_DEMO_GUIDE.md script. Narrated, live product.

**Structure:**
- 90 sec: problem framing (no product visible)
- 3 min: product walkthrough (team → game → timestamps → report → share)
- 30 sec: honest limitations statement
- 1 min: Q&A/discussion prompt

**Format:** Loom or Zoom recording preferred. Keep the browser address bar visible — it confirms this is a real product, not a mockup.

---

### Coach Interview/Demo Version (Discovery Session)

**Goal:** Show the product during a coach discovery interview. Not a polished demo — an honest look at what's built.

**Structure:**
- Start with their workflow question
- Mirror their language when showing features
- Let them drive: "Where do you want to look first?"
- End with specific questions from COACH_DEMO_GUIDE.md

**No recording required** unless coach consents. Focus on listening, not presenting.

---

## Screenshot Storage

Store captured screenshots in:
```
public/screenshots/
  landing-hero.png
  dashboard.png
  team-workspace.png
  roster.png
  game-detail.png
  timestamps.png
  report-dashboard.png
  insight-detail.png
  verification.png
  share-modal.png
  shared-report.png
  export-view.png
```

Reference in README and pitch materials using relative paths.

---

## What to Never Screenshot

- Real user email addresses visible in the UI
- Actual Supabase project URLs or anon keys
- Actual OpenAI API key values
- Real share tokens (full URL)
- Real team or player data from actual sports teams
- Admin analytics pages with real user data

When in doubt: use demo data only, blur sensitive fields, and crop to the relevant UI area.
