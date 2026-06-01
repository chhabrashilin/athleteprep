# GameIQ — Project Constitution

> This document is the authoritative source of product truth. All future implementation prompts, design decisions, and architectural choices must align with this constitution. Update it intentionally, not casually.

---

## 1. Product Vision

GameIQ is an AI game-review platform for serious sports teams.

A coach, analyst, captain, or serious player should be able to:

1. Create a team workspace.
2. Upload a match or practice video.
3. Add game metadata.
4. Add roster/player information.
5. Add manual timestamps, key events, coach notes, and opponent notes.
6. Generate an AI-powered game report.
7. Review top coaching insights.
8. View player-by-player feedback.
9. Jump to evidence-linked video timestamps.
10. See confidence scores and assumptions for each AI claim.
11. Generate next-practice recommendations.
12. Verify, edit, save, share, and export the report.

The long-term vision is to become an **AI Sports Operating System** for teams, coaches, players, analysts, scouts, and eventually media and fans.

The first MVP focuses on the strongest wedge: **Video → Insight → Action**.

---

## 2. Founder Thesis

Most sports tools are fragmented. They may store video, record games, generate highlights, track players, produce dashboards, manage rosters, provide stats, support scouting, or help with wellness — but most fail to complete the full intelligence loop:

**capture → understand → diagnose → recommend → communicate → improve**

The startup opportunity is to build the shared intelligence layer for teams.

GameIQ answers the questions coaches actually need answered:

- What happened?
- Why did it matter?
- Who was involved?
- What evidence supports this?
- How confident is the AI?
- What should we do next?
- What should each player work on individually?

The long-term moat comes from:

1. Structured team data accumulated over time.
2. Coach verification feedback that improves outputs.
3. Historical game reports for trend detection.
4. Player development history.
5. Sport-specific intelligence modules.
6. Eventually, computer vision and automated event detection.
7. A clean, habitual workflow teams use every week.

---

## 3. Product Positioning

**Working name:** GameIQ

**Positioning statement:**
GameIQ turns game film into coach-ready insights, player feedback, evidence-linked clips, and next-practice plans.

**Short version:**
AI game review in 10 minutes.

**What GameIQ is:**
A coach-first AI sports intelligence platform.

**What GameIQ is not:**
- A generic analytics dashboard
- A video storage platform
- A chatbot
- A highlights tool
- A generic SaaS sports app

---

## 4. Target Users

### Primary: Head Coach

**Goals:** Quickly understand what mattered in a game. Identify top tactical issues. Prepare the next practice. Give players specific, evidence-backed feedback. Save hours of film review.

**Pain points:** Too much video, not enough time. Feedback is often vague. Manual tagging is slow. Existing tools are fragmented. Analytics dashboards are too complex.

**Success:** They upload a game and get a useful, trustworthy report quickly. They can edit or verify the AI output. They can share meaningful feedback with players.

### Secondary: Assistant Coach / Analyst

**Goals:** Organize clips, build reports, support the head coach, prepare scouting and practice material.

**Pain points:** Manual video tagging takes hours. Notes and clips are scattered. Reports take too long to prepare.

**Success:** They can produce a polished report faster than manual review using GameIQ.

### Secondary: Player

**Goals:** Understand personal strengths and weaknesses. See specific supporting clips. Receive actionable improvement areas. Track development over time.

**Pain points:** Feedback is vague. They don't know exactly what to fix. They rarely receive individualized breakdowns.

**Success:** They receive clear, clip-backed, player-specific feedback they can act on.

### Future: Scout / Recruiter

Search player profiles, review evidence-backed clips, compare players, evaluate performance trends. Architecture must not block this use case.

### Future: Media / Fan / Parent

Generate highlights, share clips, create recap content. Shareable reports and clips should leave room for this.

---

## 5. Ideal Customer Profile (MVP)

Best first users:
- College teams
- Academy teams
- Semi-pro teams
- Serious high school varsity teams
- Club teams
- Competitive amateur teams

Required characteristics:
- Already record games or practices
- Care about performance improvement
- Do not have a large full-time analyst staff
- Have recurring games and practices
- Want better player feedback
- Are open to AI-assisted workflows
- Value speed and clarity over complexity

The MVP should feel powerful enough for serious teams but simple enough for under-resourced teams. Do not design v1 exclusively for elite professional teams.

---

## 6. Core MVP Workflow

The canonical user journey:

1. User signs up.
2. User creates or joins a team workspace.
3. User adds players to the roster.
4. User creates a new game or practice analysis.
5. User uploads video.
6. User enters metadata: sport, date, opponent, home/away/neutral, result/score, venue, competition type, coach notes.
7. User selects players involved.
8. User adds manual timestamps/events: time in video, event type, players involved, team or opponent, description, importance, tags.
9. User starts AI analysis.
10. System creates an analysis job.
11. System generates a structured report.
12. User reviews the report dashboard.
13. User opens individual insights.
14. User jumps to video evidence.
15. User reviews player reports.
16. User reviews next-practice recommendations.
17. User verifies or edits AI outputs.
18. User shares or exports the report.
19. System stores report and verification feedback for team history.

---

## 7. V1 Intelligence Strategy

V1 does not claim fully automated sports video understanding. The first version is honest, useful, and evidence-based.

**V1 AI inputs:**
- Game metadata
- Roster and player data
- Manual event timestamps
- Coach notes
- Opponent notes
- Optional score and stat data
- Prior reports (when available)

**V1 AI outputs:**
- Executive summary
- Top 5 coaching insights
- Player-by-player reports
- Key moments
- Opponent tendencies
- Next-practice recommendations
- Confidence levels
- Assumptions
- Evidence references

Every major claim must be traceable to available input. If the AI makes an inference, it must be labeled as an inference.

---

## 8. Trust Principles

Trust is a core product feature, not an afterthought.

Every report shows:
1. Evidence — what data supports this claim
2. Confidence — how certain the AI is
3. Assumptions — what the AI assumed if data was incomplete
4. Verification controls — the coach can mark each insight as accurate, partially accurate, inaccurate, or edited
5. Clear distinction between observed fact and AI inference

**Confidence levels:**

| Level | When to use |
|-------|-------------|
| High | Claim directly supported by multiple timestamps, notes, or structured inputs |
| Medium | Claim supported but requires interpretation or limited evidence |
| Low | Claim is plausible but based on limited data, incomplete notes, or weak evidence |

**Verification states:**
- Unreviewed
- Accurate
- Partially Accurate
- Inaccurate
- Edited

The app must never hide uncertainty. Visible uncertainty makes the product more trustworthy, not less.

---

## 9. Design Principles

The app must feel: premium, calm, modern, serious, fast, coach-friendly, evidence-driven, uncluttered.

The app must not feel: like a generic admin dashboard, like a school project, like a crypto dashboard, like a cluttered BI tool, like a toy chatbot, like a fake AI demo.

See `/docs/DESIGN_PRINCIPLES.md` for complete design rules.

---

## 10. Technical Direction

Preferred stack:

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Auth:** Supabase Auth
- **Database:** Supabase Postgres with Row Level Security
- **Storage:** Supabase Storage
- **Backend logic:** Next.js API routes or server actions
- **AI:** Provider-agnostic service layer (OpenAI / Anthropic / Gemini compatible)
- **Video:** FFmpeg-compatible architecture for future clipping
- **Dev mode:** Optional mock AI mode

The architecture must support future addition of: automated event detection, player/ball tracking, pose estimation, team trends, scouting profiles, injury/load insights, wearable integrations, highlight generation, multi-sport modules.

Do not over-engineer v1. Prioritize working product flow, clean schema, type safety, reliable AI report generation, coach verification, and maintainable architecture.

---

## 11. Core Data Entities

| Entity | Description |
|--------|-------------|
| User | Authenticated system user |
| Team | Team workspace |
| TeamMember | User membership within a team |
| Player | Athlete on a team roster |
| Game | Game or practice session record |
| VideoAsset | Uploaded video file metadata |
| EventTimestamp | Manual event/timestamp entry |
| Clip | Time-bounded video segment |
| AnalysisJob | AI analysis request and status |
| GameReport | Completed structured analysis report |
| CoachingInsight | Individual insight within a report |
| PlayerReport | Player-specific section of a report |
| PracticeRecommendation | AI-generated practice suggestion |
| OpponentTendency | Identified opponent pattern |
| VerificationFeedback | Coach review of an AI output |
| ShareLink | Shareable report access token |
| Export | Generated export artifact |

Use these names consistently. Avoid vague generic names (`data`, `item`, `record1`, `misc`, `output`).

---

## 12. Non-Negotiable MVP Requirements

The MVP must eventually include all of the following:

1. Authentication
2. Team workspace
3. Roster management
4. Game/practice creation
5. Video upload
6. Game metadata input
7. Manual event/timestamp input
8. Analysis job creation
9. AI report generation
10. Game report dashboard
11. Top 5 coaching insights with confidence and evidence
12. Player reports
13. Opponent tendencies
14. Practice recommendations
15. Confidence scores on all major AI claims
16. Evidence references
17. Coach verification workflow
18. Report editing
19. Shareable reports
20. Export-ready presentation view

Architecture must not block any of the above, even in early phases.

---

## 13. Explicitly Out of Scope for V1

Do not build these unless future prompts explicitly request them:

- Fully automated player tracking
- Fully automated ball tracking
- Live streaming or real-time in-game coaching
- Betting or gambling features
- Fantasy sports features
- Advanced injury diagnosis or medical recommendations
- Wearable device integrations
- Payments or subscriptions
- Marketplace
- Native mobile app
- Social network feed
- Public recruiting marketplace
- Complex role hierarchy beyond basic team permissions
- Multi-tenant enterprise admin panel

---

## 14. AI Safety Rules

See `/docs/AI_OUTPUT_PRINCIPLES.md` for the complete ruleset.

Summary:
- All claims must be grounded in provided inputs.
- Confidence levels must be shown.
- Evidence must be referenced.
- The AI must not claim to have watched video unless computer vision is implemented.
- Outputs must be editable by coaches.
- Outputs must be stored as structured JSON.
- The AI must never fabricate players, timestamps, scores, or events.
