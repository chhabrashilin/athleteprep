import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bell, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AppHeaderProps {
  title?: string;
  user?: User | null;
}

export function AppHeader({ title, user }: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Button variant="ghost" size="sm" aria-label="Notifications" disabled>
              <Bell className="h-4 w-4" />
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="sm" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/logout">
              <Button variant="secondary" size="sm">
                Sign out
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="secondary" size="sm">Sign in</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
