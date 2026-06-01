import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Shield, Bell, Key } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
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

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
          <p className="text-sm text-sky-400 font-medium mb-1">Phase 1 — Settings</p>
          <p className="text-sm text-slate-400">
            Settings will be fully functional once Supabase auth is implemented. Profile updates,
            password changes, and notification preferences will be wired in the next build step.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
