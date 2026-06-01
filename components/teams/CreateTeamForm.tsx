"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { createTeamAction, type CreateTeamFormState } from "@/app/teams/new/actions";

const SPORT_OPTIONS = [
  { value: "soccer",            label: "Soccer" },
  { value: "cricket",           label: "Cricket" },
  { value: "basketball",        label: "Basketball" },
  { value: "american_football", label: "American Football" },
  { value: "hockey",            label: "Hockey" },
  { value: "volleyball",        label: "Volleyball" },
  { value: "other",             label: "Other" },
];

const LEVEL_OPTIONS = [
  { value: "College",          label: "College" },
  { value: "High School Varsity", label: "High School Varsity" },
  { value: "Academy",         label: "Academy" },
  { value: "Club",            label: "Club" },
  { value: "Semi-Pro",        label: "Semi-Pro" },
  { value: "Amateur",         label: "Amateur" },
  { value: "Professional",    label: "Professional" },
  { value: "Other",           label: "Other" },
];

const initialState: CreateTeamFormState = {};

export function CreateTeamForm() {
  const [state, formAction, isPending] = useActionState(
    createTeamAction,
    initialState
  );

  return (
    <div className="max-w-lg">
      {/* Context banner */}
      <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-sm text-sky-300 font-medium mb-1">Your team workspace</p>
        <p className="text-sm text-slate-400">
          Create a workspace for your team&apos;s film, roster, game analysis,
          and AI-generated reports. You&apos;ll be added as the team owner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team details</CardTitle>
          <CardDescription>
            Required fields are marked. Optional fields improve your AI reports.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="flex flex-col gap-5">
            {/* Form-level error */}
            {state.errors?.form && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-400">{state.errors.form}</p>
              </div>
            )}

            {/* Team name */}
            <Input
              label="Team name *"
              name="name"
              placeholder="e.g. Madison FC U18"
              maxLength={80}
              autoFocus
              disabled={isPending}
              error={state.errors?.name}
            />

            {/* Sport */}
            <Select
              label="Primary sport *"
              name="sport"
              options={SPORT_OPTIONS}
              placeholder="Select a sport"
              disabled={isPending}
              error={state.errors?.sport}
            />

            <hr className="border-slate-800" />

            {/* Optional fields */}
            <Input
              label="Organization name"
              name="organizationName"
              placeholder="e.g. University of Wisconsin Athletics"
              maxLength={120}
              disabled={isPending}
              error={state.errors?.organizationName}
              hint="School, club, or organization this team belongs to"
            />

            <Select
              label="Team level"
              name="level"
              options={LEVEL_OPTIONS}
              placeholder="Select a level (optional)"
              disabled={isPending}
              error={state.errors?.level}
            />

            <Input
              label="Location"
              name="location"
              placeholder="e.g. Madison, WI"
              maxLength={120}
              disabled={isPending}
              error={state.errors?.location}
            />

            <Textarea
              label="Description"
              name="description"
              placeholder="e.g. 2024 Fall Season — U18 competitive division"
              maxLength={500}
              disabled={isPending}
              error={state.errors?.description}
              hint="Optional. Appears on your team workspace."
            />

            <div className="flex gap-3 mt-2">
              <Button
                type="submit"
                className="flex-1"
                loading={isPending}
                disabled={isPending}
              >
                {isPending ? "Creating team…" : "Create team"}
              </Button>
              <Link href="/teams">
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
