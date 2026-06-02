# GameIQ — Final Testing Instructions

Quick-reference guide for all test types. Run automated checks before every demo, release, or significant change.

---

## Automated Checks

Run these commands in order. All four must pass before shipping.

```bash
# TypeScript strict mode — 0 errors required
npm run typecheck

# ESLint — 0 warnings required
npm run lint

# Unit + component tests — 167/167 must pass
npm run test

# Production build — all 34 routes must compile
npm run build
```

**Watch mode for development:**

```bash
npm run test:watch
```

**Unit tests only:**

```bash
npm run test:unit
```

**Component smoke tests only:**

```bash
npm run test:components
```

---

## E2E Tests (Playwright)

Requires a running dev server and a configured Supabase project.

```bash
# Terminal 1: start dev server
npm run dev

# Terminal 2: run E2E tests
npm run test:e2e
```

Current E2E coverage: public route smoke tests only. Full authenticated E2E tests against a test Supabase project are a P2 item.

---

## AI Benchmark

`npm run benchmark:ai` is not implemented. AI output quality is evaluated by:

1. **Unit tests** — Zod schema validation and hallucination normalization are covered in `tests/unit/`
2. **Manual evaluation** — Use [`REPORT_QUALITY_EVALUATION.md`](REPORT_QUALITY_EVALUATION.md) to score real reports on 10 dimensions
3. **Roadmap** — Formal benchmark harness is a P2 item for v1.1

---

## Test Coverage Areas

| Area | Test file | Tests |
|------|-----------|-------|
| Timestamp parsing + formatting | `tests/unit/time.test.ts` | ~30 |
| AI report Zod schema validation | `tests/unit/report-schema.test.ts` | ~25 |
| AI hallucination guard (ID normalization) | `tests/unit/normalize.test.ts` | ~20 |
| Share sanitization (all 4 modes) | `tests/unit/sanitize-report.test.ts` | ~25 |
| Permission helper functions | `tests/unit/permissions.test.ts` | ~15 |
| Auth redirect safety | `tests/unit/redirect.test.ts` | 14 |
| Auth form validation | `tests/unit/auth-validation.test.ts` | 22 |
| ConfidenceBadge smoke | `tests/components/ConfidenceBadge.test.tsx` | ~8 |
| VerificationBadge smoke | `tests/components/VerificationBadge.test.tsx` | ~4 |
| EmptyState smoke | `tests/components/EmptyState.test.tsx` | ~4 |
| **Total** | 9 files | **167** |

---

## Manual Smoke Test (Critical Path)

After any significant change, manually verify this path in a browser (requires live Supabase):

1. Sign up with a new email → confirm profile created
2. Create a team → verify owner role assigned
3. Add a player → verify appears in roster
4. Create a game → verify appears in games list
5. Navigate to timestamps → add 3 events
6. Navigate to report → click Generate Report (mock mode)
7. Verify all 6 report sections load
8. Open an insight → verify evidence panel shows
9. Mark insight as "Accurate"
10. Click Share → create a Public Summary link
11. Open the link in incognito → verify read-only, executive summary only
12. Click Export → verify print layout loads
13. Sign out → verify redirected to `/`
14. Try accessing `/dashboard` → verify redirect to login

---

## Permission Test

Verify that access control is enforced correctly:

| Role | Can create/edit | Can generate report | Can share/export | Can access admin |
|------|----------------|--------------------|-----------------:|-----------------|
| Owner | ✅ | ✅ | ✅ | If in `ADMIN_EMAILS` |
| Coach | ✅ | ✅ | ✅ | If in `ADMIN_EMAILS` |
| Analyst | ✅ | ✅ | ✅ | No |
| Player | ❌ | ❌ | ❌ | No |
| Non-member | Returns 404 | — | — | — |
| Unauthenticated | Redirect to login | — | — | — |

**Key permission tests to run:**
- Sign in as a player-role user → verify no write controls visible
- Access a team route for a team you're not a member of → verify 404
- Access `/admin/*` without being in `ADMIN_EMAILS` → verify access denied screen
- Access an expired/revoked share link → verify error message, not report data

---

## Security Test

| Check | How to test |
|-------|------------|
| No API keys in browser | Open DevTools Console → search for `sk-`, `service_role` → should find nothing |
| Share tokens are not sequential | Create 3 share links → inspect tokens → all should be 24-char base64url, not incrementing IDs |
| Revoked link blocked | Create a link → revoke it → open URL → verify error, not report |
| Video not in shared report | Open any shared report view → inspect page source → no signed storage URLs |
| Admin page blocked | Sign in as a non-admin user → navigate to `/admin` → verify "Access denied" |
| Redirect to same origin only | Try login with `?redirectTo=https://evil.com` → verify redirect goes to `/dashboard` instead |

---

## Release Candidate Test

For the full RC1 test report, see [`RELEASE_CANDIDATE_REPORT.md`](RELEASE_CANDIDATE_REPORT.md).

For the classified bug list, see [`FINAL_BUG_LIST.md`](FINAL_BUG_LIST.md).

For the 20-step post-deploy smoke test, see [`PRODUCTION_SMOKE_TEST.md`](PRODUCTION_SMOKE_TEST.md).

---

## CI/CD

Every push and pull request to `main` runs the full automated sweep via GitHub Actions:

```
.github/workflows/ci.yml
```

Steps: `npm ci` → `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`

No secrets required in CI. Uses `AI_PROVIDER=mock` (no API key needed).

---

*Last updated: 2026-06-02 — Prompt 26: Final Project Handoff*
