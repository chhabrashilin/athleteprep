# GameIQ — Pitch Lines

> Use these in introductions, emails, LinkedIn bios, demo openings, elevator pitches, and application materials. Match the length to the context.

---

## 5-Second Pitch

"GameIQ turns game film into coach-ready insights, player feedback, and next-practice plans."

---

## 15-Second Pitch

"GameIQ helps coaches upload game film, tag key moments, and generate evidence-linked AI reports — with player feedback, confidence scores, and practice recommendations — in about 10 minutes."

---

## 30-Second Pitch

"Most teams record their games but don't have the time or staff to turn that film into actionable feedback. GameIQ lets coaches combine video, roster data, notes, and tagged key moments to generate structured AI reports with coaching insights, player feedback, opponent tendencies, and next-practice plans — all with evidence links, confidence scores, and coach verification controls."

---

## 60-Second Pitch

"Most sports teams record more game footage than they can meaningfully analyze. A coaching staff might spend 2–4 hours on post-game film review and still end up with vague player feedback.

GameIQ changes that. Coaches upload their game film, tag key moments — a tactical breakdown, a missed assignment, a counterattack — and GameIQ generates a structured AI report in about 10 minutes. The report includes specific coaching insights with confidence scores and evidence references, player-by-player feedback with strengths and improvement areas, opponent tendency analysis, and next-practice drill recommendations.

Importantly, the AI is transparent: every claim shows which tagged events support it and how confident the AI is. Coaches can verify, correct, and edit any output. And because all corrections are stored, the system gets better over time.

We're starting with manually tagged key moments — no computer vision required — because that approach delivers immediate, trustworthy value while we build toward automated event detection."

---

## Technical Pitch

"GameIQ is a full-stack AI sports intelligence MVP built on Next.js App Router, TypeScript strict mode, Supabase Auth/Postgres/Storage, and a provider-agnostic LLM integration layer. The AI pipeline takes a structured input snapshot — team, roster, game metadata, coach notes, and manually tagged event timestamps — and generates a strict JSON report validated by Zod schema. Evidence IDs are normalized against real database rows. Every coaching insight includes confidence scoring and evidence grounding. Coach verification and inline editing are built into the core reading flow, with original AI output preserved in an append-only audit trail. Shareable reports use 144-bit entropy tokens with 4 visibility modes and server-side sanitization. The system is deployed on Vercel with Supabase-hosted Postgres and private video storage."

---

## Honest MVP Caveat

"A note on what GameIQ does and does not do in v1: the current platform does not perform automated computer vision or video frame analysis. The AI report is generated from structured inputs — game metadata, roster data, coach notes, and manually tagged key moments. This is an intentional design choice: manual tagging captures the most diagnostically valuable moments without requiring expensive CV infrastructure, and produces more reliable, trustworthy outputs. Full automated event detection from video frames is on the roadmap for a future phase."

---

## Email / LinkedIn Opening Line

"I'm building GameIQ — an AI sports intelligence platform that turns game film and tagged key moments into structured coaching reports with evidence-linked insights, player feedback, and practice recommendations."

---

## Demo Opening Line

"Before I show you the product — how do you currently review film after a game? [pause] GameIQ is designed to solve exactly that problem: taking the game you just recorded and turning it into something you can actually use."

---

## One-Liner for Business Cards / Portfolio Headers

**GameIQ** — AI game review in 10 minutes.

---

*See also: [`PITCH_PRODUCT_ONE_PAGER.md`](PITCH_PRODUCT_ONE_PAGER.md), [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md)*
