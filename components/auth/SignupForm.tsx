"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/auth/redirect";

// Basic RFC 5322-compatible email check without a library.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupFormProps {
  redirectTo?: string;
}

export function SignupForm({ redirectTo }: SignupFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    const name = fullName.trim();
    if (!name) return "Please enter your name.";
    if (name.length < 2) return "Name must be at least 2 characters.";
    if (name.length > 100) return "Name must be 100 characters or fewer.";

    if (!email.trim()) return "Please enter your email address.";
    if (!EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";

    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setError(
        "GameIQ is not connected to a database yet. Add your Supabase credentials to .env.local to enable sign-up. See /docs/SUPABASE_SETUP.md."
      );
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Unable to connect to authentication service.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect(redirectTo))}`,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError(
          "An account with this email already exists. Try signing in instead."
        );
      } else if (authError.message.includes("Password should be")) {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Session created immediately (email confirmation disabled) → go to dashboard.
    if (data.session) {
      router.push(safeRedirect(redirectTo));
      router.refresh();
      return;
    }

    // Email confirmation required.
    setSuccessMessage(
      "Account created! Check your email inbox for a confirmation link, then sign in."
    );
    setLoading(false);
  }

  if (successMessage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-4 py-4 text-sm text-emerald-400">
          {successMessage}
        </div>
        <Link href="/auth/login">
          <Button variant="secondary" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <Input
        label="Your name"
        type="text"
        placeholder="Coach Johnson"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={loading}
        required
      />

      <Input
        label="Email address"
        type="email"
        placeholder="coach@yourteam.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
        hint="Minimum 8 characters"
      />

      <Input
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        required
      />

      <Button type="submit" className="w-full mt-1" loading={loading} disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
