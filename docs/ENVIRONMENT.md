# GameIQ — Environment Variables

> This document lists all environment variables used by the application, their purpose, and setup instructions for local development.

---

## Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required values.
3. **Never commit `.env.local` or any `.env` file containing real secrets.**

---

## Variable Reference

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public URL of the deployed app. Used for metadata and Open Graph. |
| `NEXT_PUBLIC_APP_NAME` | No | `GameIQ` | Display name. Currently cosmetic only. |

---

### Supabase

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (Phase 1+) | Your Supabase project URL. Found in Supabase Dashboard → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (Phase 1+) | Public anon key for browser-side client. Safe to expose to the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server-side, Phase 1+) | Service role key. **Never expose to the browser.** Used only in server-side Supabase calls. |

**Finding Supabase keys:**
1. Go to [supabase.com](https://supabase.com) → Your project → Settings → API.
2. Copy the Project URL and the `anon` / `public` key.
3. Copy the `service_role` key for the service role secret.

**Development without Supabase:**
During early development, you can run the app without Supabase configured. The browser client will warn in the console but will not crash the app. Auth-protected routes will not function, but the UI scaffold remains accessible.

---

### AI Provider

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `mock` | Active AI provider. Options: `mock`, `openai`, `anthropic`, `gemini`. |
| `OPENAI_API_KEY` | When `AI_PROVIDER=openai` | — | OpenAI API key. Server-side only — do not prefix with `NEXT_PUBLIC_`. |
| `ANTHROPIC_API_KEY` | When `AI_PROVIDER=anthropic` | — | Anthropic API key. Server-side only. |
| `GEMINI_API_KEY` | When `AI_PROVIDER=gemini` | — | Google Gemini API key. Server-side only. |

**Mock mode:**
With `AI_PROVIDER=mock` (the default), the AI service returns realistic structured mock data from `lib/ai/mock-ai.ts`. No API costs are incurred. This is the correct mode for all development until Phase 5.

**Enabling real AI:**
Set `NEXT_PUBLIC_ENABLE_REAL_AI=true` and `AI_PROVIDER=openai` (or chosen provider) and supply the corresponding API key.

---

### Storage

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_STORAGE_BUCKET` | No | `game-videos` | Supabase Storage bucket name for uploaded videos. |

---

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | No | `true` | Shows mock/demo data in the UI for development. |
| `NEXT_PUBLIC_ENABLE_REAL_AI` | No | `false` | When `true`, routes AI calls to the real provider instead of mock. |
| `NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING` | No | `false` | When `true`, enables server-side FFmpeg video metadata extraction. Not active until Phase 7+. |

---

## Local Development Setup

### Minimum viable local setup (mock mode — no Supabase needed)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GameIQ
AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REAL_AI=false
```

This allows the app to run, display the UI, and generate mock AI reports without any external services.

### Full local setup with Supabase

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GameIQ
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
AI_PROVIDER=mock
NEXT_PUBLIC_STORAGE_BUCKET=game-videos
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
NEXT_PUBLIC_ENABLE_REAL_AI=false
NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING=false
```

### Full setup with real AI

Additional variables for Phase 5:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

---

## Security Rules

1. **Never** commit `.env`, `.env.local`, or any file containing real API keys.
2. **Never** put server-side secrets (Supabase service role key, AI API keys) in variables prefixed with `NEXT_PUBLIC_`.
3. The `SUPABASE_SERVICE_ROLE_KEY` must only be used in server-side code. It bypasses RLS.
4. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to be public — it is constrained by RLS policies.
5. In production, set environment variables via the deployment platform (Vercel, etc.), not in committed files.

---

## `.env.example`

The `.env.example` file in the project root documents all variables with placeholder values. It is safe to commit and should be kept up to date whenever new variables are added.
