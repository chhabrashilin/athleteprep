import { AppShell } from "@/components/layout/AppShell";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { CricketStatusBadge } from "@/components/cricket/CricketStatusBadge";
import type { CricketModuleStatus } from "@/components/cricket/CricketStatusBadge";
import type { ReactNode } from "react";

interface CricketPlaceholderPageProps {
  title: string;
  description: string;
  /** What will be built in this module. */
  comingSoonDescription: string;
  status: CricketModuleStatus;
  icon?: ReactNode;
  /** If true, the module is behind a disabled feature flag. Shows a flag notice. */
  behindFlag?: boolean;
  flagName?: string;
}

export function CricketPlaceholderPage({
  title,
  description,
  comingSoonDescription,
  status,
  icon,
  behindFlag,
  flagName,
}: CricketPlaceholderPageProps) {
  return (
    <AppShell>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        <CricketStatusBadge status={status} />
      </div>
      <p className="mb-6 text-sm text-slate-400">{description}</p>

      {behindFlag && flagName && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3">
          <p className="text-sm text-amber-400 font-medium">Feature flag disabled</p>
          <p className="text-xs text-slate-500 mt-1">
            This module requires{" "}
            <code className="text-amber-400">{flagName}=true</code> to be enabled.
            Set the environment variable and redeploy to unlock it.
          </p>
        </div>
      )}

      <CricketEmptyState
        icon={icon}
        title={
          status === "foundation_ready"
            ? `${title} — Foundation Ready`
            : `${title} — Coming Soon`
        }
        description={comingSoonDescription}
        backHref="/cricket"
        backLabel="Back to Cricket Hub"
      />
    </AppShell>
  );
}
