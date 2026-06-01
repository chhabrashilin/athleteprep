# GameIQ — Design Principles

> These principles govern every UI decision in GameIQ. They exist to ensure the product consistently feels premium, serious, and coach-friendly — not like a generic SaaS dashboard or student project.

---

## 1. Design Identity

GameIQ is a coach-first sports intelligence platform. The visual language must reflect that:

**Must feel like:** A professional analyst's tool. Calm, focused, evidence-driven. Like Notion met ESPN's data team.

**Must not feel like:**
- A generic admin dashboard (no Bootstrap default tables)
- A crypto dashboard (no unnecessary glow effects, gradients, or coin-price-style widgets)
- A school project (no Comic Sans, clip art, or amateur spacing)
- A cluttered BI tool (no 20-metric data dumps on a single screen)
- A toy AI chatbot (no chat bubbles as the primary UI pattern for insights)

**Reference aesthetic:** Dark, premium, sport-adjacent. Think: linear.app clarity meets ESPN analytics meets a coach's tactical whiteboard.

---

## 2. Color System

Use a defined, limited palette. Do not use arbitrary Tailwind colors without intentional system design.

### Recommended Base Palette

| Role | Token | Notes |
|------|-------|-------|
| Background (deep) | `slate-950` | Main app background |
| Background (surface) | `slate-900` | Card, sidebar backgrounds |
| Background (elevated) | `slate-800` | Hover states, secondary cards |
| Border | `slate-700` | Subtle card borders |
| Text primary | `slate-50` | Headings, key data |
| Text secondary | `slate-400` | Labels, metadata, captions |
| Text muted | `slate-600` | Disabled, placeholder |
| Accent (brand) | `sky-500` | Primary actions, highlights, active states |
| Accent (hover) | `sky-400` | Hover on brand elements |
| Success | `emerald-500` | Positive events, accurate verifications |
| Warning | `amber-500` | Medium confidence, partial accuracy |
| Danger | `red-500` | Errors, inaccurate verifications, critical issues |
| Low confidence | `slate-400` | Muted badge for low-confidence insights |

These are starting points. The final palette may be refined, but it must remain a closed system. Do not introduce random one-off colors.

---

## 3. Typography

- Use a single font family throughout. Inter or Geist are good defaults.
- Establish a clear type scale. Headings should be visually distinct from body text.
- Do not use more than 3 type weights in a single view.
- Keep line length for body text between 60–75 characters (use `max-w-prose` or equivalent).
- Avoid ALL CAPS for body text. Use it sparingly for labels and badges.
- Text must be readable at all sizes. No 9px type.

Hierarchy:
- `text-2xl` or `text-3xl` for page titles
- `text-xl` for section headings
- `text-base` for body content
- `text-sm` for metadata, timestamps, captions
- `text-xs` for badges, tags, compact labels

---

## 4. Layout Principles

- Show the most important information first, every time.
- Prioritize vertical scan. Users should be able to read a page top-to-bottom and extract the key insights.
- Use clear sections with headings. Do not merge unrelated content into a single undifferentiated block.
- Content should have breathing room. Adequate padding prevents the "everything is urgent" feeling.
- Fixed sidebar for primary navigation. Content area for the main task.
- Keep the sidebar focused: team, games list, settings. Do not crowd it with every feature.
- Use `max-w-5xl` or `max-w-6xl` for main content columns. Do not stretch to 100% viewport on ultra-wide screens.
- Sticky headers for long report pages so the user always knows their context.

---

## 5. Card Design Rules

Cards are the primary unit of display for insights, players, game records, and recommendations.

Card anatomy:
1. **Header:** Title + confidence badge (right-aligned) + verification status
2. **Body:** Summary text + key data
3. **Evidence row:** Labeled evidence references (collapsed by default, expandable)
4. **Footer:** Actions (verify, edit, jump to clip, expand)

Rules:
- Every card with AI content must show the confidence badge.
- Cards must have clear hover states.
- Cards must have a visual distinction for verified vs. unreviewed vs. edited vs. inaccurate states.
- Card content should fit without horizontal scrolling.
- Do not use more than 3 columns of cards at any breakpoint. Two columns or single-column stacks are preferred.

---

## 6. Confidence Badge Rules

Confidence badges are a core trust UI element. They must be:

- Always visible on AI-generated content cards (not hidden in an overflow menu).
- Color-coded consistently:

| Level | Badge color |
|-------|-------------|
| High | `emerald-500` background with white text |
| Medium | `amber-500` background with dark text |
| Low | `slate-600` background with `slate-300` text |

- Never use confidence language without the visual badge.
- The badge should be a small pill: e.g., "● High Confidence", "● Medium Confidence", "● Low Confidence".
- Hovering or clicking a confidence badge should show a tooltip explaining what the level means.

---

## 7. Verification State Rules

Verification is a first-class UI concept. Every verified/unverified distinction must be clear.

| State | Visual treatment |
|-------|-----------------|
| Unreviewed | Neutral card border, no verification icon |
| Accurate | Green checkmark badge, subtle green border or accent |
| Partially Accurate | Yellow badge, amber border or accent |
| Inaccurate | Red badge, red border or accent |
| Edited | Blue pencil badge, blue border or accent |

Rules:
- The verification status must be visible at a glance from the card list without needing to open each card.
- Unreviewed items should subtly invite review (e.g., a muted "Review" button).
- After verification, the coach should get a micro-confirmation (a brief animation or state change).
- The report should show an overall verification progress summary: e.g., "4 of 8 insights reviewed."

---

## 8. Loading State Rules

Every data-fetching action must show a loading state. Loading must never be invisible.

Rules:
- Use skeleton screens (gray placeholder blocks) for initial page loads, not spinners.
- Use a spinner inside the triggering button for user-initiated actions (submit, generate report).
- Loading states should include a brief explanatory label: "Generating your report..." not just a spinner.
- For analysis jobs (which may take 10–60 seconds), show a progress indicator with step labels:
  - "Analyzing metadata..."
  - "Processing event timestamps..."
  - "Generating player reports..."
  - "Finalizing insights..."
- Long-running operations must never block the entire UI. Use async job patterns.

---

## 9. Empty State Rules

Empty states are product experiences, not afterthoughts.

Every empty state must:
- Show a relevant icon or illustration (not a generic "no data" icon).
- Explain what is empty and why.
- Provide a clear call to action to fill it.
- Be specific to the context.

Examples:

| Context | Empty state message |
|---------|---------------------|
| No games created | "No games yet. Upload your first game to start generating insights." + "Add Game" button |
| No players on roster | "Your roster is empty. Add players before creating a game." + "Add Player" button |
| No insights generated | "Run AI analysis to generate insights for this game." + "Run Analysis" button |
| No timestamps added | "Add event timestamps to improve the quality of your AI report." + "Add Timestamp" button |

Rules:
- Empty states must guide, not dead-end.
- Never show a blank page. Always show a useful empty state.
- Empty states should match the design language: clean, premium, not a generic 404.

---

## 10. Error State Rules

Errors must help the user recover. They must not panic the user or provide no path forward.

Rules:
- All error messages must be in plain language. No raw error codes or stack traces shown to users.
- Provide a recovery action: retry, refresh, contact support, check input.
- Error states for forms must highlight the specific field with the problem.
- API errors must show the specific error message from the server if it is safe to display.
- Network/timeout errors should offer a retry button.
- Fatal errors (unable to load core data) should offer a page refresh and a link to support.

Error message format:
> **Something went wrong**  
> [Short explanation of what failed and why]  
> [Retry button or recovery action]

Never:
> "Error 500: Internal Server Error"  
> "undefined is not a function"  
> "An unexpected error occurred." (with no further information)

---

## 11. Report Presentation View

The shareable/export report view must be polished enough to be sent to players, parents, or administrators.

Rules:
- The report view must have clean print/PDF styles.
- No debugging UI, admin controls, or internal-facing widgets in the export view.
- Use generous white space in the report view.
- Confidence badges and evidence references should be present but styled for readability, not as interactive UI.
- Player photos (if available) should be shown.
- The team logo and game metadata should anchor the top of the report.
- The exported report must clearly identify GameIQ as the source.

---

## 12. Navigation Principles

- The primary navigation lives in a fixed left sidebar.
- The sidebar should show: Team name/logo, Games, Roster, Settings.
- In-context navigation (within a game/report) should use a secondary in-page navigation or a breadcrumb trail.
- The current page/section must always be clearly indicated with an active state.
- Breadcrumbs for deep pages: e.g., `Games > Chelsea vs Arsenal > Report > Player Reports`
- Mobile: sidebar collapses to a hamburger menu or bottom nav. Do not attempt a full sidebar on mobile without responsive treatment.

---

## 13. Interaction Micro-Details

- All interactive elements must have clear hover and focus states (not just color change — use outlines, shadows, or scale shifts).
- Destructive actions (delete game, remove player) must require confirmation before executing.
- Confirmation dialogs must describe what will be deleted and that it cannot be undone.
- Form submissions must disable the submit button during processing to prevent double-submits.
- Video timestamp links must visually indicate they are clickable: an arrow icon, underline, or timestamp pill style.
- Clipboard copy actions must confirm success with a brief "Copied!" toast or icon state change.
- Toast notifications should appear in the bottom-right or top-right and auto-dismiss after 4 seconds.

---

## 14. Accessibility Baseline

- All interactive elements must be keyboard accessible.
- Focus order must be logical for keyboard navigation.
- Color must not be the only indicator of state (confidence levels, verification states must also have icons or labels).
- All images and icons that convey meaning must have `alt` text or `aria-label`.
- Form inputs must have visible labels (not just placeholder text).
- Error messages must be associated with their input via `aria-describedby`.
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG AA).
