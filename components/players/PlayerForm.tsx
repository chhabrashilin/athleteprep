"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import type { PlayerFormState } from "@/app/teams/[teamId]/players/new/actions";
import type { Player } from "@/types/database";

const STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "inactive",  label: "Inactive" },
  { value: "injured",   label: "Injured" },
  { value: "graduated", label: "Graduated" },
  { value: "archived",  label: "Archived" },
];

const DOMINANT_SIDE_OPTIONS = [
  { value: "Right",    label: "Right" },
  { value: "Left",     label: "Left" },
  { value: "Both",     label: "Both" },
  { value: "Unknown",  label: "Unknown / Not specified" },
];

const ROLE_SUGGESTIONS = [
  "Captain",
  "Starter",
  "Substitute",
  "Development",
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
  "Wicketkeeper",
  "Bowler",
  "Batter",
  "All-rounder",
];

type PlayerAction = (
  state: PlayerFormState,
  formData: FormData
) => Promise<PlayerFormState>;

interface PlayerFormProps {
  action: PlayerAction;
  mode: "create" | "edit";
  teamId: string;
  playerId?: string;
  defaultValues?: Partial<Player>;
  cancelHref: string;
}

export function PlayerForm({
  action,
  mode,
  teamId,
  playerId,
  defaultValues,
  cancelHref,
}: PlayerFormProps) {
  const [state, formAction, isPending] = useActionState<
    PlayerFormState,
    FormData
  >(action, {});

  const isEdit = mode === "edit";

  return (
    <div className="max-w-2xl">
      {!isEdit && (
        <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm text-sky-300 font-medium mb-1">
            Building your roster
          </p>
          <p className="text-sm text-slate-400">
            Player data powers player-specific AI feedback, insight references,
            and next-practice recommendations. Add basic info now — you can
            always edit later.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit player" : "Add player"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update this player's profile information."
              : "First name is required. All other fields are optional but improve AI report quality."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="flex flex-col gap-5">
            {/* Hidden identifiers */}
            <input type="hidden" name="teamId" value={teamId} />
            {isEdit && playerId && (
              <input type="hidden" name="playerId" value={playerId} />
            )}

            {/* Form-level error */}
            {state.errors?.form && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">{state.errors.form}</p>
              </div>
            )}

            {/* Name section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First name *"
                name="firstName"
                placeholder="e.g. Marcus"
                maxLength={60}
                autoFocus={!isEdit}
                disabled={isPending}
                defaultValue={defaultValues?.firstName ?? ""}
                error={state.errors?.firstName}
              />
              <Input
                label="Last name"
                name="lastName"
                placeholder="e.g. Johnson"
                maxLength={60}
                disabled={isPending}
                defaultValue={defaultValues?.lastName ?? ""}
                error={state.errors?.lastName}
              />
            </div>

            <Input
              label="Display name"
              name="displayName"
              placeholder="Auto-generated from first + last if blank"
              maxLength={100}
              disabled={isPending}
              defaultValue={defaultValues?.displayName ?? ""}
              error={state.errors?.displayName}
              hint="Used throughout GameIQ. Defaults to first + last name."
            />

            <hr className="border-slate-800" />

            {/* Player details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Jersey number"
                name="jerseyNumber"
                placeholder="e.g. 10"
                maxLength={10}
                disabled={isPending}
                defaultValue={defaultValues?.jerseyNumber ?? ""}
                error={state.errors?.jerseyNumber}
              />
              <Input
                label="Position"
                name="position"
                placeholder="e.g. Midfielder, Point Guard"
                maxLength={60}
                disabled={isPending}
                defaultValue={defaultValues?.position ?? ""}
                error={state.errors?.position}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Role
                </label>
                <input
                  list="role-suggestions"
                  name="role"
                  placeholder="e.g. Captain, Starter"
                  maxLength={80}
                  disabled={isPending}
                  defaultValue={defaultValues?.role ?? ""}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
                <datalist id="role-suggestions">
                  {ROLE_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
                {state.errors?.role && (
                  <p className="text-xs text-red-400">{state.errors.role}</p>
                )}
              </div>

              <Select
                label="Dominant side"
                name="dominantSide"
                options={DOMINANT_SIDE_OPTIONS}
                placeholder="Not specified"
                disabled={isPending}
                defaultValue={defaultValues?.dominantSide ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Class year"
                name="classYear"
                placeholder="e.g. 2025"
                maxLength={10}
                disabled={isPending}
                defaultValue={defaultValues?.classYear ?? ""}
              />
              <Input
                label="Height"
                name="height"
                placeholder="e.g. 6ft 2in"
                maxLength={20}
                disabled={isPending}
                defaultValue={defaultValues?.height ?? ""}
              />
              <Input
                label="Weight"
                name="weight"
                placeholder="e.g. 185 lbs"
                maxLength={20}
                disabled={isPending}
                defaultValue={defaultValues?.weight ?? ""}
              />
            </div>

            <Select
              label="Status"
              name="status"
              options={STATUS_OPTIONS}
              disabled={isPending}
              defaultValue={defaultValues?.status ?? "active"}
            />

            <Textarea
              label="Notes"
              name="notes"
              placeholder="Optional coaching notes about this player…"
              maxLength={1000}
              disabled={isPending}
              defaultValue={defaultValues?.notes ?? ""}
              error={state.errors?.notes}
              hint="Internal notes. Not visible to players in v1."
            />

            <div className="flex gap-3 mt-2">
              <Button
                type="submit"
                className="flex-1"
                loading={isPending}
                disabled={isPending}
              >
                {isPending
                  ? isEdit
                    ? "Saving…"
                    : "Adding player…"
                  : isEdit
                  ? "Save changes"
                  : "Add player"}
              </Button>
              <Link href={cancelHref}>
                <Button type="button" variant="ghost" disabled={isPending}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
