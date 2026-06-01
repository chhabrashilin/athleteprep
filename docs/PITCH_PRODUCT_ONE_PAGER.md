# GameIQ — Product One-Pager

---

## Product Name

**GameIQ**

---

## One-Liner

"GameIQ turns game film and tagged key moments into coach-ready insights, player feedback, and next-practice plans."

---

## The Problem

Coaches record more game footage than they can meaningfully analyze.

- A typical game produces 60–90 minutes of film.
- Post-game review can take 2–4 hours of unstructured note-taking.
- Player feedback is often vague: "play harder," "be more aggressive," "watch your positioning."
- Existing tools store and organize video — but do not turn it into decisions.
- Smaller college clubs, academy teams, and serious amateur programs cannot afford a full-time analyst.

The result: coaches guess. Players practice the wrong things. The film sits unwatched.

---

## The Solution

GameIQ combines what coaches already have — video, a roster, and game observations — with a structured AI report pipeline.

**Inputs:**
- Game and practice video
- Roster and player data
- Coach notes and opponent notes
- Manually tagged key moments with timestamps, event type, players involved, importance, and description

**Outputs:**
- Executive summary
- Top 5 coaching insights (with confidence scores and evidence references)
- Player-by-player reports (strengths, improvement areas, key moments)
- Opponent tendency analysis with recommended responses
- Next-practice drill recommendations
- Full coach verification and editing workflow
- Shareable reports with 4 visibility modes (staff, player-specific, public summary, private link)
- Export-ready print/PDF view

Every AI claim is grounded in provided inputs. Nothing is invented. Coaches can verify, correct, or edit any AI output — and those corrections are stored for future improvement.

---

## Target Customer

**Primary:**
- College club teams
- Academy teams (soccer, basketball, cricket, volleyball, etc.)
- Competitive high school varsity programs
- Semi-professional teams

**Secondary:**
- Assistant coaches and team analysts
- Independent coaches who work with multiple teams

**Requirement:** Team already records game or practice video. Cares about performance improvement. Does not have a dedicated analyst.

---

## MVP Workflow

1. Coach creates a team workspace and adds the roster.
2. Coach creates a game record with opponent, result, score, and notes.
3. Coach uploads the game video to Supabase-backed private storage.
4. Coach tags key moments: timestamp, event type, players involved, importance, description.
5. Coach triggers AI report generation.
6. AI generates a structured JSON report: insights, player reports, opponent tendencies, practice recommendations.
7. Coach reviews the report dashboard — opens insights, reads evidence, jumps to video timestamps.
8. Coach verifies or edits AI output (accurate / partially accurate / inaccurate / edited).
9. Coach shares report with team or exports to PDF.

---

## Why Now

- Coaches already capture video. The capture problem is solved.
- LLMs can reason over structured sports context and produce useful, sport-literate outputs.
- Human-in-the-loop AI workflows make the output trustworthy — coaches can correct the AI and the corrections persist.
- Teams without dedicated analysts can now produce analyst-quality reports.
- The timing is right to establish the data moat before larger competitors enter the space.

---

## Differentiation

| Feature | GameIQ | Generic Video Tools |
|---------|--------|--------------------|
| Evidence-linked insights | ✅ | ❌ |
| Confidence scores | ✅ | ❌ |
| Coach verification/editing | ✅ | ❌ |
| Structured JSON reports | ✅ | ❌ |
| Player-specific reports | ✅ | Rarely |
| Practice recommendations | ✅ | ❌ |
| Opponent tendency analysis | ✅ | ❌ |
| Honest AI (no frame claims) | ✅ | N/A |

GameIQ does not compete with video storage platforms. It competes with the manual process coaches use today — hours of unstructured film review.

---

## Long-Term Vision

**AI Sports Operating System.**

Phase 1: Video + notes → structured AI reports.
Phase 2: Computer vision + automated event detection.
Phase 3: Season-level trend analysis and player development profiles.
Phase 4: Scouting, recruiting, opponent intelligence.
Phase 5: Multi-sport, wearable integrations, media/highlight generation.

The data moat compounds over time: structured team data, coach corrections, historical reports, and sport-specific intelligence.

---

## Current MVP Status (Honest)

**Built and functional:**
- Supabase Auth (email/password)
- Team workspaces with role-based access (owner, coach, analyst, player)
- Roster management (full CRUD, archive, search, filter)
- Game/practice creation with full metadata form
- Video upload to private Supabase Storage with signed URL playback
- Manual timestamp tagging workspace (12+ event fields)
- AI readiness badge
- AI report generation (mock provider + OpenAI production-ready)
- Strict Zod validation on all AI outputs
- 14 AI guardrail rules (no invented IDs, no frame claims, JSON-only output)
- Full report dashboard (insights, players, opponent, practice, evidence)
- Coach verification and inline editing
- 4-mode shareable reports with entropy-based secure tokens
- Export-ready print/PDF view with section selector
- Founder analytics (13 instrumented events, admin dashboard)
- Landing page, demo experience, request-access form, feedback form
- Demo workspace (cricket team, full game, 12 timestamps, AI report)

**Not yet built (honest):**
- Automated video frame analysis / computer vision
- Team member invitations
- Password reset flow
- Server-side PDF generation
- Season analytics / cross-game trend detection
- OAuth providers (Google, GitHub)
- Subscription billing

---

## Team

Solo founder-built MVP. Full-stack engineering, product design, AI integration, database architecture, and startup positioning.

---

*Last updated: June 2026*
