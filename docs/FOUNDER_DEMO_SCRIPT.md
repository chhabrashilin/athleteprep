# GameIQ — Founder Demo Script

**Duration:** 5–7 minutes  
**Audience:** Coaches, investors, professors, early users  
**Tone:** Confident, honest, product-led  
**Updated:** Prompt 17 — `/demo`, `/request-access`, and `/feedback` pages now exist

---

## Opening (30 seconds)

> "GameIQ is an AI game intelligence platform for sports coaches. Most coaches spend 2–4 hours cutting film and writing individual feedback after every game. GameIQ cuts that to 15 minutes and makes it better — structured, evidence-linked, and coach-verified."

**Problem:**
- Coaches watch hours of footage manually
- Player feedback is inconsistent or skipped entirely
- Practice planning is reactive, not data-driven
- Game analysis lives in coaches' heads, not in a system

**Target user:** Head coaches and coaching staff at college, competitive club, and semi-professional teams across any sport.

---

## Demo Steps

### 1. Landing Page → Sign In

> "Let's start from the top."

- Open `gameiq.com` (or `localhost:3000`)
- Point out the headline: *"Turn game film into coach-ready intelligence."*
- Note the 7 sections — Problem, How It Works, Report Features, Trust, MVP Honesty
- Point to the **MVP Honesty section** — "This is intentional. Manual timestamps, not automated CV."
- Navigate to `/demo` to show the demo explanation page
- Sign in with your demo account

**Talk track:** "The landing page is direct — we don't oversell what it does. Coaches are skeptical of AI promises. We earn trust by being specific — including about what we haven't built yet."

---

### 2. Dashboard

> "After sign-in, you land on the dashboard."

- Show the team summary grid
- Point out the setup checklist (shows real progress state)
- Point out the recent AI reports panel

**Talk track:** "The dashboard is your intelligence hub. It shows you every team you manage, your setup progress, and your most recent reports. Nothing is fake — everything connects to real data."

---

### 3. Demo Workspace (if demoing fresh)

> "I'm going to show you our demo team — Madison Cricket XI."

- Navigate to `/demo/setup` if needed
- Click **Create demo workspace**
- Wait ~10 seconds for team + roster + game + timestamps + AI report to be created
- You'll be redirected to the report automatically

**Talk track:** "This just created a full team workspace with 10 players, a complete game with 12 tagged key moments, and an AI-generated coaching report. In real use, a coach builds this over 10–15 minutes by tagging events while reviewing film."

---

### 4. Team Workspace

> "Here's the team workspace."

- Show roster card (10 players), games card, AI reports card
- Click into **Manage roster**
- Show 2–3 player cards (Arjun Patel, Kabir Singh, Dev Iyer)
- Return to workspace

**Talk track:** "Every player on the roster feeds into the AI report. When we generate insights, the AI knows who was involved in which events — it doesn't invent names."

---

### 5. Game Detail

> "Let's look at the game."

- Navigate to `Match vs Lakeside CC`
- Show the 4-step workflow (Setup → Video → Key Moments → AI Report)
- Show the setup checklist (game details complete, timestamps complete, report generated)
- Point out the video section — explain the v1 approach honestly

**Talk track:** "In v1, GameIQ uses structured notes and manually tagged key moments — not automated frame-by-frame video analysis. That's intentional. Automated computer vision at this quality level doesn't exist yet for affordable sports platforms. We're honest about that."

---

### 6. Key Moments / Timestamps

> "This is where the evidence comes from."

- Click **Key moments** or navigate to `/timestamps`
- Show the list of 12 events (batting, bowling, fielding, opponent tendencies)
- Point out labels, importance levels (critical/high/medium), tags, player names
- Show 1–2 events in detail: description, tags, team context

**Talk track:** "A coach — or their analyst — tags events while reviewing film. Each tag includes the player involved, what happened, why it mattered, and custom tags like 'death overs' or 'fielding'. These tags become the evidence the AI reasons over."

---

### 7. AI Report

> "Let's see what the AI produced."

- Navigate to the report dashboard
- Show the header: **confidence badge**, **version badge**, **generated from**
- Scroll through sections:
  1. **Executive summary** — game narrative
  2. **Coaching insights** — 5 evidence-linked insights
  3. **Player reports** — individual feedback per tagged player
  4. **Practice recommendations** — specific drills with timing
  5. **Opponent tendencies** — patterns observed, recommended responses
  6. **Assumptions & limitations** — transparency section

**Talk track:** "Every insight has a confidence score — high, medium, or low — based on how much evidence supports it. The AI never makes up player IDs or event references. If it can't find evidence, it says so."

---

### 8. Evidence-Linked Insight Detail

> "Let's go deeper on one insight."

- Click on an insight (e.g. *"Death-over execution breakdown"*)
- Show the two-column layout: insight content + evidence panel
- Point to evidence references — timestamp, label, player tagged
- If video were present, clicking the timestamp would seek to that moment

**Talk track:** "Each insight is grounded in specific events the coach tagged. A coach can click through to see exactly what the AI is referencing. This creates accountability — you can't just dismiss an AI insight because it 'sounds wrong'; you can trace back to the evidence."

---

### 9. Coach Verification and Editing

> "Coaches don't just read the report — they verify it."

- Find any insight or player report
- Click **Verify** and select **Accurate** or **Partially Accurate**
- Add a correction note if needed
- Show the verification badge that appears after

**Talk track:** "This is the trust layer. AI generates the first draft. Coaches verify, correct, or annotate. The original AI output is always preserved — nothing gets overwritten silently. This creates an audit trail and makes the report feel like coach-authored content."

---

### 10. Sharing

> "Reports can be shared with anyone."

- Click **Share** in the report header
- Create a share link with **Public summary** visibility
- Copy the link
- Open in a new incognito tab to show the public view

**Talk track:** "Four visibility modes: private link, staff only, player-specific, and public summary. A public summary only shows the executive summary and insight titles — no player data. A player-specific link shows only that player's report. Secure cryptographic tokens, expiration dates, revocation."

---

### 11. Export

> "Finally — export to PDF for meetings or email."

- Click **Export** in the report header
- Show the section selector (choose which sections to include)
- Open the export page
- Click **Print / Save as PDF**

**Talk track:** "Clean print layout — no sidebars, no app chrome. Coaches can send this as a PDF to players, parents, or coaching staff. Server-side PDF generation is on the roadmap."

---

## Key Talk Tracks

### Why manual timestamps?

> "We're intentional about this. Automated computer vision for sports is expensive, inaccurate below professional-grade infrastructure, and still requires human verification anyway. By making tagging structured and efficient, we get 90% of the value at 1% of the cost. And we can add CV in the future as the revenue supports it."

### Why evidence and confidence scores?

> "Coaches don't trust 'AI said so'. When an insight says 'Death-over bowling plan — High Confidence — based on 4 events from overs 38–45', a coach knows exactly what the AI is looking at. When it says Medium Confidence, the coach knows to verify more carefully. This turns AI from a black box into a reasoning tool."

### Why coach verification?

> "The product has to work the way coaches think. Coaches don't want to be replaced — they want leverage. Verification means the AI produces a first draft the coach improves, not a final answer the coach is forced to accept. The report becomes more valuable over time as coaches iterate."

### Why is this a bigger company?

> "Start with game review. Expand to season-long analytics, recruiting profiles, practice planning automation, opponent scouting. Every team at every level needs this. We're building the operating system for sports coaching intelligence."

---

## Closing (30 seconds)

**What's built:**
- Full auth, team, roster, game, video, timestamps, AI report, verification, sharing, export
- Provider-agnostic AI layer (mock default, OpenAI ready, Anthropic and Gemini stubs)
- Evidence-linked insights with confidence scoring
- Role-based access control across all features

**What's next:**
- Final QA, security review, deployment readiness (Vercel + Supabase production)
- Season analytics — aggregate insights across multiple games
- Automated scouting report generation from opponent data
- Real-time collaboration features for coaching staff

**Why now:**
> "AI tools for sports are 2–3 years behind enterprise use cases. Coaches are still running on spreadsheets and WhatsApp messages. We're building the first product that meets coaches where they are — structured, trustworthy, and 10 minutes to a coaching report."

---

## After the Demo — Feedback Collection

After showing the product:

1. **Send them to `/feedback`** — "Would you mind filling in a 2-minute feedback form? It directly shapes what we build next."
2. **Or send them to `/request-access`** — if they have not already — to capture their role, sport, and pain point.
3. **Admin review** at `/admin/feedback` (requires `ADMIN_EMAILS` env var set to your email).

See [`/docs/FIRST_USER_FEEDBACK.md`](FIRST_USER_FEEDBACK.md) for how to interpret feedback responses.
See [`/docs/COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md) for a follow-up interview script.

---

## Demo Checklist

Before demoing, verify:

- [ ] Auth works (sign up or sign in)
- [ ] Demo workspace exists or can be created
- [ ] Report loads with all sections
- [ ] Insight detail page works
- [ ] Verification controls work
- [ ] Share link can be created and opened
- [ ] Export page renders cleanly
- [ ] Environment is in mock AI mode or has OpenAI configured
- [ ] No Supabase-not-configured errors in the UI
