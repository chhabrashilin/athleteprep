# GameIQ — Documentation Index

> Start here. This index organizes all GameIQ documentation by audience and purpose.

---

## Start Here

**Single-file project summary:** [`FINAL_PROJECT_HANDOFF.md`](FINAL_PROJECT_HANDOFF.md) — what is built, what to do next, top risks, 10 engineering tasks, 10 founder tasks.

## For Reviewers

If you want to understand the project quickly:

1. Read [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md) — what the product is and what is actually built
2. Read [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md) — the engineering depth
3. Run the demo setup (`NEXT_PUBLIC_ENABLE_MOCK_DATA=true` → `/demo/setup`)
4. Follow [`FOUNDER_DEMO_SCRIPT.md`](FOUNDER_DEMO_SCRIPT.md) — the 5–7 minute demo flow
5. Review [`MVP_READINESS_REPORT.md`](MVP_READINESS_REPORT.md) — honest feature status and go/no-go

---

## Product Strategy

| Document | Description |
|----------|-------------|
| [`PROJECT_CONSTITUTION.md`](PROJECT_CONSTITUTION.md) | Product vision, users, workflow, trust principles — the authoritative source of product truth |
| [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md) | Concise founder document: problem, solution, target customer, MVP status |
| [`INVESTOR_ADVISOR_BRIEF.md`](INVESTOR_ADVISOR_BRIEF.md) | Thesis, wedge, differentiation, risks, and next milestones for investors and advisors |
| [`LANDING_PAGE_STRATEGY.md`](LANDING_PAGE_STRATEGY.md) | Target audience, positioning, copy principles, CTA strategy |
| [`FOUNDER_DEMO_SCRIPT.md`](FOUNDER_DEMO_SCRIPT.md) | 5–7 minute demo script for coaches and investors |
| [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md) | Coach-facing demo guide with script, questions to ask, and founder notes |

---

## Product Features

| Document | Description |
|----------|-------------|
| [`TEAM_WORKSPACES.md`](TEAM_WORKSPACES.md) | Team workspace concept, creation flow, membership model |
| [`ROSTER_MANAGEMENT.md`](ROSTER_MANAGEMENT.md) | Player data model, permissions, archive vs. permanent delete |
| [`GAME_CREATION.md`](GAME_CREATION.md) | Game/practice data model, setup checklist, 4-section form |
| [`VIDEO_ASSETS.md`](VIDEO_ASSETS.md) | Video upload architecture, storage paths, signed URLs |
| [`TIMESTAMPS_AND_EVENTS.md`](TIMESTAMPS_AND_EVENTS.md) | Manual timestamp feature, event fields, AI readiness scoring |
| [`REPORT_DASHBOARD.md`](REPORT_DASHBOARD.md) | Report dashboard layout, insight detail, evidence linking |
| [`VERIFICATION_AND_EDITING.md`](VERIFICATION_AND_EDITING.md) | Coach verification workflow, report editing, audit trail |
| [`SHARING_AND_ACCESS.md`](SHARING_AND_ACCESS.md) | Share links, 4 visibility modes, token strategy, sanitization |
| [`EXPORTS_AND_PRINTING.md`](EXPORTS_AND_PRINTING.md) | Export-ready view, section selector, print-to-PDF strategy |

---

## AI and Trust

| Document | Description |
|----------|-------------|
| [`AI_OUTPUT_PRINCIPLES.md`](AI_OUTPUT_PRINCIPLES.md) | Core AI rules: grounding, confidence, evidence, no fabrication |
| [`MOCK_AI_REPORTS.md`](MOCK_AI_REPORTS.md) | Mock AI generator design, confidence logic, evidence grounding |
| [`REAL_AI_PROVIDER_LAYER.md`](REAL_AI_PROVIDER_LAYER.md) | Provider-agnostic AI architecture, env vars, guardrails |
| [`ANALYSIS_JOBS.md`](ANALYSIS_JOBS.md) | Analysis job lifecycle, input/output snapshots, versioning |

---

## Engineering

| Document | Description |
|----------|-------------|
| [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md) | Full stack and architecture reference |
| [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md) | Concise technical brief for reviewers — stack, data model, AI pipeline, security |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Complete schema reference — all 17 tables, 12 enums, indexes |
| [`RLS_POLICIES.md`](RLS_POLICIES.md) | Row Level Security model and per-table policy reference |
| [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) | Supabase project setup, migrations, storage, auth configuration |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Vercel + Supabase deployment guide with post-deploy smoke test |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | Environment variable reference — all vars, defaults, required vs. optional |
| [`BUILD_RULES.md`](BUILD_RULES.md) | Engineering rules, naming conventions, TypeScript standards |
| [`REPO_STRUCTURE.md`](REPO_STRUCTURE.md) | Directory and file organization reference |

---

## Demo and QA

| Document | Description |
|----------|-------------|
| [`DEMO_DATA.md`](DEMO_DATA.md) | Demo workspace setup — team, game, roster, events, AI report details |
| [`PRODUCT_QA_CHECKLIST.md`](PRODUCT_QA_CHECKLIST.md) | 20-flow manual QA checklist for pre-release verification |
| [`MVP_READINESS_REPORT.md`](MVP_READINESS_REPORT.md) | Feature status table, security review, go/no-go assessment |
| [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) | Honest v1 scope decisions and documented limitations |
| [`SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md`](SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md) | Screenshot checklist, demo video plan, privacy notes |

---

## User Research

| Document | Description |
|----------|-------------|
| [`FIRST_USER_FEEDBACK.md`](FIRST_USER_FEEDBACK.md) | Feedback goals, form fields, signal interpretation, admin review workflow |
| [`COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md) | Founder interview script for coach discovery conversations |
| [`PRODUCT_ANALYTICS.md`](PRODUCT_ANALYTICS.md) | Event taxonomy, tracked events, privacy rules, funnel interpretation |

---

## Design

| Document | Description |
|----------|-------------|
| [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) | UI design system, component rules, color palette, tone |

---

## Portfolio

| Document | Description |
|----------|-------------|
| [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md) | Resume bullets, project description, skills demonstrated, interview answers |
| [`PITCH_LINES.md`](PITCH_LINES.md) | 5-second, 15-second, 30-second, 60-second, and technical pitch variants |

---

## Pilot and Validation

| Document | Description |
|----------|-------------|
| [`FINAL_PROJECT_HANDOFF.md`](FINAL_PROJECT_HANDOFF.md) | Single-file project summary — what's built, what's next, 20 immediate tasks |
| [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) | Full technical debt inventory (32 items, P0–P3) |
| [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md) | Actionable P0–P3 issue backlog ready for GitHub Issues |
| [`PILOT_READINESS_CHECKLIST.md`](PILOT_READINESS_CHECKLIST.md) | Pre-flight checklist for each demo and pilot context |
| [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md) | 4-week practical pilot plan — recruit, discover, observe, decide |
| [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md) | 10-dimension rubric for scoring AI report quality |
| [`DATA_PRIVACY_REVIEW.md`](DATA_PRIVACY_REVIEW.md) | What data is collected, protections in place, pilot privacy requirements |
| [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md) | 10 major product risks with likelihood, impact, and mitigation |
| [`30_DAY_FOUNDER_PLAN.md`](30_DAY_FOUNDER_PLAN.md) | Week-by-week founder execution plan — coach-first |
| [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md) | Explicit go/no-go criteria for 6 readiness levels |

## Engineering Roadmap

| Document | Description |
|----------|-------------|
| [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md) | Post-MVP reliability sprint — CI, Sentry, error handling, observability |
| [`V1_2_PRODUCT_ROADMAP.md`](V1_2_PRODUCT_ROADMAP.md) | Next product version — invitations, comparison, drill library, onboarding |
| [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md) | 5-phase CV roadmap from video utilities to player tracking |
| [`ROADMAP.md`](ROADMAP.md) | Complete phased build plan — built, near-term, technical, and long-term |

---

*Total documentation: 47 files*
*Last updated: June 2026*
