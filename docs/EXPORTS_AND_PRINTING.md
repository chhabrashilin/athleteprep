# GameIQ — Exports and Printing

> Describes the export-ready report view, browser print/PDF strategy, export record lifecycle, section selection, print styling, permissions, and future server-side PDF plans.

---

## 1. Purpose

Coaches need reports they can bring into staff meetings, print before practice, save as PDF, attach to emails, present to players, and archive. The export feature makes GameIQ useful beyond the web browser.

---

## 2. Export Strategy (v1)

GameIQ v1 uses **browser print / save-as-PDF** as the primary export mechanism.

- No server-side PDF generation (no Puppeteer/Playwright)
- No stored PDF files in Supabase Storage
- The coach opens a clean, print-ready export page
- They use the browser's built-in print dialog (Ctrl+P / Cmd+P) and choose **Save as PDF**
- An `exports` record is created in the database to track the event

This approach is fast to ship, requires no external dependencies, and produces high-quality PDFs across all modern browsers.

---

## 3. Routes

| Route | Description |
|-------|-------------|
| `/teams/[teamId]/games/[gameId]/report` | Main report dashboard — Export button in header |
| `/teams/[teamId]/games/[gameId]/report/export` | Clean export/print page |

The export page uses its own layout (`app/.../report/export/layout.tsx`) with no sidebar, no app shell, and no team navigation.

---

## 4. User Flow

1. Coach opens the report dashboard.
2. Coach clicks **Export** in the report header (staff-only action).
3. `ExportReportModal` opens showing:
   - Section selector (which sections to include)
   - Instructions for browser print/PDF
   - Export history (past exports for this report)
4. Coach selects sections and clicks **Open Export View**.
5. An `exports` row is created via server action (`createBrowserExportAction`).
   - Status is set to `processing`, then immediately `completed`.
   - Selected sections are stored in `metadata.sections`.
   - `storage_path` remains null (no server-side file).
6. Browser navigates to the export page with `?sections=...` query param.
7. Export page renders a clean, print-ready document.
8. Coach uses browser print dialog to print or save as PDF.

---

## 5. Export Page Layout

The export page renders a self-contained print document:

| Section | Controlled by |
|---------|--------------|
| Cover header (title, team, date, confidence, version) | Always shown |
| Executive Summary + Report Basis | `includeOverview` |
| Coaching Insights | `includeCoachingInsights` |
| Player Reports | `includePlayerReports` |
| Opponent Tendencies | `includeOpponentTendencies` |
| Practice Plan | `includePracticePlan` |
| Evidence / Key Moments | `includeEvidence` |
| Assumptions & Limitations | `includeAssumptionsLimitations` |
| Verification / Edited status on each item | `includeVerificationStatus` |

**Print controls** (`PrintControls.tsx`) appear at the top of the page on screen and are hidden in print via `no-print` CSS class.

---

## 6. Export Record Lifecycle

| Step | Status | Notes |
|------|--------|-------|
| User clicks "Open Export View" | `processing` | Record created before navigation |
| Export page loaded successfully | `completed` | Updated immediately after record creation |
| Record creation fails | — | Warning shown; user still navigates to export page |
| Report data unavailable | `failed` | Would be marked via `failExportAction` |

The export record tracks that a browser export was initiated. It does not store a file.

Fields relevant to browser exports:
- `export_type`: `browser_pdf`
- `storage_bucket`: null
- `storage_path`: null
- `metadata.sections`: selected sections object
- `metadata.exportMode`: `browser_pdf`

---

## 7. Section Selection

`ExportSectionOptions` interface defines 8 boolean flags:

```ts
interface ExportSectionOptions {
  includeOverview: boolean;
  includeCoachingInsights: boolean;
  includePlayerReports: boolean;
  includeOpponentTendencies: boolean;
  includePracticePlan: boolean;
  includeEvidence: boolean;
  includeAssumptionsLimitations: boolean;
  includeVerificationStatus: boolean;
}
```

Default: all sections enabled.

Sections are serialized as a JSON string in the `?sections=` URL query parameter. The export page parses this on the server. Invalid or missing params fall back to defaults.

---

## 8. Print Styling

`app/globals.css` includes a `@media print` block that:

- Hides `.no-print` elements (controls, navigation, buttons)
- Forces white background
- Removes shadows
- Applies `break-inside: avoid` to `.avoid-break` elements (cards, sections)
- Hides video players
- Sets `@page` margin to 2cm
- Shows `.print-only-footer` (hidden on screen)

The export layout (`export/layout.tsx`) uses a white background and clean typography — appropriate for both screen preview and print output.

---

## 9. Evidence in Export

Timestamp evidence is shown as text with:
- Formatted timestamp (MM:SS or H:MM:SS)
- Event label
- Description
- Related player names and jersey numbers

Video is **not embedded** in the export page. If video was uploaded, a note is shown:
> "Video uploaded: filename.mp4. Timestamp references correspond to the uploaded video file."

This allows the coach to locate moments in the original video file offline.

---

## 10. Permissions

| Role | Can open export modal | Can open export page |
|------|-----------------------|----------------------|
| owner | ✅ | ✅ |
| coach | ✅ | ✅ |
| analyst | ✅ | ✅ |
| player | ❌ (button not shown) | 🔄 Redirected to report |
| viewer | ❌ (button not shown) | 🔄 Redirected to report |

- Export button is only rendered in `ReportHeader` when `canEdit` is true (staff roles).
- `ExportReportModal` calls `createBrowserExportAction` which re-checks staff role server-side.
- `ExportReportPage` checks `STAFF_ROLES.includes(membership.role)` and redirects players/viewers.

---

## 11. Data Access Layer

`lib/db/exports.ts` provides:

| Function | Description |
|----------|-------------|
| `createExportRecord(input)` | Creates a new export row (staff-only) |
| `markExportCompleted(exportId, metadata?)` | Sets status to `completed` |
| `markExportFailed(exportId, errorMessage)` | Sets status to `failed` |
| `getExportsForReport(teamId, gameReportId)` | Returns export history for a report |
| `getExportById(teamId, exportId)` | Returns a single export record |

All functions use the authenticated server Supabase client and respect RLS.

---

## 12. Current Limitations

- Browser-generated PDFs are not stored — no download link is preserved
- No email delivery of exported reports
- No server-side PDF generation (Puppeteer/Playwright)
- Shared report export is not supported in v1
- View tracking of export page is not deduplicated
- Print layout uses default browser pagination; page breaks are controlled with `break-inside: avoid` but not fully customizable

---

## 13. Future Work

### Server-side PDF generation
- Use Puppeteer, Playwright, or a headless browser service to render the export page
- Store the generated PDF in Supabase Storage (`report-exports` bucket)
- Set `storage_bucket` and `storage_path` on the export record
- Provide a signed download URL for the coach

### Stored PDF downloads
- Coach can download previously generated PDFs from export history
- PDFs are regenerated on demand or cached until report changes

### Emailed reports
- Send the PDF directly to staff or players via email
- Player-specific export mode (only their section)

### Configurable branding
- Team logo on the cover header
- Custom footer with team name and colors

### Batch export
- Export all player reports as individual PDFs
- Export season summary across multiple games
