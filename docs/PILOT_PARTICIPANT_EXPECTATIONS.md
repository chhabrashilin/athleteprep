# GameIQ — Pilot Participant Expectations

> This document is written in plain language for coaches and staff who are participating in the GameIQ early pilot. Share this with pilot coaches during onboarding.

---

## What GameIQ Is

GameIQ is an early-stage AI tool that helps coaches turn game notes and tagged key moments into structured coaching reports. You tag what happened during the game, and GameIQ generates a report with insights, player feedback, practice recommendations, and opponent tendencies — all grounded in the data you provided.

This is an **early MVP**. It is functional and useful, but it is not a finished product. Features are missing, some edges are rough, and things will change based on what coaches tell us.

---

## What This Pilot Is

You are one of the first coaches to use GameIQ with real game data.

Your goal as a pilot participant is to:
1. Use GameIQ with real game footage and notes from at least 1–2 games
2. Tag key moments as honestly as you would in a real post-game review
3. Generate an AI report and verify the outputs
4. Tell us what was useful, what was wrong, and what is missing

Your feedback directly shapes what we build next. We read every response.

---

## What GameIQ Does and Does Not Do

### Does
- Accepts game metadata, roster data, coach notes, and manually tagged key moments
- Generates a structured coaching report: insights, player feedback, practice recommendations, opponent tendencies
- Shows confidence scores and evidence references for every AI claim
- Lets coaches verify, correct, and edit any AI output
- Creates shareable reports with 4 visibility modes
- Exports reports to PDF via the browser print function

### Does Not
- **Analyze video frames automatically.** GameIQ v1 does not have computer vision. It generates reports from the structured data you enter — not from watching the video. This is intentional for v1.
- Track player positions, ball trajectories, or formations
- Detect events automatically during video playback
- Integrate with Hudl, Veo, or other video platforms
- Send emails or notifications
- Manage payments or subscriptions

---

## AI Limitations You Must Know

**AI outputs are not always right.** The system is designed to reduce hallucinations, but it is not perfect. Always review AI-generated reports before sharing them with players or staff.

Specifically:
- The AI cannot see the video — it reasons from the data you tagged
- Low-quality inputs (few timestamps, vague notes) produce generic reports
- The report is only as good as the data you put in
- Every AI claim shows a confidence score (High / Medium / Low) — treat Low confidence claims with appropriate skepticism
- Every AI claim shows which events it is based on — verify those references

**The verification step is important.** After generating a report, mark each insight as Accurate, Partially Accurate, Inaccurate, or Edited. This builds trust in the tool and improves future quality.

---

## Data You Upload and What Happens to It

**What you upload:**
- Team name and basic info
- Player names, positions, jersey numbers
- Game metadata (opponent, date, score, venue)
- Coach notes and opponent notes (free text)
- Video file (stored in private cloud storage)
- Tagged key moments (timestamp, event type, description, players involved)

**What we do with it:**
- It is stored in a private, access-controlled database scoped to your team workspace
- Only members of your team workspace can access it
- If you are using the AI report generation feature with real AI enabled, your coach notes and game data are sent to our AI provider (OpenAI) to generate the report — over HTTPS, not for model training
- Video files are stored in a private cloud storage bucket and are **never shared publicly** — they are served only to your team members via time-limited links

**What we do not do:**
- We do not sell your data
- We do not share your team or player data with competitors or third parties
- We do not use your video for AI training

---

## Please Keep These Rules

**1. Adult athletes only.**  
During this pilot, please only use GameIQ with athletes who are 18 or older. We have not assessed compliance with youth athlete data protection laws. If your team includes players under 18, please do not upload their names or personal data during this pilot.

**2. Only upload content you have permission to use.**  
Only upload game video and data that you own or have explicit permission to use. GameIQ does not verify content rights.

**3. Do not upload sensitive medical or health data.**  
Player injury history, medical records, biometric health data, and similar sensitive information should not be entered into GameIQ. The platform is not certified for this type of data.

**4. Handle share links carefully.**  
Share links give other people access to your report. Know which visibility mode you are using:
- **Public summary** — executive summary and insight titles only, no player data, no login required
- **Staff only** — full report, requires login, team members only
- **Player-specific** — one player's report section, no login required
- **Private link** — full report, no login required

Only use "Private link" when you intentionally want to share the full report without requiring a login.

**5. Review AI outputs before sharing.**  
Do not share a report externally until you have reviewed it. The verification step is there for a reason.

---

## What to Do If Something Goes Wrong

**If you encounter a bug or issue:**  
Submit a support request at `/support`. Select the issue type, describe what happened, and include your team name. The founding team will respond within 1–2 business days.

**If you want your data deleted:**  
Submit a support request at `/support` and select "Data deletion request." We will delete all your team data, including uploaded video, within 24 hours of confirming your identity.

**If you share a link by mistake:**  
You can revoke any share link from the Share modal in the report view. If you need help revoking links, contact support.

---

## What We Expect From You

1. Use GameIQ with real game data for at least 1–2 games during the pilot
2. Complete the report generation and verification steps
3. Submit feedback through the feedback form or a direct conversation with the founder
4. Tell us honestly what is not working — honest negative feedback is more valuable than polite praise
5. Let us know if anything feels uncomfortable about the data handling

---

## What You Can Expect From Us

1. We will respond to support requests within 1–2 business days
2. We will delete your data promptly if you request it
3. We will not share your team data or video with anyone
4. We will be honest about what the product can and cannot do
5. We will ship improvements based on what pilot coaches tell us

---

## Contact

For issues, questions, or data requests: `/support`  
For product feedback: `/feedback`  
For privacy questions: `/privacy`

---

*This document is for GameIQ pilot participants. Last updated: June 2026.*
