"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RatingInput } from "@/components/feedback/RatingInput";
import { FeedbackSuccessState } from "@/components/feedback/FeedbackSuccessState";
import {
  submitProductFeedbackAction,
  type ProductFeedbackFormState,
} from "@/app/feedback/actions";
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

const WTP_OPTIONS = [
  { value: "Not sure yet", label: "Not sure yet" },
  { value: "$10–$25/month per team", label: "$10–$25 / month per team" },
  { value: "$25–$75/month per team", label: "$25–$75 / month per team" },
  { value: "$75–$200/month per team", label: "$75–$200 / month per team" },
  { value: "$200+/month per team", label: "$200+ / month per team" },
  { value: "Enterprise/program pricing only", label: "Enterprise / program pricing only" },
];

const YES_NO_OPTIONS = [
  { value: "Yes, after every game", label: "Yes, after every game" },
  { value: "Yes, for important games", label: "Yes, for important games" },
  { value: "Maybe, depends on complexity", label: "Maybe — depends on the workflow" },
  { value: "Probably not", label: "Probably not" },
];

const initialState: ProductFeedbackFormState = {};

export function ProductFeedbackForm() {
  const [state, formAction, isPending] = useActionState(submitProductFeedbackAction, initialState);
  const [anonymous, setAnonymous] = useState(false);

  if (state.success) {
    return <FeedbackSuccessState type="product-feedback" />;
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.errors?.form && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.errors.form}
        </div>
      )}

      {/* Identity */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
            />
            Submit anonymously
          </label>
        </div>

        {!anonymous && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Name (optional)"
              name="name"
              placeholder="Your name"
            />
            <Input
              label="Email (optional)"
              name="email"
              type="email"
              placeholder="you@example.com"
            />
          </div>
        )}
      </div>

      {/* Context */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Select
          label="Your role (optional)"
          name="role"
          placeholder="Select role..."
          options={ROLE_OPTIONS}
          error={state.errors?.role}
        />
        <Select
          label="Sport (optional)"
          name="sport"
          placeholder="Select sport..."
          options={SPORT_OPTIONS}
        />
        <Input
          label="Team or org (optional)"
          name="teamOrOrg"
          placeholder="e.g. Madison Falcons FC"
        />
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">
          Overall usefulness <span className="text-red-400">*</span>
        </p>
        <RatingInput
          name="usefulnessRating"
          error={state.errors?.usefulnessRating}
        />
      </div>

      {/* Core questions */}
      <Textarea
        label="What felt most valuable? *"
        name="mostValuable"
        required
        placeholder="e.g. Evidence-linked insights, player feedback format, confidence scores..."
        className="min-h-24"
        error={state.errors?.mostValuable}
      />

      <Textarea
        label="What felt confusing or unnecessary? (optional)"
        name="mostConfusing"
        placeholder="e.g. Too many steps, unclear labels, the assumptions section..."
        className="min-h-20"
      />

      <Textarea
        label="What feature would make this worth paying for? *"
        name="mustHaveFeature"
        required
        placeholder="e.g. Season-level trends, automated tagging, shareable player links..."
        className="min-h-20"
        error={state.errors?.mustHaveFeature}
      />

      {/* Optional depth questions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Would you use this after real games? (optional)"
          name="wouldUseAfterGames"
          placeholder="Select..."
          options={YES_NO_OPTIONS}
        />
        <Input
          label="What tool do you use today? (optional)"
          name="currentTools"
          placeholder="e.g. Hudl, Veo, spreadsheets, nothing"
        />
      </div>

      <Select
        label="Willingness to pay (research only, not a commitment) (optional)"
        name="willingnessToPay"
        placeholder="Select range..."
        options={WTP_OPTIONS}
      />

      <Textarea
        label="Anything else? (optional)"
        name="additionalNotes"
        placeholder="Honest reactions, edge cases, missing context, anything..."
        className="min-h-20"
      />

      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-500 leading-relaxed">
        Do not submit confidential player medical information or sensitive personal data. Feedback
        is used to improve the GameIQ MVP. We will not sell or share your responses.
      </div>

      <Button type="submit" loading={isPending} size="lg" className="w-full sm:w-auto">
        Submit feedback
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
