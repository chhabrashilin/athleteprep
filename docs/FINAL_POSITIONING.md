# GameIQ — Final Startup Positioning

> How to talk about GameIQ to coaches, investors, advisors, and recruiters. Read this before any external conversation.

---

## One-Liner

**"GameIQ turns game film and tagged key moments into coach-ready insights, player feedback, and next-practice plans."**

Use this line in every context. It is specific, honest, and doesn't overclaim.

---

## Core Wedge

**AI game review in 10 minutes.**

Coaches spend 2–4 hours per game on film review. GameIQ collapses that to a 10-minute tagging session that produces a structured, shareable report. The wedge is time-to-insight, not computer vision.

---

## Founder Thesis

Sports teams collect more video than they can analyze. The capture problem is solved — every college club team, academy, and competitive program has a camera and a cloud storage plan. The gap is turning raw footage into structured decisions that coaches can act on and players can learn from.

LLMs can already reason over structured sports inputs — event logs, game metadata, roster data, coach notes — and produce sport-literate analysis. The quality of that output depends entirely on the quality of the inputs. GameIQ structures the inputs.

The long-term thesis: the first platform to capture structured coaching data at scale owns the intelligence layer for sports. Every verified insight, every coach correction, every player report is training signal. The data moat compounds over time.

---

## Why Manual Timestamps First

This is the question you will be asked. Have a confident answer.

**The honest answer:**

1. **Faster to build:** Automated sports video analysis at production quality requires specialized models, expensive infrastructure, and years of labeled training data. Manual tagging delivers 80–90% of the value at a fraction of the cost and timeline.

2. **More trustworthy:** Every AI claim is grounded in an event the coach explicitly tagged. Coaches trust evidence they can trace. Automated detection produces black-box outputs — coaches are skeptical of things they can't verify.

3. **Coach-controlled:** Manual tagging lets coaches decide what matters. The AI is opinionated, but only about the events the coach chose to log. Coaches retain editorial control.

4. **Creates labeled data:** Every tagged event is a structured observation about what happened and why it mattered. Over thousands of games, that data becomes the training set for automated detection — which is much harder to collect at scale.

5. **Avoids overclaiming:** We're honest about what the product does. Coaches respect that.

**The roadmap answer:**

Manual tagging is Phase 1. Computer vision is Phase 2+. See [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md).

---

## What Makes It Different

| Feature | GameIQ | Typical sports video platforms |
|---------|--------|-------------------------------|
| Evidence-linked AI insights | ✅ | ❌ |
| Confidence scores + assumptions | ✅ | ❌ |
| Coach verification + editing | ✅ | ❌ |
| Append-only correction audit trail | ✅ | ❌ |
| Player-specific shareable reports | ✅ | Rarely |
| Practice recommendations | ✅ | ❌ |
| Opponent tendency analysis | ✅ | ❌ |
| Print-ready export with evidence | ✅ | ❌ |
| Honest AI (no frame claims) | ✅ | N/A |

GameIQ does not compete with Hudl, Vimeo, or Dropbox. It competes with the coach's unstructured film-review process — the 2–4 hours they spend every week trying to turn video into decisions.

---

## The Billion-Dollar Path

State this carefully and honestly. This is a thesis, not a promise.

**Phase 1 — AI-assisted game review (now)**
Coaches upload film, tag key moments, get structured AI reports. The product works today.

**Phase 2 — Weekly coaching workflow**
Reports improve as coaches use the product consistently. The platform becomes part of their weekly routine — the tool they open after every game. Monthly retention compounds.

**Phase 3 — Structured coaching data at scale**
Every correction, every verification, every player report is data. With enough teams across enough sports, the training signal becomes valuable — for fine-tuned models, sport-specific intelligence, and eventually, automated tagging.

**Phase 4 — Player development history**
Season-level trend analysis. How is each player improving? Which drills worked? What's the correlation between practice recommendations and game outcomes?

**Phase 5 — Scouting and recruiting**
Structured player data across teams. Transfer portal search. Recruiting intelligence.

**Phase 6 — Automated event detection**
Computer vision infrastructure. Automated tagging with coach correction. The structured data from Phase 1–3 becomes the training set.

**Phase 7 — Sports operating system**
Multi-sport. Wearable integrations. Subscription billing. API platform. Enterprise accounts.

This is a plausible path, not a guarantee. The validation needed to reach each phase is a coaching workflow that teams actually use, consistently, over a full season.

---

## Pitch Variants

### 5-second (hallway)

"GameIQ turns game film into AI coaching reports in 10 minutes."

### 15-second (introduction)

"We build AI sports analysis software for coaching teams. Coaches upload film, tag key moments, and get structured reports with insights, player feedback, and practice recommendations — all grounded in evidence, not guesses."

### 30-second (investor intro)

"Most sports teams record more footage than they can analyze. Post-game film review takes coaches 2–4 hours and still produces vague player feedback. GameIQ structures that process. Coaches tag key moments, and the platform generates evidence-linked AI reports with player feedback and practice plans — in about 10 minutes. The product works today. We're running early coach pilots. The long-term thesis is that the first platform to capture structured coaching data at scale owns the sports intelligence layer."

### For advisors / professors

"We built a full-stack AI sports analysis platform — Next.js with Supabase, a provider-agnostic AI layer with strict Zod validation, 14 AI guardrail rules, a 4-mode sharing system with entropy-based tokens and row-level security on every table. 167 automated tests. CI/CD. 60+ docs. The product is at release-candidate stage and ready for early pilot. I'm looking for feedback on the go-to-market thesis and whether the trust architecture is the right differentiator."

### For coaches

"I'm building a tool to help coaches turn film into useful player feedback, faster. Instead of 2–4 hours of unstructured notes, you tag the key moments — in about 10 minutes — and the AI produces a structured report your players can actually read. I'd love to show it to you and hear whether it solves a real problem."

See [`PITCH_LINES.md`](PITCH_LINES.md) for more variants.

---

## What to Never Say

- ❌ "The AI analyzes every frame" — it doesn't. Be honest.
- ❌ "Automatic player tracking" — not implemented.
- ❌ "Guaranteed to improve performance" — no product can guarantee this.
- ❌ "Replaces coaches" — it doesn't. It helps coaches do their job faster.
- ❌ "We have X users" — if you don't, don't say it.
- ❌ "We raised X" — if you haven't, don't say it.
- ❌ "It works for any sport perfectly out of the box" — quality varies by sport and input quality.

---

## Positioning for Specific Audiences

### Coaches

Lead with the problem (film review time), not the technology. Show the evidence-linked insight and the player report. Ask what they currently do. Listen before pitching.

### Investors / advisors

Lead with the thesis (structured coaching data at scale). Show the trust architecture — evidence links, confidence scores, coach corrections. Explain why manual tagging first is the right call. Show the CV roadmap.

### Technical reviewers

Lead with the architecture — Next.js App Router, provider-agnostic AI layer, Zod validation, RLS on every table, 14 guardrail rules, 167 tests, CI/CD. Explain the hallucination guard (ID normalization). Show the sharing sanitization model.

### Recruiters / portfolio reviewers

"Full-stack founder-built MVP. TypeScript 5, Next.js App Router, Supabase, OpenAI, Zod schema validation, 167 automated tests, CI/CD, 60+ docs, deployed to Vercel. Product design, engineering, AI integration, database architecture, security review, test strategy, and startup positioning — all by one person."

See [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md).

---

*Last updated: 2026-06-02 — Prompt 26: Final Project Handoff*
