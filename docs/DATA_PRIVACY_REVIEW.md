# GameIQ — Data and Privacy Review

> An internal product-level review of what data GameIQ collects, how it is protected, and what the pilot team needs to communicate to coaches before they upload real data.

**This is not legal advice.** This document is an internal product review to identify privacy risks and establish responsible handling practices for the MVP pilot. Consult a legal professional before launching a paid product or handling data from minors.

---

## What Data GameIQ Collects

### User Account Data
| Data | Storage | Purpose |
|------|---------|---------|
| Email address | Supabase Auth | Login identifier |
| Display name | `profiles` table | UI display |
| User ID (UUID) | All tables | Row ownership |
| Password (hashed) | Supabase Auth | Authentication — never plaintext, handled by Supabase |

### Team Data
| Data | Storage | Purpose |
|------|---------|---------|
| Team name, sport, level, org, location | `teams` table | Team workspace |
| Team description | `teams` table | Context for coaches |
| Team member roles | `team_members` table | Access control |

### Roster / Player Data
| Data | Storage | Purpose |
|------|---------|---------|
| Player name | `players` table | Report personalization |
| Jersey number | `players` table | Identification |
| Position, role, dominant side | `players` table | Tactical context for AI |
| Class year | `players` table | Optional context |
| Height, weight | `players` table | Optional context |
| Player notes | `players` table | AI input |

### Game and Analysis Data
| Data | Storage | Purpose |
|------|---------|---------|
| Game metadata (date, opponent, result, score, venue) | `games` table | Report context |
| Coach notes (free text) | `games` table | AI input |
| Opponent notes (free text) | `games` table | AI input |
| Video file | Supabase Storage (private bucket) | Film review |
| Event timestamps (label, time, description, players) | `event_timestamps` table | AI evidence layer |
| AI report (JSON) | `game_reports` table | Product output |
| Coaching insights text | `coaching_insights` table | Report section |
| Player report text | `player_reports` table | Player feedback |
| Practice recommendations | `practice_recommendations` table | Coaching output |
| Opponent tendencies | `opponent_tendencies` table | Scouting output |
| Verification feedback (coach corrections) | `verification_feedback` table | Trust layer |

### Sharing and Export
| Data | Storage | Purpose |
|------|---------|---------|
| Share link tokens | `share_links` table | Access control |
| Share link visibility mode | `share_links` table | What the recipient can see |
| View count | `share_links` table | Analytics |
| Export history | `exports` table | Usage tracking |

### Analytics and Feedback
| Data | Storage | Purpose |
|------|---------|---------|
| Product events (event name, category, user/team/game ID) | `product_events` table | Founder analytics |
| Access request (name, email, role, sport, pain point, tools) | `access_requests` table | Early interest capture |
| Product feedback (rating, features, WTP) | `product_feedback` table | User research |

---

## Sensitive Data Areas

### Player Performance Feedback
**Risk level:** Medium  
**Description:** Player reports contain specific performance feedback ("Player X needs to improve defensive positioning"). If shared incorrectly or without player consent, this could be embarrassing or damaging.  
**Current protection:** Coach controls who sees player reports via share link visibility mode (`player_specific` shows only one player's content).  
**Gap:** No explicit consent workflow for players before their report is shared.

### Youth Athlete Data
**Risk level:** High (if applicable)  
**Description:** If any pilot team has players under 13 (US) or under 16 (EU GDPR), additional legal requirements may apply (COPPA in the US, GDPR special categories in the EU).  
**Current protection:** None — the platform does not ask for player ages.  
**Gap:** For MVP pilots, target teams with adult athletes only. If a team with minors requests access, defer and consult a legal professional first.  
**Action:** Add to pilot coach onboarding: "Please only use GameIQ with adult athletes (18+) during this early pilot phase."

### Private Team Strategy
**Risk level:** Medium  
**Description:** Coach notes, opponent notes, and tactical analysis are proprietary to the team. If share links are created incorrectly, this content could reach competitors.  
**Current protection:** Share links require explicit creation (not auto-shared). `public_summary` mode excludes tactical details. All links are controlled by the coach.  
**Gap:** Coach education — coaches must understand the difference between `staff_only` and `public_summary` modes.

### Game Video Files
**Risk level:** Medium  
**Description:** Full-length game video files are stored in a private Supabase Storage bucket. These files are not shared via share links (video is excluded from all share modes).  
**Current protection:** Private bucket, server-generated signed URLs (1-hour TTL), no public access.  
**Gap:** Video files for pilot teams will persist until manually deleted. Document the deletion process.

### Coach Notes (Free Text)
**Risk level:** Low-Medium  
**Description:** Coach notes may contain sensitive observations about players, tactics, and team dynamics.  
**Current protection:** Stored in `games` table with RLS. Team-scoped access only. Not included in analytics events.  
**Gap:** Coach notes are included in the AI input snapshot, which is sent to OpenAI (if `AI_PROVIDER=openai`). Coaches should be aware of this.

---

## Current Data Protections

| Protection | Status |
|-----------|--------|
| Supabase Auth (password hashed, no plaintext) | ✅ Active |
| Row Level Security on all 17 tables | ✅ Active |
| Team-scoped access (all data requires team membership) | ✅ Active |
| Private video storage (no public bucket) | ✅ Active |
| Signed video URLs (1-hour TTL) | ✅ Active |
| Share tokens with revocation and expiry | ✅ Active |
| AI API keys server-only | ✅ Active |
| Analytics events exclude PII (no names, no notes in events) | ✅ Active |
| Video excluded from all share link modes | ✅ Active |

---

## What Coaches Must Know Before Using GameIQ

### Before uploading any data, tell pilots:

1. **This is an early MVP.** Data handling practices will evolve. We are operating under a minimal MVP privacy notice, not a full enterprise privacy policy.

2. **Your video is stored securely.** Videos are uploaded to private cloud storage. They are never shared automatically. You control who sees your reports.

3. **Coach notes go to OpenAI (if real AI is enabled).** If you are using the real AI mode, your coach notes, opponent notes, and tagged event descriptions are sent to OpenAI to generate the report. Do not include anything you would not want processed by a third party.

4. **We store your team and player data.** Player names, positions, and game data are stored in our database. We use this data only to generate your reports.

5. **You can delete your data.** Contact us and we will delete your team data from the database. (Current process: founder does this via Supabase dashboard. No self-serve deletion exists yet.)

6. **Do not upload data involving minors.** During this early pilot, please only use the platform for adult athletes.

7. **This product is in active development.** Features, data handling, and the platform itself may change significantly.

---

## OpenAI Data Handling

When `AI_PROVIDER=openai` is set:

- The input snapshot (team name, game metadata, roster, event descriptions, coach notes) is sent to OpenAI's API
- OpenAI's API usage policy governs how this data is processed
- As of 2024, OpenAI API data is not used to train OpenAI models by default (but verify current policy)
- The data is transmitted over HTTPS and not stored by OpenAI beyond the API call lifecycle (verify current policy)

**Action for pilot:** Add a disclosure to the report generation screen: "Generating this report sends your game notes and key moments to our AI provider (OpenAI) for processing. Do not include sensitive medical or personal information in coach notes."

---

## Pilot Data Handling Requirements

| Requirement | Status |
|-------------|--------|
| Inform coaches before they upload data | ⚠️ Add to pilot onboarding email |
| Get explicit acknowledgment from pilot coaches | ⚠️ Add checkbox to pilot sign-up |
| Avoid youth athlete data | ⚠️ Add to pilot coach criteria |
| Document data deletion process | ⚠️ Document in pilot guide |
| Notify coaches if a security issue affects their data | ❌ No incident response process exists |
| Confirm OpenAI data handling with pilots | ⚠️ Add disclosure to UI |

---

## Future Privacy Requirements

These are not urgent for the MVP pilot but must be addressed before a public product launch:

| Requirement | Priority |
|-------------|---------|
| Full privacy policy (legally reviewed) | P1 before public launch |
| Self-serve data deletion | P1 before public launch |
| Consent workflow for player data sharing | P1 before public launch |
| Organization admin controls | P2 |
| GDPR-compliant data processing agreement | P1 for EU users |
| COPPA assessment for any youth team features | P0 if youth teams are targeted |
| Audit log for data access | P2 |
| Data retention limits (auto-delete inactive accounts) | P2 |
| Cookie consent / tracking disclosure | P1 before public launch |

---

## Minimal MVP Privacy Notice (Current)

The current `/privacy` page is an honest placeholder that explains:
- What data is collected (basic list)
- That the product is an MVP and practices may change
- How to contact the founder to request deletion
- That video is stored privately

This is sufficient for a closed pilot with 3–5 consenting coaches. It is not sufficient for a public product.

---

*Last updated: June 2026*  
*This document is for internal product review purposes only. Not legal advice.*
