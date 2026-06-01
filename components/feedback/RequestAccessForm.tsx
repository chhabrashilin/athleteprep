"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FeedbackSuccessState } from "@/components/feedback/FeedbackSuccessState";
import { requestAccessAction, type RequestAccessFormState } from "@/app/request-access/actions";
import { ArrowRight } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "Head Coach", label: "Head Coach" },
  { value: "Assistant Coach", label: "Assistant Coach" },
  { value: "Analyst", label: "Analyst" },
  { value: "Player", label: "Player" },
  { value: "Team Captain", label: "Team Captain" },
  { value: "Program Director", label: "Program Director" },
  { value: "Scout", label: "Scout" },
  { value: "Investor/Advisor", label: "Investor / Advisor" },
  { value: "Other", label: "Other" },
];

const SPORT_OPTIONS = [
  { value: "Cricket", label: "Cricket" },
  { value: "Soccer", label: "Soccer" },
  { value: "Basketball", label: "Basketball" },
  { value: "American Football", label: "American Football" },
  { value: "Hockey", label: "Hockey" },
  { value: "Volleyball", label: "Volleyball" },
  { value: "Other", label: "Other" },
];

const LEVEL_OPTIONS = [
  { value: "Youth", label: "Youth" },
  { value: "High School", label: "High School" },
  { value: "College", label: "College" },
  { value: "Club", label: "Club" },
  { value: "Academy", label: "Academy" },
  { value: "Semi-Pro", label: "Semi-Pro" },
  { value: "Professional", label: "Professional" },
  { value: "Other", label: "Other" },
];

const FREQUENCY_OPTIONS = [
  { value: "After every game", label: "After every game" },
  { value: "Once a week", label: "Once a week" },
  { value: "A few times per season", label: "A few times per season" },
  { value: "Rarely", label: "Rarely" },
  { value: "Never", label: "Never" },
];

const initialState: RequestAccessFormState = {};

export function RequestAccessForm() {
  const [state, formAction, isPending] = useActionState(requestAccessAction, initialState);

  if (state.success) {
    return <FeedbackSuccessState type="access-request" />;
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.errors?.form && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.errors.form}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Name"
          name="name"
          required
          placeholder="Your name"
          error={state.errors?.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          error={state.errors?.email}
        />
      </div>

      <Select
        label="Your role"
        name="role"
        required
        placeholder="Select role..."
        options={ROLE_OPTIONS}
        error={state.errors?.role}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Team or organization (optional)"
          name="teamOrOrg"
          placeholder="e.g. Madison Falcons FC"
        />
        <Select
          label="Sport (optional)"
          name="sport"
          placeholder="Select sport..."
          options={SPORT_OPTIONS}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Level (optional)"
          name="level"
          placeholder="Select level..."
          options={LEVEL_OPTIONS}
        />
        <Select
          label="How often do you review game film? (optional)"
          name="filmReviewFrequency"
          placeholder="Select frequency..."
          options={FREQUENCY_OPTIONS}
        />
      </div>

      <Textarea
        label="Biggest film review pain point (optional)"
        name="painPoint"
        placeholder="e.g. Takes too long, player feedback is inconsistent..."
        className="min-h-20"
      />

      <Input
        label="Tools you use today (optional)"
        name="currentTools"
        placeholder="e.g. Hudl, Veo, Pixellot, spreadsheets, nothing"
      />

      <Textarea
        label="Anything else you want us to know? (optional)"
        name="message"
        placeholder="Questions, context, constraints..."
        className="min-h-20"
      />

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-500 leading-relaxed">
        Do not submit confidential player medical information or sensitive personal data. By
        submitting, you agree that we may use your responses to evaluate early product interest.
        Feedback is used to improve the GameIQ MVP.
      </div>

      <Button type="submit" loading={isPending} size="lg" className="w-full sm:w-auto">
        Submit request
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
