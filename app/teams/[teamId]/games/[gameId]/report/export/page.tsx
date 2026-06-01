import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Zap, Clock, Users, Film, AlertTriangle, CheckCircle, Edit3 } from "lucide-react";
import { PrintControls } from "@/components/export/PrintControls";
import { getTeamByIdForCurrentUser, getCurrentUserTeamMembership } from "@/lib/db/teams";
import { getGameByIdForTeam } from "@/lib/db/games";
import { getFullGameReportData } from "@/lib/db/reports";
import { buildAnalysisInputSnapshot } from "@/lib/analysis/build-input-snapshot";
import type { ExportSectionOptions } from "@/types/export";
import type {
  CoachingInsight,
  PlayerReport,
  PracticeRecommendation,
  OpponentTendency,
  Player,
  EvidenceItem,
} from "@/types/database";
import type { ConfidenceLevel, VerificationStatus } from "@/types/core";
import { DEFAULT_EXPORT_SECTIONS } from "@/types/export";

export const metadata: Metadata = { title: "Export Report — GameIQ" };

const STAFF_ROLES = ["owner", "coach", "analyst"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function confidenceLabel(level: ConfidenceLevel): string {
  return { high: "High Confidence", medium: "Medium Confidence", low: "Low Confidence" }[level];
}

function verificationLabel(status: VerificationStatus): string {
  return {
    unreviewed: "Unreviewed",
    accurate: "Accurate",
    partially_accurate: "Partially Accurate",
    inaccurate: "Inaccurate",
    edited: "Edited",
  }[status];
}

function parseSections(raw: string | undefined): ExportSectionOptions {
  if (!raw) return DEFAULT_EXPORT_SECTIONS;
  try {
    const parsed = JSON.parse(raw) as Partial<ExportSectionOptions>;
    return { ...DEFAULT_EXPORT_SECTIONS, ...parsed };
  } catch {
    return DEFAULT_EXPORT_SECTIONS;
  }
}

// ---------------------------------------------------------------------------
// Sub-components (server, no interactivity needed for print)
// ---------------------------------------------------------------------------

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 avoid-break">
      {title}
    </h2>
  );
}

function ConfidencePill({ level }: { level: ConfidenceLevel }) {
  const classes: Record<ConfidenceLevel, string> = {
    high: "bg-emerald-50 text-emerald-800 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classes[level]}`}>
      {confidenceLabel(level)}
    </span>
  );
}

function VerificationPill({
  status,
  isEdited,
}: {
  status: VerificationStatus;
  isEdited: boolean;
}) {
  if (status === "unreviewed" && !isEdited) return null;
  const classes: Record<VerificationStatus, string> = {
    unreviewed: "bg-slate-100 text-slate-500 border-slate-300",
    accurate: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partially_accurate: "bg-amber-50 text-amber-700 border-amber-200",
    inaccurate: "bg-red-50 text-red-700 border-red-200",
    edited: "bg-sky-50 text-sky-700 border-sky-200",
  };
  const display = isEdited ? "Edited" : verificationLabel(status);
  const resolvedStatus = isEdited ? "edited" : status;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${classes[resolvedStatus]}`}>
      {isEdited && <Edit3 className="h-2.5 w-2.5" />}
      {display}
    </span>
  );
}

function EvidenceItems({
  evidence,
  players,
}: {
  evidence: EvidenceItem[];
  players: Player[];
}) {
  if (evidence.length === 0) return null;
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <ul className="mt-2 space-y-1">
      {evidence.map((ev) => {
        const playerNames = (ev.playerIds ?? [])
          .map((id) => playerMap.get(id))
          .filter(Boolean)
          .map((p) => `${p!.displayName ?? p!.firstName}${p!.jerseyNumber ? ` #${p!.jerseyNumber}` : ""}`)
          .join(", ");

        return (
          <li key={ev.id} className="flex gap-2 text-xs text-slate-600">
            <span className="text-slate-400 shrink-0">·</span>
            <span>
              {ev.timestampSeconds !== undefined && (
                <strong className="text-slate-700 font-mono">
                  {formatSeconds(ev.timestampSeconds)} —{" "}
                </strong>
              )}
              <span className="font-medium text-slate-700">{ev.label}</span>
              {ev.description && ` — ${ev.description}`}
              {playerNames && (
                <span className="text-slate-500"> · {playerNames}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function InsightCard({
  insight,
  players,
  showVerification,
}: {
  insight: CoachingInsight;
  players: Player[];
  showVerification: boolean;
}) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const affectedNames = insight.affectedPlayerIds
    .map((id) => playerMap.get(id))
    .filter(Boolean)
    .map((p) => p!.displayName ?? p!.firstName)
    .join(", ");

  return (
    <div className="avoid-break rounded-lg border border-slate-200 bg-white p-5 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-sm font-bold text-slate-900">{insight.title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidencePill level={insight.confidence} />
          {showVerification && (
            <VerificationPill status={insight.verificationStatus} isEdited={insight.isEdited} />
          )}
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-3">{insight.summary}</p>

      {insight.whyItMatters && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Why it matters</p>
          <p className="text-sm text-slate-600">{insight.whyItMatters}</p>
        </div>
      )}

      {insight.recommendedAction && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommended action</p>
          <p className="text-sm font-medium text-slate-800">{insight.recommendedAction}</p>
        </div>
      )}

      {affectedNames && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
          <Users className="h-3 w-3 shrink-0" />
          {affectedNames}
        </p>
      )}

      <EvidenceItems evidence={insight.evidence} players={players} />

      {insight.assumptions.length > 0 && (
        <div className="mt-3 rounded border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-1">Assumptions</p>
          <ul className="space-y-0.5">
            {insight.assumptions.map((a, i) => (
              <li key={i} className="text-xs text-amber-800">· {a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlayerReportCard({
  report,
  showVerification,
}: {
  report: PlayerReport;
  showVerification: boolean;
}) {
  return (
    <div className="avoid-break rounded-lg border border-slate-200 bg-white p-5 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-sm font-bold text-slate-900">
          {report.playerDisplayName ?? "Unknown Player"}
        </h3>
        <div className="flex items-center gap-2">
          <ConfidencePill level={report.confidence} />
          {showVerification && (
            <VerificationPill status={report.verificationStatus} isEdited={report.isEdited} />
          )}
        </div>
      </div>

      {report.summary && (
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{report.summary}</p>
      )}

      <div className="grid grid-cols-2 gap-4 mb-3">
        {report.strengths.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Strengths</p>
            <ul className="space-y-1">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.improvementAreas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Improvement areas</p>
            <ul className="space-y-1">
              {report.improvementAreas.map((a, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report.recommendedFocus && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommended focus</p>
          <p className="text-sm font-medium text-slate-800">{report.recommendedFocus}</p>
        </div>
      )}

      {report.playerFacingSummary && (
        <div className="rounded border border-sky-100 bg-sky-50 px-3 py-2 mt-2">
          <p className="text-xs font-semibold text-sky-700 mb-1">Player-facing note</p>
          <p className="text-xs text-sky-900">{report.playerFacingSummary}</p>
        </div>
      )}

      {report.keyMoments.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Key moments</p>
          <ul className="space-y-1">
            {report.keyMoments.map((km, i) => (
              <li key={i} className="text-xs text-slate-600">
                · <strong className="text-slate-700">{km.description}</strong>
                {km.significance && ` — ${km.significance}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OpponentTendencyCard({
  tendency,
  showVerification,
}: {
  tendency: OpponentTendency;
  players: Player[];
  showVerification: boolean;
}) {
  return (
    <div className="avoid-break rounded-lg border border-slate-200 bg-white p-5 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <h3 className="text-sm font-bold text-slate-900">{tendency.title}</h3>
        <div className="flex items-center gap-2">
          <ConfidencePill level={tendency.confidence} />
          {showVerification && (
            <VerificationPill status={tendency.verificationStatus} isEdited={tendency.isEdited} />
          )}
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-3">{tendency.description}</p>

      {tendency.recommendedResponse && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommended response</p>
          <p className="text-sm font-medium text-slate-800">{tendency.recommendedResponse}</p>
        </div>
      )}

      {tendency.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tendency.tags.map((tag) => (
            <span key={tag} className="text-xs rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PracticeRecommendationCard({
  rec,
  players,
  showVerification,
}: {
  rec: PracticeRecommendation;
  players: Player[];
  showVerification: boolean;
}) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const playerNames = rec.playerIds
    .map((id) => playerMap.get(id))
    .filter(Boolean)
    .map((p) => p!.displayName ?? p!.firstName)
    .join(", ");

  return (
    <div className="avoid-break rounded-lg border border-slate-200 bg-white p-5 mb-4">
      <div className="flex items-start gap-4 mb-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-bold text-slate-600">
          {rec.priority}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
            <div className="flex items-center gap-2">
              <ConfidencePill level={rec.confidence} />
              {showVerification && (
                <VerificationPill status={rec.verificationStatus} isEdited={rec.isEdited} />
              )}
            </div>
          </div>
        </div>
      </div>

      {rec.drillName && (
        <p className="text-xs text-slate-500 mb-2">
          Drill: <strong className="text-slate-700">{rec.drillName}</strong>
          {rec.durationMinutes && ` · ${rec.durationMinutes} min`}
        </p>
      )}

      {rec.description && (
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{rec.description}</p>
      )}

      {rec.coachingPoints.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Coaching points</p>
          <ul className="space-y-1">
            {rec.coachingPoints.map((cp, i) => (
              <li key={i} className="text-xs text-slate-700">· {cp}</li>
            ))}
          </ul>
        </div>
      )}

      {playerNames && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
          <Users className="h-3 w-3 shrink-0" />
          {playerNames}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ExportReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string; gameId: string }>;
  searchParams: Promise<{ sections?: string }>;
}) {
  const { teamId, gameId } = await params;
  const { sections: sectionsParam } = await searchParams;

  const [team, membership, game] = await Promise.all([
    getTeamByIdForCurrentUser(teamId),
    getCurrentUserTeamMembership(teamId),
    getGameByIdForTeam(teamId, gameId),
  ]);

  if (!team || !membership) notFound();
  if (!game) notFound();

  // Only staff can access export view
  if (!STAFF_ROLES.includes(membership.role)) {
    redirect(`/teams/${teamId}/games/${gameId}/report`);
  }

  const [reportData, snapshot] = await Promise.all([
    getFullGameReportData(teamId, gameId),
    buildAnalysisInputSnapshot(teamId, gameId),
  ]);

  if (!reportData) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-slate-800 mb-2">No report available</h1>
        <p className="text-sm text-slate-500">
          Generate a report first, then export it.
        </p>
      </div>
    );
  }

  const sections = parseSections(sectionsParam);
  const { report, insights, playerReports, practiceRecommendations, opponentTendencies, players } =
    reportData;

  const basis = {
    eventCount: snapshot.events.length,
    hasVideo: snapshot.video !== null,
    rosterCount: snapshot.roster.length,
    hasCoachNotes: !!(snapshot.game.coachNotes?.trim()),
    hasOpponentNotes: !!(snapshot.game.opponentNotes?.trim()),
    videoFileName: snapshot.video?.fileName ?? null,
  };

  const opponentLabel = game.opponentName ? ` vs. ${game.opponentName}` : "";
  const dateLabel = game.gameDate
    ? new Date(game.gameDate).toLocaleDateString("en-US", { dateStyle: "long" })
    : null;
  const resultLabel =
    game.result && game.result.toLowerCase() !== "n/a" ? game.result : null;

  const backHref = `/teams/${teamId}/games/${gameId}/report`;

  // All evidence from insights and tendencies for the evidence section
  const allEvidence = [
    ...insights.flatMap((ins) => ins.evidence),
    ...opponentTendencies.flatMap((t) => t.evidence),
  ].filter((ev) => ev.timestampSeconds !== undefined);

  // Deduplicate by id
  const seenIds = new Set<string>();
  const uniqueEvidence = allEvidence.filter((ev) => {
    if (seenIds.has(ev.id)) return false;
    seenIds.add(ev.id);
    return true;
  });

  return (
    <>
      {/* Screen-only print controls */}
      <PrintControls
        reportTitle={`${game.title}${opponentLabel}`}
        sections={sections}
        generatedDate={report.createdAt}
        backHref={backHref}
      />

      {/* ── Print document ─────────────────────────────────────────────── */}
      <div className="text-slate-900 font-sans">

        {/* Cover header */}
        <div className="avoid-break mb-8 pb-6 border-b-2 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">GameIQ</span>
            <span className="ml-auto text-xs text-slate-400 uppercase tracking-wide">AI Report</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {game.title}{opponentLabel}
          </h1>
          <p className="text-base text-slate-600 mb-3">
            {team.name}
            {game.sport && ` · ${game.sport.charAt(0).toUpperCase() + game.sport.slice(1).replace("_", " ")}`}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 mb-4">
            {dateLabel && <span>{dateLabel}</span>}
            {resultLabel && <span>Result: {resultLabel}</span>}
            {game.venue && <span>Venue: {game.venue}</span>}
            {game.homeAway && game.homeAway !== "neutral" && (
              <span>{game.homeAway === "home" ? "Home" : "Away"}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
              report.overallConfidence === "high"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : report.overallConfidence === "medium"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}>
              {confidenceLabel(report.overallConfidence)}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              Report v{report.reportVersion}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              Generated {new Date(report.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
              Exported {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}
            </span>
          </div>
        </div>

        {/* Overview & Executive Summary */}
        {sections.includeOverview && (
          <div className="mb-8 avoid-break">
            <SectionHeading title="Executive Summary" />
            {report.executiveSummary ? (
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{report.executiveSummary}</p>
            ) : (
              <p className="text-sm text-slate-400 italic mb-4">No executive summary available.</p>
            )}

            {/* Report basis */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Report basis
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  {basis.eventCount} event{basis.eventCount !== 1 ? "s" : ""} tagged
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  {basis.rosterCount} player{basis.rosterCount !== 1 ? "s" : ""} on roster
                </div>
                <div className="flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  {basis.hasVideo
                    ? `Video uploaded${basis.videoFileName ? `: ${basis.videoFileName}` : ""}`
                    : "No video uploaded"}
                </div>
                {basis.hasCoachNotes && (
                  <div className="col-span-2 text-slate-500">Coach notes included</div>
                )}
                {basis.hasOpponentNotes && (
                  <div className="col-span-2 text-slate-500">Opponent notes included</div>
                )}
              </div>
              {basis.hasVideo && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  Timestamp references correspond to the uploaded video file.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Coaching Insights */}
        {sections.includeCoachingInsights && insights.length > 0 && (
          <div className="mb-8">
            <SectionHeading title={`Coaching Insights (${insights.length})`} />
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                players={players}
                showVerification={sections.includeVerificationStatus}
              />
            ))}
          </div>
        )}

        {/* Player Reports */}
        {sections.includePlayerReports && playerReports.length > 0 && (
          <div className="mb-8">
            <SectionHeading title={`Player Reports (${playerReports.length})`} />
            {playerReports.map((pr) => (
              <PlayerReportCard
                key={pr.id}
                report={pr}
                showVerification={sections.includeVerificationStatus}
              />
            ))}
          </div>
        )}

        {/* Opponent Tendencies */}
        {sections.includeOpponentTendencies && opponentTendencies.length > 0 && (
          <div className="mb-8">
            <SectionHeading title={`Opponent Tendencies (${opponentTendencies.length})`} />
            {opponentTendencies.map((t) => (
              <OpponentTendencyCard
                key={t.id}
                tendency={t}
                players={players}
                showVerification={sections.includeVerificationStatus}
              />
            ))}
          </div>
        )}

        {/* Practice Plan */}
        {sections.includePracticePlan && practiceRecommendations.length > 0 && (
          <div className="mb-8">
            <SectionHeading title={`Practice Plan (${practiceRecommendations.length} recommendations)`} />
            {practiceRecommendations.map((rec) => (
              <PracticeRecommendationCard
                key={rec.id}
                rec={rec}
                players={players}
                showVerification={sections.includeVerificationStatus}
              />
            ))}
          </div>
        )}

        {/* Evidence Summary */}
        {sections.includeEvidence && uniqueEvidence.length > 0 && (
          <div className="mb-8">
            <SectionHeading title="Key Moments &amp; Evidence" />
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500 mb-3">
                Timestamp references to the uploaded video. Use these to locate key moments for review.
              </p>
              <ul className="space-y-2">
                {uniqueEvidence
                  .sort((a, b) => (a.timestampSeconds ?? 0) - (b.timestampSeconds ?? 0))
                  .map((ev) => {
                    const playerMap = new Map(players.map((p) => [p.id, p]));
                    const playerNames = (ev.playerIds ?? [])
                      .map((id) => playerMap.get(id))
                      .filter(Boolean)
                      .map((p) => `${p!.displayName ?? p!.firstName}${p!.jerseyNumber ? ` #${p!.jerseyNumber}` : ""}`)
                      .join(", ");

                    return (
                      <li key={ev.id} className="flex gap-3 text-xs avoid-break">
                        <span className="font-mono font-bold text-slate-700 shrink-0 min-w-[3.5rem]">
                          {formatSeconds(ev.timestampSeconds ?? 0)}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-800">{ev.label}</span>
                          {ev.description && (
                            <span className="text-slate-600"> — {ev.description}</span>
                          )}
                          {playerNames && (
                            <span className="text-slate-500"> · {playerNames}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        )}

        {/* Assumptions & Limitations */}
        {sections.includeAssumptionsLimitations &&
          (report.assumptions.length > 0 || report.limitations.length > 0) && (
          <div className="mb-8 avoid-break">
            <SectionHeading title="Assumptions &amp; Limitations" />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs text-amber-700 mb-3">
                The following assumptions and limitations apply to this report. Confidence labels
                reflect how well each claim is supported by the available input data.
              </p>

              {report.assumptions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Assumptions</p>
                  <ul className="space-y-1">
                    {report.assumptions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-xs text-amber-900">
                        <span className="shrink-0">·</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.limitations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Limitations</p>
                  <ul className="space-y-1">
                    {report.limitations.map((l, i) => (
                      <li key={i} className="flex gap-2 text-xs text-amber-900">
                        <span className="shrink-0">·</span>
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document footer */}
        <div className="mt-10 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Generated with <strong className="text-slate-500">GameIQ</strong> — AI game review for serious teams. ·{" "}
            {report.aiGenerated ? "Mock AI mode (development)" : "AI-generated"} ·{" "}
            Report v{report.reportVersion}
          </p>
        </div>
      </div>
    </>
  );
}
