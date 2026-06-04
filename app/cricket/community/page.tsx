import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { isCricketSocialEnabled } from "@/lib/config/feature-flags";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Community — Cricket Hub — GameIQ" };

export default function CricketCommunityPage() {
  const enabled = isCricketSocialEnabled();

  return (
    <CricketPlaceholderPage
      title="Community"
      description="Cricket social feed, fan polls, match discussions, news, and trivia."
      comingSoonDescription="The community hub will bring together match discussions, fan polls, cricket news, and player trivia in one place. Requires NEXT_PUBLIC_CRICKET_SOCIAL_ENABLED=true."
      status="coming_soon"
      icon={<MessageSquare className="h-6 w-6" />}
      behindFlag={!enabled}
      flagName="NEXT_PUBLIC_CRICKET_SOCIAL_ENABLED"
    />
  );
}
