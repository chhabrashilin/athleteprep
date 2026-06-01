# GameIQ — Coach Demo Guide

> This guide is for the founder showing GameIQ to a coach, analyst, or athletic director. Read this before every demo. The goal is to listen more than pitch.

---

## Demo Goal

Show how GameIQ reduces film-review time and turns key moments into actionable coaching decisions.

**The demo succeeds if the coach says:**
- "This would actually save me time."
- "My players would actually read this."
- "How do I sign up?"

**The demo fails if:**
- The founder talks more than the coach.
- The tech gets more attention than the coaching problem.
- The coach gets confused and the founder keeps going anyway.

---

## Pre-Demo Setup

Before the demo begins:

1. Enable demo mode: `NEXT_PUBLIC_ENABLE_MOCK_DATA=true`
2. Sign in to your account
3. Navigate to `/demo/setup` and click **Create demo workspace**
4. Wait for redirect — you'll land on the AI report in ~10 seconds
5. Confirm the report is loaded: **Match vs Lakeside CC** with coaching insights visible
6. Open the report in a browser tab, and the game view in a second tab
7. Have the share link ready to demonstrate without building it live

**What the demo workspace contains:**
- **Madison Cricket XI** — 10-player cricket team with positions and jersey numbers
- **Match vs Lakeside CC** — game with score, result, coach notes, and opponent notes
- **12 tagged key moments** — batting, bowling, fielding, and opponent-context events
- **Full AI coaching report** — insights, player reports, practice recommendations, opponent tendencies

If demoing a non-cricket sport, briefly note: "This example uses cricket data, but the platform supports any team sport."

---

## Demo Script (10–12 minutes)

### 1. Start with the problem (90 seconds)

Do not start with the product. Start with their world.

> "Before I show you the product, can I ask — how do you currently review film? What does that process look like for you?"

Let them answer. Then:

> "What we kept hearing from coaches was: 'I record everything, but I don't have time to turn it into something useful for my players.' That's the problem GameIQ is trying to solve."

---

### 2. Show the team workspace (1 minute)

Navigate to: `/teams/[teamId]`

Point out:
- Team name, sport, level
- Roster count
- Recent reports panel
- Setup checklist

> "Every team gets a workspace. You add your roster once, then track games over time. The report history stays with the team."

---

### 3. Show the roster (30 seconds)

Navigate to: `/teams/[teamId]/players`

Point out:
- Player names, positions, jersey numbers
- Role indicator (staff vs player)

> "You add your players once. When the AI generates a report, it knows who's on the field and references them by name."

---

### 4. Show the game setup (1 minute)

Navigate to: `/teams/[teamId]/games/[gameId]`

Point out:
- Game metadata: opponent, date, home/away, result, score
- Coach notes section
- Opponent notes section
- Setup checklist: video uploaded ✅, key moments tagged ✅

> "Before generating a report, you upload your film and add context. The notes you write here become inputs to the AI. The more specific the notes, the better the report."

---

### 5. Show the key moments page (2 minutes)

Navigate to: `/teams/[teamId]/games/[gameId]/timestamps`

Point out:
- List of 12 tagged events
- Event type, timestamp, importance level, players involved, description
- The AI readiness badge (green = ready to generate)

> "This is the key step. Instead of watching 90 minutes of film yourself, you or your analyst tags the moments that matter — a dangerous attack, a defensive error, a key substitution. That becomes the evidence layer for the AI report."

**Pause here.** Ask:

> "Does this kind of tagging feel realistic for your team? Or would it need to fit into your existing workflow differently?"

---

### 6. Show the AI report dashboard (2 minutes)

Navigate to: `/teams/[teamId]/games/[gameId]/report`

Point out:
- Executive summary
- Top 5 coaching insights
- Confidence badges (High / Medium / Low)
- Evidence section on each insight (links back to specific tagged events)

> "The AI reads everything — your notes, the roster, the tagged moments — and generates this report. Every insight shows which tagged events support it. If the AI isn't confident, it says so. Nothing is invented."

**Click one insight** to open the detail page.

Point out:
- Insight title and description
- Confidence level and reasoning
- Evidence references (event label, timestamp, players involved)
- Video seek button (opens the timestamp in the video player)

> "Coaches can jump directly to the video moment that supports this insight. It's not just text — it's connected to the film."

---

### 7. Show the player report (1 minute)

Scroll to the Players section.

Point out:
- Player-by-player breakdown
- Strengths section
- Improvement areas section
- Key moments list

> "Every player gets their own section. Instead of telling your whole team the same thing, you now have individual feedback tied to what actually happened in the game."

**Ask:**

> "Would your players actually read something like this? Or is it too long / too technical?"

---

### 8. Show the practice recommendation (30 seconds)

Scroll to the Practice section.

> "The AI also suggests what to work on at the next practice — with drill names, coaching points, and which players to prioritize. It's not generic. It's based on what happened in this specific game."

---

### 9. Show verification/editing (1 minute)

Click any insight. Show the verification controls.

> "Coaches can mark each AI output as accurate, partially accurate, or inaccurate — or edit it entirely. If the AI gets something wrong, you correct it. Those corrections are saved. Over time, the system learns what you care about."

Edit one insight live (change a word). Show the "Edited" badge.

> "The original AI output is always preserved underneath. You're not overwriting — you're annotating."

---

### 10. Share and export (1 minute)

Navigate to the share modal.

Point out:
- 4 visibility modes: private link, staff only, player-specific, public summary
- Expiration date and revocation controls
- View count tracking

> "You can share a link with the whole team, or share a player-specific version that only shows that player's section. No login required for the recipient."

Click Export. Show the export-ready view.

> "Or export the whole report as a PDF for your player meeting."

---

## Questions to Ask During Demo

Ask these naturally — not all at once. Listen carefully. Their answers are research.

- "How do you currently review film? How long does it take?"
- "Which part of this would save you the most time?"
- "Would your players actually read this feedback?"
- "What would make this report trustworthy for you?"
- "Would you use manual tagging if it produced better reports?"
- "What is missing for your specific sport?"
- "What does your current film review workflow look like day-to-day?"
- "Do you have an analyst, or does the head coach handle film?"
- "What tools are you using now? What do you like/dislike about them?"
- "If this produced a useful report in 10 minutes, would that change how often you review film?"

---

## Close

Do not push for a commitment. Push for a next step.

> "We're doing early coach pilots right now — working directly with a small number of teams to get feedback before we build more. Would you be open to uploading one real game and telling us what the report gets right and wrong?"

If they say yes → get their email, sport, and team level.

If they say not yet → ask: "What would need to be true before you'd try it?"

---

## Notes for the Founder

**Watch where they get excited:** If they lean in during the evidence section, double down on that. If they light up at player reports, that's your hook.

**Watch where they get confused:** Confusion is a design problem. Note it. Don't explain it away — fix it later.

**Do not oversell the AI.** If they ask "does it watch the video?" — say: "Not yet. Right now it reasons over what you tag. Automated video analysis is on the roadmap, but v1 intentionally starts with human-tagged moments because they're more reliable and useful immediately."

**Sport translation:** The demo uses cricket. If they coach a different sport, say: "The event types and terminology are customizable per sport. This is the cricket version — a soccer version would show different event categories."

**Time:** Aim for 10–12 minutes of demo, 10–15 minutes of conversation. The conversation is more valuable than the demo.

---

*See also: [`FOUNDER_DEMO_SCRIPT.md`](FOUNDER_DEMO_SCRIPT.md) for the full founder demo flow including investor context.*
