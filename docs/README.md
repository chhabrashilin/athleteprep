# GameIQ — Documentation Index

> Start here. Every GameIQ document organized by purpose.

**Total documentation:** 65+ files  
**Last updated:** 2026-06-02 — Final Project Handoff (Prompt 26)

---

## Start Here

| Document | Purpose |
|----------|---------|
| [`FINAL_PROJECT_HANDOFF.md`](FINAL_PROJECT_HANDOFF.md) | **The single most important file.** What is built, how to run it, how to demo it, top risks, next 10 engineering tasks, next 10 founder tasks. |
| [`FINAL_RELEASE_STATUS.md`](FINAL_RELEASE_STATUS.md) | RC1 automated check results, manual QA status, open P0/P1/P2 bugs, go/no-go summary. |
| [`RELEASE_CANDIDATE_REPORT.md`](RELEASE_CANDIDATE_REPORT.md) | Full RC1 release candidate report — security, permissions, AI benchmark, bugs fixed. |
| [`MVP_READINESS_REPORT.md`](MVP_READINESS_REPORT.md) | Feature status table, security review summary, go/no-go by demo context. |
| [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) | Honest v1 scope decisions — what GameIQ does and does not do. |
| [`FINAL_BUG_LIST.md`](FINAL_BUG_LIST.md) | Classified P0/P1/P2/P3 bug list with fix status. |

---

## Product and Strategy

| Document | Purpose |
|----------|---------|
| [`PROJECT_CONSTITUTION.md`](PROJECT_CONSTITUTION.md) | Product vision, principles, user model, AI rules — the authoritative source of product truth |
| [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md) | Problem, solution, target customer, MVP status — readable in 5 minutes |
| [`INVESTOR_ADVISOR_BRIEF.md`](INVESTOR_ADVISOR_BRIEF.md) | Thesis, wedge, differentiation, risks, and next milestones for investors and advisors |
| [`FINAL_POSITIONING.md`](FINAL_POSITIONING.md) | One-liner, founder thesis, why manual timestamps first, billion-dollar path |
| [`LANDING_PAGE_STRATEGY.md`](LANDING_PAGE_STRATEGY.md) | Target audience, positioning, copy principles, CTA strategy |
| [`PITCH_LINES.md`](PITCH_LINES.md) | 5-second, 15-second, 30-second, 60-second, and technical pitch variants |
| [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md) | Resume bullets, project description, skills demonstrated, interview answers |

---

## Demo and Discovery

| Document | Purpose |
|----------|---------|
| [`FINAL_DEMO_INSTRUCTIONS.md`](FINAL_DEMO_INSTRUCTIONS.md) | 5-minute demo, 15-minute deep demo, talk track, safety notes — read before any demo |
| [`FOUNDER_DEMO_SCRIPT.md`](FOUNDER_DEMO_SCRIPT.md) | Structured 5–7 minute demo script for coaches and investors |
| [`COACH_DEMO_GUIDE.md`](COACH_DEMO_GUIDE.md) | Coach-facing demo guide with script, questions to ask, and founder notes |
| [`COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md) | Founder interview script for discovery conversations with coaches |
| [`DEMO_DATA.md`](DEMO_DATA.md) | What's in the demo workspace — Madison Cricket XI, 12 events, full report |

---

## Core Features

| Document | Purpose |
|----------|---------|
| [`AUTHENTICATION.md`](AUTHENTICATION.md) | Auth flow, PKCE, proxy middleware, safe redirects, profile setup |
| [`TEAM_WORKSPACES.md`](TEAM_WORKSPACES.md) | Team workspace concept, creation flow, role model |
| [`ROSTER_MANAGEMENT.md`](ROSTER_MANAGEMENT.md) | Player data model, permissions, archive vs. permanent delete |
| [`GAME_CREATION.md`](GAME_CREATION.md) | Game/practice data model, setup checklist, 4-section form |
| [`VIDEO_ASSETS.md`](VIDEO_ASSETS.md) | Video upload architecture, storage paths, signed URLs |
| [`TIMESTAMPS_AND_EVENTS.md`](TIMESTAMPS_AND_EVENTS.md) | Manual timestamp feature, event fields, AI readiness scoring |
| [`REPORT_DASHBOARD.md`](REPORT_DASHBOARD.md) | Report dashboard layout, insight detail, evidence linking |
| [`VERIFICATION_AND_EDITING.md`](VERIFICATION_AND_EDITING.md) | Coach verification workflow, report editing, audit trail |
| [`SHARING_AND_ACCESS.md`](SHARING_AND_ACCESS.md) | Share links, 4 visibility modes, token strategy, sanitization |
| [`EXPORTS_AND_PRINTING.md`](EXPORTS_AND_PRINTING.md) | Export-ready view, section selector, print-to-PDF strategy |

---

## AI and Evaluation

| Document | Purpose |
|----------|---------|
| [`AI_OUTPUT_PRINCIPLES.md`](AI_OUTPUT_PRINCIPLES.md) | Core AI rules: grounding, confidence, evidence, no fabrication |
| [`MOCK_AI_REPORTS.md`](MOCK_AI_REPORTS.md) | Mock AI generator design, confidence logic, evidence grounding |
| [`REAL_AI_PROVIDER_LAYER.md`](REAL_AI_PROVIDER_LAYER.md) | Provider-agnostic AI architecture, env vars, guardrails |
| [`ANALYSIS_JOBS.md`](ANALYSIS_JOBS.md) | Analysis job lifecycle, input/output snapshots, versioning |
| [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md) | 10-dimension rubric for scoring AI report quality with real data |

---

## Engineering and Security

| Document | Purpose |
|----------|---------|
| [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md) | Full stack and architecture reference |
| [`TECHNICAL_BRIEF.md`](TECHNICAL_BRIEF.md) | Concise technical brief for reviewers — stack, data model, AI pipeline, security |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Complete schema reference — all 17 tables, 12 enums, indexes |
| [`RLS_POLICIES.md`](RLS_POLICIES.md) | Row Level Security model and per-table policy reference |
| [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) | Supabase project setup, migrations, storage, auth configuration |
| [`STORAGE_SECURITY.md`](STORAGE_SECURITY.md) | Storage bucket privacy model, signed URL strategy, verification checklist |
| [`ENVIRONMENT.md`](ENVIRONMENT.md) | Environment variable reference — all vars, defaults, required vs. optional |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Vercel + Supabase deployment guide, 14 steps, rollback, warnings |
| [`BUILD_RULES.md`](BUILD_RULES.md) | Engineering rules, naming conventions, TypeScript standards |
| [`REPO_STRUCTURE.md`](REPO_STRUCTURE.md) | Directory and file organization reference |
| [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) | UI design system, component rules, color palette, tone |

---

## Pilot Operations

| Document | Purpose |
|----------|---------|
| [`PILOT_READINESS_CHECKLIST.md`](PILOT_READINESS_CHECKLIST.md) | Pre-flight checklist for each demo and pilot context |
| [`PILOT_PARTICIPANT_EXPECTATIONS.md`](PILOT_PARTICIPANT_EXPECTATIONS.md) | Plain-language guide for pilot coaches: what GameIQ does/doesn't do, data rules |
| [`PILOT_SUPPORT_RUNBOOK.md`](PILOT_SUPPORT_RUNBOOK.md) | Daily/weekly checks, 7 common scenarios, 6 response templates |
| [`COACH_PILOT_PLAN.md`](COACH_PILOT_PLAN.md) | 4-week practical pilot plan — recruit, discover, observe, decide |
| [`DATA_PRIVACY_REVIEW.md`](DATA_PRIVACY_REVIEW.md) | What data is collected, protections in place, pilot privacy requirements |
| [`DATA_DELETION_PLAN.md`](DATA_DELETION_PLAN.md) | Full SQL runbook for user, team, game, video, and share link deletion |
| [`SHARE_LINK_REVOCATION_RUNBOOK.md`](SHARE_LINK_REVOCATION_RUNBOOK.md) | In-app and SQL revocation for single links, report-level, and team-level |
| [`VIDEO_DELETION_RUNBOOK.md`](VIDEO_DELETION_RUNBOOK.md) | Storage path lookup, dashboard deletion, mismatch handling, failed upload cleanup |
| [`INCIDENT_RESPONSE_RUNBOOK.md`](INCIDENT_RESPONSE_RUNBOOK.md) | 10 incident types with severity, actions, investigation, communication, prevention |

---

## Production Setup

| Document | Purpose |
|----------|---------|
| [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md) | 9-section step-by-step checklist for production Supabase configuration |
| [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md) | 20-step post-deploy verification checklist |
| [`PILOT_ENVIRONMENT_PRESETS.md`](PILOT_ENVIRONMENT_PRESETS.md) | Preset env configs: Local Dev, Founder Demo, Coach Pilot, Public Beta |

---

## QA and Release

| Document | Purpose |
|----------|---------|
| [`PRODUCT_QA_CHECKLIST.md`](PRODUCT_QA_CHECKLIST.md) | 20-flow manual QA checklist with results from each prompt pass |
| [`LOCAL_RUN_REPORT.md`](LOCAL_RUN_REPORT.md) | Local environment config and first-run verification |
| [`AUTH_FLOW_QA.md`](AUTH_FLOW_QA.md) | Complete auth QA: flows, error states, 40+ manual test steps |
| [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) | Vitest + RTL + Playwright test strategy, coverage goals, CI setup |
| [`FINAL_TESTING_INSTRUCTIONS.md`](FINAL_TESTING_INSTRUCTIONS.md) | Quick-reference test instructions: automated + manual + permission + security |
| [`RELEASE_CANDIDATE_REPORT.md`](RELEASE_CANDIDATE_REPORT.md) | RC1 full report — automated tests, manual QA, security, permissions, bugs |
| [`FINAL_BUG_LIST.md`](FINAL_BUG_LIST.md) | P0/P1/P2/P3 classified bug list with fix status |
| [`FINAL_RELEASE_STATUS.md`](FINAL_RELEASE_STATUS.md) | One-page RC1 status: checks, QA, open blockers, recommendation |

---

## Founder Execution

| Document | Purpose |
|----------|---------|
| [`ROADMAP.md`](ROADMAP.md) | Complete phased build plan with current completion status |
| [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) | Full technical debt inventory (P0–P3, ~28 open items) |
| [`PRIORITIZED_ISSUES.md`](PRIORITIZED_ISSUES.md) | Actionable P0–P3 issue backlog ready for GitHub Issues |
| [`V1_1_ENGINEERING_ROADMAP.md`](V1_1_ENGINEERING_ROADMAP.md) | Post-MVP reliability sprint — Sentry, rate limiting, settings, cost tracking |
| [`V1_2_PRODUCT_ROADMAP.md`](V1_2_PRODUCT_ROADMAP.md) | Next product version — invitations, player scoping, season analytics |
| [`COMPUTER_VISION_ROADMAP.md`](COMPUTER_VISION_ROADMAP.md) | 5-phase CV roadmap from video utilities to full player tracking |
| [`30_DAY_FOUNDER_PLAN.md`](30_DAY_FOUNDER_PLAN.md) | Week-by-week founder execution plan — coach discovery first |
| [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md) | Explicit go/no-go criteria for 6 readiness levels |
| [`PRODUCT_RISK_REGISTER.md`](PRODUCT_RISK_REGISTER.md) | 10 major product risks with likelihood, impact, and mitigation |

---

## User Research and Analytics

| Document | Purpose |
|----------|---------|
| [`FIRST_USER_FEEDBACK.md`](FIRST_USER_FEEDBACK.md) | Feedback goals, form fields, signal interpretation, admin review workflow |
| [`COACH_DISCOVERY_GUIDE.md`](COACH_DISCOVERY_GUIDE.md) | Founder interview script for coach discovery conversations |
| [`PRODUCT_ANALYTICS.md`](PRODUCT_ANALYTICS.md) | Event taxonomy, tracked events, privacy rules, funnel interpretation |
| [`SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md`](SCREENSHOTS_AND_DEMO_MEDIA_PLAN.md) | Screenshot checklist, demo video plan, privacy notes |
