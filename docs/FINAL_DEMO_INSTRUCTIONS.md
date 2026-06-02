# GameIQ — Final Demo Instructions

> Read this before every demo. The goal is not to explain the technology — it is to let the coach feel the problem being solved.

---

## Demo Setup

### Requirements
- Node.js 20+, npm 10+
- `.env.local` with `AI_PROVIDER=mock` and `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`
- (Optional) Supabase configured for full authenticated flow

### Quick setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local:
# AI_PROVIDER=mock
# NEXT_PUBLIC_ENABLE_MOCK_DATA=true

npm run dev
# Open http://localhost:3000
```

### Pre-demo checklist (do before the session)

1. Sign in to your account
2. Navigate to `/demo/setup` and click **Create demo workspace**
3. Confirm the report loaded: **Match vs Lakeside CC** with all sections visible
4. Have two browser tabs ready: report dashboard + game detail
5. Have an incognito window ready for the share link demo
6. Confirm `/demo/setup` works (run it once for yourself first)
7. Know your answer to: "How does the AI know what happened?" — "It reasons over the events the coach tagged. It doesn't analyze video frames it can't see."

### Demo workspace contents
- **Madison Cricket XI** — 10-player cricket team with positions and jersey numbers
- **Match vs Lakeside CC** — game with score, coach notes, opponent notes
- **12 tagged key moments** — batting, bowling, fielding, and opponent events across 6 event types
- **Full AI coaching report** — 5 coaching insights, 3 player reports, 2 opponent tendencies, 3 practice recommendations

---

## 5-Minute Demo Flow

> Use this for investors, professors, and quick technical demos. Have the report already loaded.

| Step | What to show | What to say |
|------|-------------|-------------|
| 1. Report dashboard | Scroll through the 6 sections | "This is what a coach gets after a 10-minute tagging session." |
| 2. Coaching insight | Click an insight | "Every claim has evidence — which specific moment it's grounded in." |
| 3. Evidence panel | Show the tagged event | "The AI didn't invent this. The coach tagged this moment — it's right there." |
| 4. Verification | Click "Mark as Accurate" | "The coach tells the AI when it's right or wrong. Those corrections are stored." |
| 5. Share link | Create a Public Summary link | "One click to create a read-only link for the team." |
| 6. Shared view | Open in incognito | "Players see a clean, read-only report. No app access, no player data for others." |
| 7. Export | Open export page | "Print-ready PDF layout with full evidence and practice plan." |

---

## 15-Minute Deep Demo

> Use this for coach demos. Start with their world — not the product.

### Opening question (don't skip this)

> "Before I show you anything — how do you currently review film? What does that process look like for you after a game?"

Let them answer. Then:

> "What we kept hearing from coaches was: 'I record everything, but I don't have time to turn it into something useful for my players.' That's the problem we're trying to solve."

### Full flow

**1. Sign up / sign in (2 min)**
- Show the signup form with confirm-password validation
- Explain: email/password, no team invitation required yet
- Land on dashboard — show the "Welcome + setup checklist"

**2. Create a team (30 sec)**
- Or use the demo workspace (faster for demos)
- Show: team name, sport selection, organization

**3. Show the roster (1 min)**
- 10 players with names, jersey numbers, positions
- "The AI knows who was involved in each moment because you tell it"

**4. Show the game record (1 min)**
- Opponent, score, result, coach notes, opponent notes
- "These notes become context for the AI report"

**5. Show the timestamps (2 min)**
- 12 tagged key moments — scroll through the list
- Open one event: timestamp, event type, players involved, importance, description
- "This is the core input. The more specific you are, the better the report."
- Show the AI readiness badge: "We score the inputs before you generate — so you know if the report will be strong"

**6. Generate the report (30 sec)**
- Click Generate Report → wait for mock AI to complete (~1 second)
- "In real use with OpenAI, this takes 15–30 seconds"

**7. Walk through the report (3 min)**
- Section nav: Overview → Insights → Players → Opponent → Practice → Evidence
- Open an insight — show the evidence panel, confidence score, assumptions
- "The AI shows you what it assumes when it doesn't have enough data"
- Open a player report — show strengths, improvement areas, key moments
- Practice recommendation — drill name, duration, coaching points

**8. Verify and edit (1 min)**
- Mark an insight as "Partially Accurate" — add a correction note
- Show the badge appears, note the original text is preserved
- "The original AI output is never deleted. Corrections go in alongside it."

**9. Share (1 min)**
- Create a Player Specific link for one player
- Open in incognito — show only that player's section
- Create a Staff Only link — show it requires login

**10. Export (30 sec)**
- Configure sections, open export page
- "Browser print-to-PDF for now. Server-side PDF is on the roadmap."

---

## Demo Talk Track

### On evidence-linked insights:
> "Most AI tools give you answers. GameIQ gives you answers with sources — which exact moment the claim is grounded in. Coaches need to trust the output before they share it with players."

### On coach verification:
> "We call this human-in-the-loop. The AI proposes. The coach verifies. The corrections are stored — and eventually, that data makes the AI better for your specific sport and team."

### On manual tagging:
> "In v1, coaches tag key moments manually. It takes about 10 minutes for a full game. We know that's not zero effort. But it's dramatically less than 2–4 hours of unstructured film review — and it produces something you can actually share with players."

### On no computer vision:
> "We're honest about this: the AI doesn't analyze video frames. It reasons over the events you tag. That's intentional — it's faster to build, more trustworthy, and avoids overclaiming. Computer vision is the next phase."

### On the data moat:
> "Every correction a coach makes is training signal. Every verified insight tells us what's accurate for this sport, this team, this level of play. Over time, that data becomes the moat."

---

## Demo Safety Notes

1. **Do not claim the AI analyzes video frames.** It does not. It reasons over structured inputs coaches provide.
2. **Do not upload real player data from real teams** without their explicit consent during a demo.
3. **Use mock AI** (`AI_PROVIDER=mock`) unless you have intentionally configured OpenAI and set a spend cap.
4. **Use the demo workspace** for first-time demos — it takes 10 seconds and is always clean.
5. **Do not show the settings page** — it is a UI placeholder with disabled inputs. Skip it.
6. **Do not show the admin pages** unless you are the only person in the room.
7. **Be honest about limitations.** Coaches respect honesty. "We don't have X yet, that's v1.1" is a stronger statement than pretending it works.

---

## After the Demo

Ask these questions:

1. "Does this match a real problem you have, or would you have approached it differently?"
2. "Which part was most valuable — the coaching insights, the player reports, or the practice recommendations?"
3. "If this worked perfectly, would you use it after every game?"
4. "What would make you NOT use it?"
5. "If this cost $X per month for your team, would that be worth it?"

Document the answers. Every session is a discovery call.

See [`COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md) and [`FIRST_USER_FEEDBACK.md`](FIRST_USER_FEEDBACK.md).

---

*Last updated: 2026-06-02 — Prompt 26: Final Project Handoff*
