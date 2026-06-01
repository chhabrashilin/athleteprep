# GameIQ — First-User Feedback Guide

**Purpose:** Collect structured, actionable signals from early users who try the GameIQ demo or request early access.

---

## 1. Feedback Goals

### Primary goals
- Validate whether the core workflow (upload → tag → report) maps to how coaches actually think
- Identify the single feature that would move the product from "interesting" to "worth using weekly"
- Surface willingness to pay before building billing
- Find language that resonates — what do coaches call things we call "insights" or "timestamps"?

### Secondary goals
- Understand the competitive landscape from the user's point of view (Hudl, Veo, Pixellot, nothing)
- Identify which sports and levels have the most urgent need
- Get real names and emails for follow-up conversations

---

## 2. Access Request Form Fields

**Required:**
- `name` — full name
- `email` — contact email
- `role` — Head Coach, Assistant Coach, Analyst, Player, Team Captain, Program Director, Scout, Investor/Advisor, Other

**Optional:**
- `team_or_org` — team or organization name
- `sport` — Cricket, Soccer, Basketball, American Football, Hockey, Volleyball, Other
- `level` — Youth, High School, College, Club, Academy, Semi-Pro, Professional, Other
- `pain_point` — biggest film review pain point in their own words
- `film_review_frequency` — how often they review game film
- `current_tools` — Hudl, Veo, Pixellot, spreadsheets, nothing, etc.
- `message` — open field

**Stored in:** `access_requests` table.

---

## 3. Product Feedback Form Fields

**Required:**
- `usefulness_rating` — 1–5 scale (Not useful → Extremely useful)
- `most_valuable` — what felt most valuable in their own words
- `must_have_feature` — what feature would make this worth paying for

**Optional:**
- `name` / anonymous toggle
- `email`
- `role`
- `team_or_org`
- `sport`
- `most_confusing` — what felt confusing or unnecessary
- `would_use_after_games` — yes/no/maybe, with nuance
- `current_tools` — tools they use today
- `willingness_to_pay` — range from $10–$25 to $200+/month or enterprise
- `additional_notes` — open field

**Stored in:** `product_feedback` table.

---

## 4. How to Interpret Responses

### Rating interpretation

| Rating | Interpretation |
|--------|---------------|
| 5 | Strong signal — explore immediately. Schedule a follow-up call. |
| 4 | Good signal — what would make it a 5? |
| 3 | Neutral — usually means something was confusing or the wrong use case |
| 2 | Negative — read `most_confusing` carefully; often reveals a positioning problem |
| 1 | Strong negative — understand why before discarding |

### What qualifies as strong signal

- Multiple users with similar roles describe the same pain point unprompted
- A feature named in `must_have_feature` appears in 3+ responses
- Rating of 4–5 from a Head Coach who currently uses a paid tool (Hudl, Veo)
- Explicit willingness to pay $75+/month per team
- A user who tries the demo and immediately asks "can I use this for my actual team?"

### What qualifies as weak signal

- High rating from a student with no active coaching role
- "This is cool" without specifics — not actionable
- Single outlier feature requests not corroborated elsewhere
- Investor/Advisor role asking for enterprise roadmap features
- Complaints about UI polish on an MVP explicitly framed as early access

---

## 5. Follow-Up Questions After Reading Responses

When you see a strong response, schedule a 20-minute call. Use these questions:

### Discovery
- "What part of the demo felt most like your actual workflow?"
- "What did you immediately think was missing?"
- "What would you call these things you tag? Do you call them timestamps? Events? Key moments?"

### Workflow
- "Walk me through your current post-game process. Who does it? How long?"
- "Who sees the final feedback — just players, or parents, or management?"
- "Do you ever share notes with another coach? How?"

### Value
- "If GameIQ saved you 90 minutes per game — what would you do with that time?"
- "What would you need to see to believe this is worth $50/month?"

---

## 6. Admin Review

Access the analytics admin page at `/admin/analytics` — shows funnel, summary stats, and recent events.

Access the feedback admin page at `/admin/feedback`.

Requires:
- Authenticated account
- Email in the `ADMIN_EMAILS` environment variable (comma-separated)

If Supabase is configured, you can also inspect directly:

```sql
select * from access_requests order by created_at desc;
select * from product_feedback order by created_at desc;
select role, count(*) from access_requests group by role order by count desc;
select avg(usefulness_rating)::numeric(3,1) from product_feedback where usefulness_rating is not null;
```

---

## 7. Privacy and Data Handling

- Feedback is stored in Supabase with RLS (insert-only for public)
- No public SELECT policy — only service-role reads (admin page)
- Do not export feedback to third-party CRMs without user consent
- Do not publish quotes without permission

---

---

## 8. Product Events Integration

As of Prompt 18, the app tracks structured product events alongside feedback:

- `request_access_submitted` — fires when access request form is submitted
- `feedback_submitted` — fires when product feedback form is submitted (includes rating, role, sport, WTP flag)

These events appear in `/admin/analytics` → Recent Events and contribute to the funnel.

See [`/docs/PRODUCT_ANALYTICS.md`](PRODUCT_ANALYTICS.md) for the full event taxonomy and privacy rules.

*Last updated: 2026-06-01 — Prompt 18*
