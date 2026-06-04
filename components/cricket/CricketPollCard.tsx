"use client";

import { useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import type { CricketPoll } from "@/lib/cricket/polls/queries";
import type { PollResults } from "@/lib/cricket/validation/polls";
import { voteInCricketPoll } from "@/lib/cricket/polls/actions";

interface Props {
  poll: CricketPoll;
  results?: PollResults | null;
  canVote?: boolean;
  initialVotedOptionIds?: string[];
}

function formatClose(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d < now) return "Poll closed";
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `Closes in ${hours}h`;
    return `Closes ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  } catch {
    return iso;
  }
}

export function CricketPollCard({ poll, results, canVote = false, initialVotedOptionIds = [] }: Props) {
  const [votedIds, setVotedIds] = useState<string[]>(initialVotedOptionIds);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localResults, setLocalResults] = useState<PollResults | null>(results ?? null);

  const hasVoted = votedIds.length > 0;
  const isClosed = poll.status === "closed" || poll.status === "archived";
  const showResults =
    hasVoted || isClosed || (results?.total_votes ?? 0) > 0 && poll.showResultsBeforeClose;

  function toggleOption(optionId: string) {
    if (poll.allowMultipleVotes) {
      setSelected((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  }

  async function handleVote(e: React.FormEvent) {
    e.preventDefault();
    if (!selected.length || submitting || !canVote) return;
    setSubmitting(true);
    setError(null);

    const result = await voteInCricketPoll(poll.id, selected);
    setSubmitting(false);

    if (result.success) {
      setVotedIds(selected);
      setSelected([]);
    } else {
      setError(result.error ?? "Failed to vote");
    }
  }

  const totalVotes = localResults?.total_votes ?? 0;

  return (
    <div
      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
      aria-label={`Poll: ${poll.question}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-200">{poll.question}</h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {poll.closesAt && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatClose(poll.closesAt)}
            </span>
          )}
          {isClosed && (
            <span className="text-xs text-slate-500 font-medium">Closed</span>
          )}
        </div>
      </div>

      {showResults ? (
        <CricketPollResults results={localResults} votedIds={votedIds} />
      ) : (
        <form onSubmit={handleVote} aria-label="Cast vote">
          <div className="space-y-2" role="group" aria-labelledby={`poll-q-${poll.id}`}>
            {(poll.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors ${
                  selected.includes(opt.id)
                    ? "border-sky-500/50 bg-sky-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <input
                  type={poll.allowMultipleVotes ? "checkbox" : "radio"}
                  name={`poll-${poll.id}`}
                  value={opt.id}
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleOption(opt.id)}
                  className="sr-only"
                  aria-label={opt.optionText}
                />
                <span
                  className={`h-4 w-4 shrink-0 rounded-${poll.allowMultipleVotes ? "sm" : "full"} border-2 flex items-center justify-center ${
                    selected.includes(opt.id)
                      ? "border-sky-500 bg-sky-500"
                      : "border-slate-500"
                  }`}
                  aria-hidden="true"
                >
                  {selected.includes(opt.id) && (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </span>
                <span className="text-sm text-slate-300">{opt.optionText}</span>
              </label>
            ))}
          </div>

          {error && <p className="mt-2 text-xs text-rose-400" role="alert">{error}</p>}

          {canVote && (
            <button
              type="submit"
              disabled={!selected.length || submitting}
              className="mt-3 w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Voting…" : "Vote"}
            </button>
          )}

          {!canVote && (
            <p className="mt-2 text-xs text-slate-500">Sign in to vote in this poll.</p>
          )}
        </form>
      )}

      <p className="mt-3 text-xs text-slate-600">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}

export function CricketPollResults({
  results,
  votedIds = [],
}: {
  results: PollResults | null;
  votedIds?: string[];
}) {
  if (!results) {
    return <p className="text-xs text-slate-500">Results are not available.</p>;
  }

  return (
    <div className="space-y-2" role="list" aria-label="Poll results">
      {results.options.map((opt) => {
        const voted = votedIds.includes(opt.option_id);
        return (
          <div key={opt.option_id} role="listitem" aria-label={`${opt.option_text}: ${opt.percentage}%`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`text-slate-300 ${voted ? "font-semibold text-sky-300" : ""}`}>
                {opt.option_text}
                {voted && <span className="ml-1 text-sky-400" aria-label="Your vote">✓</span>}
              </span>
              <span className="text-slate-500 tabular-nums">{opt.percentage}%</span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={opt.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${opt.percentage}% of votes`}
            >
              <div
                className={`h-full rounded-full transition-all ${voted ? "bg-sky-500" : "bg-slate-500"}`}
                style={{ width: `${opt.percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
