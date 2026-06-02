"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { submitSupportRequestAction, type SupportFormState } from "@/app/support/actions";

const ISSUE_TYPE_OPTIONS = [
  { value: "account_login", label: "Account / Login issue" },
  { value: "team_workspace", label: "Team workspace issue" },
  { value: "video_upload", label: "Video upload issue" },
  { value: "ai_report", label: "AI report issue" },
  { value: "share_export", label: "Share / Export issue" },
  { value: "data_deletion", label: "Data deletion request" },
  { value: "privacy_concern", label: "Privacy concern" },
  { value: "bug_report", label: "Bug report" },
  { value: "product_feedback", label: "Product feedback" },
  { value: "other", label: "Other" },
];

const URGENCY_OPTIONS = [
  { value: "low", label: "Low — not blocking me" },
  { value: "normal", label: "Normal — would like help soon" },
  { value: "high", label: "High — blocking my work" },
];

const initialState: SupportFormState = {};

function SuccessState() {
  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center space-y-4">
      <div className="flex justify-center">
        <CheckCircle className="h-10 w-10 text-green-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Request received</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Thanks — this support request has been recorded for the GameIQ pilot team to review.
        </p>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          GameIQ is a pilot MVP operated by a small founding team. Responses are not automated —
          the founder will review your request and follow up directly if you consented to contact.
          We aim to respond within 1–2 business days.
        </p>
      </div>
    </div>
  );
}

export function SupportForm() {
  const [state, formAction, isPending] = useActionState(submitSupportRequestAction, initialState);

  if (state.success) return <SuccessState />;

  return (
    <form action={formAction} className="space-y-6">
      {state.errors?.form && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.errors.form}
        </div>
      )}

      {/* Identity */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Your name *"
          name="name"
          placeholder="Coach Alex Rivera"
          required
          error={state.errors?.name}
        />
        <Input
          label="Email address *"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          error={state.errors?.email}
        />
      </div>

      {/* Issue type */}
      <Select
        label="Issue type *"
        name="issueType"
        placeholder="Select an issue type..."
        options={ISSUE_TYPE_OPTIONS}
        error={state.errors?.issueType}
      />

      {/* Optional context */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Team name (optional)"
          name="teamName"
          placeholder="e.g. Madison Cricket XI"
        />
        <Select
          label="Urgency (optional)"
          name="urgency"
          placeholder="Select urgency..."
          options={URGENCY_OPTIONS}
        />
      </div>

      <Input
        label="Related page or link (optional)"
        name="relatedUrl"
        type="url"
        placeholder="https://gameiq.app/teams/..."
      />

      {/* Message */}
      <Textarea
        label="Describe your issue *"
        name="message"
        required
        placeholder="What happened? What did you expect to happen? What steps did you take?"
        className="min-h-32"
        error={state.errors?.message}
      />

      {/* Consent */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="consentToContact"
          name="consentToContact"
          value="true"
          defaultChecked
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
        />
        <label htmlFor="consentToContact" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
          I consent to being contacted about this request via the email address above.
        </label>
      </div>

      {/* Notice */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-500 leading-relaxed">
        This is a pilot MVP. Responses are not automated — the founding team reviews all support
        requests manually. Do not include passwords, payment information, or sensitive health data
        in your message.
      </div>

      <Button type="submit" loading={isPending} size="lg" className="w-full sm:w-auto">
        Submit request
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
