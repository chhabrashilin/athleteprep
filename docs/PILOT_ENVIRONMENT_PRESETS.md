# GameIQ — Pilot Environment Presets

> Copy the relevant preset into your `.env.local` (development) or Vercel environment variables (production) when setting up a new deployment context.
>
> Always review security warnings before enabling real AI or modifying default flags.

---

## Preset 1 — Local Development

**Use when:** Running the app on your local machine for development.

**Characteristics:**
- Mock AI enabled — no API calls, zero cost
- Demo data enabled — `/demo/setup` creates a sample workspace
- Real AI disabled
- Video processing disabled
- No Supabase required for UI scaffolding (auth and data features need Supabase)

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GameIQ

# Supabase — fill in if testing auth/database features
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
NEXT_PUBLIC_THUMBNAIL_BUCKET=game-thumbnails
REPORT_EXPORT_BUCKET=report-exports

# AI — mock mode, no API key needed
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_REAL_AI=false

# Feature flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=true         # Enable demo workspace
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING=false
NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK=true
NEXT_PUBLIC_PILOT_MODE=false

# Admin
ADMIN_EMAILS=your@email.com
```

**Notes:**
- Without Supabase vars, auth-protected routes won't work. The UI shell is still accessible.
- Leave `NEXT_PUBLIC_ENABLE_MOCK_DATA=true` to use the demo workspace for manual testing.

---

## Preset 2 — Founder Demo Deployment

**Use when:** Deploying to Vercel specifically for live demos to investors, advisors, or early coaches, where you control the session and walk the user through the demo.

**Characteristics:**
- Demo data enabled — demo workspace available for instant demos
- Mock AI or real AI depending on budget and readiness
- Analytics enabled to capture demo engagement
- Pilot mode banner optional (turn on for honest MVP positioning)

```env
# App
NEXT_PUBLIC_APP_URL=https://your-demo.vercel.app
NEXT_PUBLIC_APP_NAME=GameIQ

# Supabase — use a dedicated demo project (not production data)
NEXT_PUBLIC_SUPABASE_URL=https://your-demo-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
NEXT_PUBLIC_THUMBNAIL_BUCKET=game-thumbnails
REPORT_EXPORT_BUCKET=report-exports

# AI — mock is safe; switch to openai only if you have a spend cap in place
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_REAL_AI=false
# OPENAI_API_KEY=sk-...       # Only set if switching to real AI
# OPENAI_MODEL=gpt-4o-mini

# Feature flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=true         # Enable demo workspace creation
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING=false
NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK=true
NEXT_PUBLIC_PILOT_MODE=true               # Show "Pilot MVP" badge for honest positioning

# Admin
ADMIN_EMAILS=founder@yourdomain.com
```

**Notes:**
- Use a **separate Supabase project** from production so demo data doesn't mix with pilot coach data.
- If switching to real AI: set `AI_PROVIDER=openai`, `OPENAI_API_KEY=sk-...`, and `NEXT_PUBLIC_ENABLE_REAL_AI=true`. Confirm your OpenAI spend cap is set first.
- Pilot mode badge reminds coaches this is an MVP without requiring the founder to say it awkwardly.

---

## Preset 3 — Coach Pilot Deployment

**Use when:** Deploying to Vercel for a real pilot where coaches will use the product with their own game data, unsupervised or semi-supervised.

**Characteristics:**
- Demo data disabled — coaches use real data, not demo
- Mock AI by default (real AI optional when cost caps are confirmed)
- Analytics enabled to monitor pilot usage
- Video storage private
- Pilot mode banner enabled

```env
# App
NEXT_PUBLIC_APP_URL=https://gameiq.yourteam.com
NEXT_PUBLIC_APP_NAME=GameIQ

# Supabase — use production project (Pro plan, backups enabled)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
NEXT_PUBLIC_THUMBNAIL_BUCKET=game-thumbnails
REPORT_EXPORT_BUCKET=report-exports

# AI — mock is the safe default for pilot launch
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_REAL_AI=false
# To enable real AI (after confirming spend cap):
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# NEXT_PUBLIC_ENABLE_REAL_AI=true

# Feature flags
NEXT_PUBLIC_ENABLE_MOCK_DATA=false        # Coaches use real data — no demo workspace
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING=false
NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK=true   # Keep feedback on — pilot feedback is gold
NEXT_PUBLIC_PILOT_MODE=true              # Honest MVP positioning for coaches

# Admin
ADMIN_EMAILS=founder@yourdomain.com,cofounder@yourdomain.com
```

**Before launching this preset:**
- [ ] Complete the full [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md)
- [ ] Run all 20 steps in [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md)
- [ ] Supabase Pro plan is active (no auto-pause)
- [ ] OpenAI spend cap is set if `NEXT_PUBLIC_ENABLE_REAL_AI=true`
- [ ] You have a support contact method for pilot coaches (email or DM)
- [ ] Privacy disclosure sent to each pilot coach before they upload data

**Notes:**
- `NEXT_PUBLIC_ENABLE_MOCK_DATA=false` means `/demo/setup` is hidden. Coaches create their own teams.
- If a specific coach needs a demo walkthrough, temporarily set `NEXT_PUBLIC_ENABLE_MOCK_DATA=true` for their onboarding session, then revert.

---

## Preset 4 — Public Beta

**Status: NOT RECOMMENDED for GameIQ v1.**

Public beta requires capabilities that are not yet implemented:
- Team invitation workflow
- Password reset for non-founders
- Self-serve data deletion
- Player role scoping (players see only their own data)
- Rate limiting on all public endpoints
- Real monitoring with automatic alerting
- Full privacy policy (legally reviewed)
- Automated test coverage on critical flows

When the above are complete, a public beta preset would look like:

```env
# (Future — do not use in v1)
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_REAL_AI=true    # Only after cost controls and monitoring
NEXT_PUBLIC_PILOT_MODE=false       # Graduated beyond pilot at this point
NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK=true
```

**See:** [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md) Level 5 for full public beta requirements.

---

## Switching Between Presets

1. Update environment variables in Vercel (Settings → Environment Variables)
2. Trigger a new deployment (push a commit, or redeploy in Vercel dashboard)
3. Run the smoke test: [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md)

**Never update `.env.local` in production.** All production environment changes go through Vercel.

---

## Security Rules That Apply to All Presets

1. `SUPABASE_SERVICE_ROLE_KEY` is **never** prefixed `NEXT_PUBLIC_`
2. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` are **never** prefixed `NEXT_PUBLIC_`
3. All three storage buckets are **always private** — never make them public
4. `.env.local` is **never committed to git** (enforced by `.gitignore`)
5. Rotate any exposed key immediately in the provider dashboard

---

*See also: [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`PRODUCTION_SUPABASE_CHECKLIST.md`](PRODUCTION_SUPABASE_CHECKLIST.md) · [`GO_NO_GO_CRITERIA.md`](GO_NO_GO_CRITERIA.md)*  
*Last updated: Prompt 22 — Pilot Deployment and Production Environment Setup (June 2026)*
