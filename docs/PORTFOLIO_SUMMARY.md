# GameIQ — Portfolio & Resume Summary

> Use this document to describe GameIQ professionally in resumes, LinkedIn, portfolios, job interviews, and academic submissions.

---

## Resume Bullet Options

Pick 3–5 depending on role and space. Tailor to the job description.

**Full-Stack Engineering:**
- Built a production-grade AI sports intelligence platform (GameIQ) using Next.js App Router, TypeScript, React 19, Tailwind CSS 4, and Supabase (Auth, Postgres, Storage)
- Designed and implemented 17-table Postgres schema with Row Level Security, team-scoped access control, and 10 versioned migrations
- Built a provider-agnostic LLM integration layer supporting mock, OpenAI, Anthropic, and Gemini providers with zero call-site changes between providers
- Implemented strict Zod validation on all AI outputs and a 14-rule system prompt to prevent hallucination, evidence fabrication, and unclaimed video frame analysis

**AI/ML Engineering:**
- Engineered an end-to-end AI report pipeline: input snapshot → readiness evaluation → provider dispatch → strict JSON generation → Zod schema validation → ID normalization → report persistence → dashboard rendering
- Designed human-in-the-loop coach verification workflows that preserve original AI outputs while logging corrections — producing structured training signal for future model improvement
- Built confidence-scored, evidence-linked AI coaching reports that reference specific manually tagged game events, preventing AI from fabricating support for its claims

**Product & Security:**
- Designed a 4-mode shareable report system with 144-bit entropy tokens, expiration, revocation, server-side visibility-mode sanitization, and view count tracking
- Implemented append-only audit trail for coach corrections — original AI output preserved alongside edited text in every verification record
- Instrumented 13 product events across the full user funnel with a fire-and-forget analytics layer and founder-facing admin dashboard

**Startup/Founding:**
- Sole founder and engineer on GameIQ — a full-stack AI sports intelligence startup MVP, designed and built from zero to production deployment in 10 development phases
- Built end-to-end pitch/demo infrastructure: polished landing page, demo workspace with real data, request-access and feedback forms, coach discovery framework, investor brief, and product analytics

---

## Longer Project Description

**GameIQ** is a coach-first AI sports intelligence platform that turns game film, structured roster data, and manually tagged key moments into evidence-linked coaching reports.

The platform covers the full analysis workflow: team workspace creation, roster management, video upload to private cloud storage, manual event timestamp tagging, AI report generation with a provider-agnostic LLM layer, structured JSON report validation, a multi-section report dashboard, coach verification and inline editing, four-mode shareable reports with secure tokens, and export-ready print/PDF views.

The AI pipeline is built for trust: every coaching insight shows its supporting evidence (which tagged events justify the claim), a confidence level (high/medium/low with reasoning), and coach-editable fields. AI outputs are validated against a strict Zod schema before storage — no hallucinated player IDs, no fabricated event references, no claims about video content the system has not analyzed. Coach corrections are stored in an append-only audit trail that preserves the original AI output alongside human edits.

The technical stack is Next.js 16 (App Router), TypeScript 5 strict mode, React 19, Tailwind CSS 4, Supabase Auth/Postgres/Storage, Zod, and a provider-agnostic AI layer with OpenAI GPT-4o-mini in production. The data model includes 17 tables with Row Level Security, 12 PostgreSQL enums, 10 versioned migrations, and team-scoped access policies across all entities.

---

## Technical Skills Demonstrated

**Languages and frameworks:**
- TypeScript (strict mode, no `any`)
- React 19 (Server Components, Client Components, Server Actions)
- Next.js App Router (dynamic routing, middleware, layouts, loading states)
- SQL (Postgres, RLS policies, SECURITY DEFINER functions, migrations)
- Tailwind CSS 4 (CSS-first config, design system primitives)

**Backend and infrastructure:**
- Supabase (Auth, Postgres, Storage, RLS)
- Next.js Server Actions and Route Handlers
- Supabase SECURITY DEFINER RPC (atomic multi-table operations)
- Private file storage with signed URL access control
- Session middleware with protected route enforcement

**AI engineering:**
- Provider-agnostic LLM integration architecture
- Structured JSON output with Zod schema validation
- Prompt engineering for hallucination prevention
- Human-in-the-loop verification and correction workflows
- Evidence grounding and confidence scoring

**Product engineering:**
- Full authentication flow (signup, login, callback, logout, session)
- Multi-role access control (owner, coach, analyst, player)
- Real-time-style status tracking (analysis job lifecycle)
- Product analytics instrumentation (fire-and-forget, non-blocking)
- Share link architecture (tokens, visibility modes, sanitization, expiration)
- Export-ready print-to-PDF views

**Startup and product:**
- Full-stack product design (UX, information architecture, component system)
- Founder demo infrastructure (demo data, landing page, pitch assets)
- User research frameworks (coach discovery, feedback forms, admin review)
- Honest MVP positioning (known limitations, roadmap, trust architecture)

---

## Interview Explanations

### "What problem did you solve?"

Coaches collect enormous amounts of game footage but lack the time and staff to turn it into specific, evidence-backed player feedback and tactical decisions. GameIQ automates the report-writing step — coaches tag key moments, and the AI generates a structured report with coaching insights, player feedback, opponent analysis, and practice recommendations.

### "What was technically hard?"

Several things. The hardest was designing the trust architecture for AI outputs. The system needs to be useful enough that coaches act on it, but transparent enough that they trust it. That means every insight needs evidence references (which specific events justify this claim), a confidence level (with reasoning), and easy correction controls. I also had to prevent the AI from fabricating event IDs or claiming to analyze video it never saw — that required a strict system prompt with 14 explicit guardrails plus Zod schema validation that rejects invalid output at generation time.

The ID normalization step was also non-trivial: the AI receives real event IDs in the prompt but might reference them inconsistently. A post-generation normalization pass validates every `evidence_id` against real database rows before storage.

### "Why not start with computer vision?"

Computer vision at the quality level useful for coaching — identifying specific players, tracking ball possession, detecting tactical patterns from video frames — requires significant infrastructure investment and specialized models that are not yet affordable for early-stage products without external funding. Starting with manually tagged key moments gets 80–90% of the analytical value immediately, creates a data collection mechanism for future CV training data, and produces a working, trustworthy product coaches can use today. CV is on the roadmap once the core workflow is validated.

### "How did you prevent hallucinations?"

Three layers: (1) the system prompt has 14 explicit rules — do not invent player names, do not fabricate event timestamps, do not reference evidence not in the input, do not claim to have analyzed video frames, output JSON only; (2) Zod schema validation rejects any output that does not match the expected structure — it throws rather than silently accepting bad data; (3) an ID normalization pass validates all `evidence_ids` against real database rows, rejecting references to events that do not exist.

### "How did you design trust into the product?"

Three product mechanisms: (1) every AI claim shows its supporting evidence (which tagged events) and confidence level — coaches can see exactly why the AI said what it said; (2) coaches can mark any output as accurate, partially accurate, inaccurate, or edited — this is not optional, it is built into the primary reading flow; (3) the original AI output is always preserved alongside any edits — coaches know what the AI actually said, not just what was changed.

### "What would you build next?"

Team member invitation workflow (coaches can invite players and staff directly), server-side PDF generation so exports can be stored and emailed, season-level analytics aggregating insights across multiple games, and real-time AI job status via Supabase Realtime. After that — automated event detection from video frames to reduce manual tagging friction, which is the main UX complaint I expect from early coach interviews.

---

*See also: [`PITCH_LINES.md`](PITCH_LINES.md), [`INVESTOR_ADVISOR_BRIEF.md`](INVESTOR_ADVISOR_BRIEF.md), [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md)*
