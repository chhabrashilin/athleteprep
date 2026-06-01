"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import type { GameFormState } from "@/app/teams/[teamId]/games/new/actions";
import type { Game } from "@/types/database";
import type { SportType } from "@/types/sports";

const SPORT_OPTIONS = [
  { value: "soccer",            label: "Soccer" },
  { value: "cricket",           label: "Cricket" },
  { value: "basketball",        label: "Basketball" },
  { value: "american_football", label: "American Football" },
  { value: "hockey",            label: "Hockey" },
  { value: "volleyball",        label: "Volleyball" },
  { value: "other",             label: "Other" },
];

const GAME_TYPE_OPTIONS = [
  { value: "match",        label: "Match" },
  { value: "practice",     label: "Practice" },
  { value: "scrimmage",    label: "Scrimmage" },
  { value: "film_session", label: "Film Session" },
];

const HOME_AWAY_OPTIONS = [
  { value: "home",           label: "Home" },
  { value: "away",           label: "Away" },
  { value: "neutral",        label: "Neutral" },
  { value: "not_applicable", label: "N/A" },
];

const RESULT_OPTIONS = [
  { value: "Win",        label: "Win" },
  { value: "Loss",       label: "Loss" },
  { value: "Draw",       label: "Draw" },
  { value: "Not played", label: "Not played" },
  { value: "N/A",        label: "N/A" },
];

type GameAction = (
  state: GameFormState,
  formData: FormData
) => Promise<GameFormState>;

interface GameFormProps {
  action: GameAction;
  mode: "create" | "edit";
  teamId: string;
  gameId?: string;
  defaultSport?: SportType;
  defaultValues?: Partial<Game>;
  cancelHref: string;
}

export function GameForm({
  action,
  mode,
  teamId,
  gameId,
  defaultSport,
  defaultValues,
  cancelHref,
}: GameFormProps) {
  const [state, formAction, isPending] = useActionState<GameFormState, FormData>(
    action,
    {}
  );

  const isEdit = mode === "edit";

  return (
    <div className="max-w-2xl space-y-5">
      {!isEdit && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm text-sky-300 font-medium mb-1">
            Starting your analysis
          </p>
          <p className="text-sm text-slate-400">
            Every AI report starts with a game or practice analysis record. Add
            context now so GameIQ can produce more accurate coaching insights later.
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {/* Hidden identifiers */}
        <input type="hidden" name="teamId" value={teamId} />
        {isEdit && gameId && (
          <input type="hidden" name="gameId" value={gameId} />
        )}

        {/* Form-level error */}
        {state.errors?.form && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{state.errors.form}</p>
          </div>
        )}

        {/* Section 1 — Analysis Type */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis type</CardTitle>
            <CardDescription>
              Required. Defines how GameIQ structures the analysis and report.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              label="Title *"
              name="title"
              placeholder="e.g. vs Riverside FC — League Match"
              maxLength={120}
              autoFocus={!isEdit}
              disabled={isPending}
              defaultValue={defaultValues?.title ?? ""}
              error={state.errors?.title}
              hint="A clear title helps you find this analysis later."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Sport *"
                name="sport"
                options={SPORT_OPTIONS}
                placeholder="Select sport"
                disabled={isPending}
                defaultValue={defaultValues?.sport ?? defaultSport ?? ""}
                error={state.errors?.sport}
              />
              <Select
                label="Session type *"
                name="gameType"
                options={GAME_TYPE_OPTIONS}
                placeholder="Select type"
                disabled={isPending}
                defaultValue={defaultValues?.gameType ?? ""}
                error={state.errors?.gameType}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Opponent & Context */}
        <Card>
          <CardHeader>
            <CardTitle>Opponent &amp; context</CardTitle>
            <CardDescription>
              Optional. Used in insights and player report headings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Opponent"
                name="opponentName"
                placeholder="e.g. Riverside FC"
                maxLength={120}
                disabled={isPending}
                defaultValue={defaultValues?.opponentName ?? ""}
                error={state.errors?.opponentName}
              />
              <Input
                label="Date"
                name="gameDate"
                type="date"
                disabled={isPending}
                defaultValue={defaultValues?.gameDate ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Home / Away"
                name="homeAway"
                options={HOME_AWAY_OPTIONS}
                disabled={isPending}
                defaultValue={defaultValues?.homeAway ?? "not_applicable"}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Venue"
                  name="venue"
                  placeholder="e.g. City Stadium"
                  maxLength={160}
                  disabled={isPending}
                  defaultValue={defaultValues?.venue ?? ""}
                  error={state.errors?.venue}
                />
              </div>
            </div>

            <Input
              label="Competition / league"
              name="competitionName"
              placeholder="e.g. Regional League — Spring 2026"
              maxLength={160}
              disabled={isPending}
              defaultValue={defaultValues?.competitionName ?? ""}
              error={state.errors?.competitionName}
            />
          </CardContent>
        </Card>

        {/* Section 3 — Score & Result */}
        <Card>
          <CardHeader>
            <CardTitle>Score &amp; result</CardTitle>
            <CardDescription>
              Optional. Can be added or updated after the game.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Your score"
                name="teamScore"
                placeholder="e.g. 2"
                maxLength={40}
                disabled={isPending}
                defaultValue={defaultValues?.teamScore ?? ""}
                error={state.errors?.teamScore}
              />
              <Input
                label="Opponent score"
                name="opponentScore"
                placeholder="e.g. 1"
                maxLength={40}
                disabled={isPending}
                defaultValue={defaultValues?.opponentScore ?? ""}
                error={state.errors?.opponentScore}
              />
              <Select
                label="Result"
                name="result"
                options={RESULT_OPTIONS}
                placeholder="Select result"
                disabled={isPending}
                defaultValue={defaultValues?.result ?? ""}
              />
            </div>
            <Textarea
              label="Summary notes"
              name="summaryNotes"
              placeholder="Brief overall summary of the session…"
              maxLength={1500}
              disabled={isPending}
              defaultValue={defaultValues?.summaryNotes ?? ""}
              error={state.errors?.summaryNotes}
              hint="High-level notes visible at the top of the report."
            />
          </CardContent>
        </Card>

        {/* Section 4 — Notes for AI */}
        <Card>
          <CardHeader>
            <CardTitle>Notes for AI</CardTitle>
            <CardDescription>
              Coach notes and opponent notes become evidence for the AI report.
              More detail = better insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              label="Coach notes"
              name="coachNotes"
              placeholder="What did you observe? Key tactical issues, standout moments, patterns…"
              maxLength={4000}
              disabled={isPending}
              defaultValue={defaultValues?.coachNotes ?? ""}
              error={state.errors?.coachNotes}
              hint="Used directly as context for coaching insights and player reports."
            />
            <Textarea
              label="Opponent notes"
              name="opponentNotes"
              placeholder="Observed opponent patterns, tendencies, strengths, set pieces…"
              maxLength={4000}
              disabled={isPending}
              defaultValue={defaultValues?.opponentNotes ?? ""}
              error={state.errors?.opponentNotes}
              hint="Used to generate the Opponent Tendencies section of the report."
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1"
            loading={isPending}
            disabled={isPending}
          >
            {isPending
              ? isEdit ? "Saving…" : "Creating…"
              : isEdit ? "Save changes" : "Create analysis"}
          </Button>
          <Link href={cancelHref}>
            <Button type="button" variant="ghost" disabled={isPending}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
