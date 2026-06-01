import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Shield, Bell, Key, TrendingUp, MessageSquare } from "lucide-react";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export default async function SettingsPage() {
  const user = await getServerUser();
  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(user?.email?.toLowerCase() ?? "");

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Manage your account and workspace preferences."
      />

      <div className="max-w-2xl space-y-5">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-sky-400" />
              Profile
            </CardTitle>
            <CardDescription>Your personal account information.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input label="Full name" placeholder="Your name" disabled />
            <Input label="Email" type="email" placeholder="your@email.com" disabled />
            <Button variant="secondary" size="sm" className="self-start" disabled>
              Update profile
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4 text-sky-400" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and account security.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input label="Current password" type="password" placeholder="••••••••" disabled />
            <Input label="New password" type="password" placeholder="••••••••" disabled />
            <Button variant="secondary" size="sm" className="self-start" disabled>
              Change password
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-400" />
              Notifications
            </CardTitle>
            <CardDescription>Control when and how you receive updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Notification preferences coming in Phase 7.</p>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Shield className="h-4 w-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" disabled>
              Delete account
            </Button>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5">
          <p className="text-sm text-slate-400 font-medium mb-1">Settings — coming soon</p>
          <p className="text-sm text-slate-500">
            Profile editing, password change, and notification preferences are on the roadmap.
            Use the Supabase dashboard to update your email or password in the meantime.
          </p>
        </div>

        {/* Admin links — only shown to admins */}
        {isAdmin && (
          <div className="rounded-xl border border-sky-800/40 bg-sky-900/10 p-5">
            <p className="text-sm font-semibold text-sky-300 mb-3">Founder Admin</p>
            <p className="text-xs text-slate-500 mb-4">
              These pages are only visible to emails listed in{" "}
              <code className="text-sky-400">ADMIN_EMAILS</code>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/analytics">
                <Button variant="secondary" size="sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Analytics
                </Button>
              </Link>
              <Link href="/admin/feedback">
                <Button variant="secondary" size="sm">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Feedback &amp; Access Requests
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
