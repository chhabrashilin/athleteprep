/**
 * tests/components/broadcast-control-room.test.tsx
 * UI tests for the BroadcastControlRoom component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BroadcastControlRoom } from "@/components/cricket/BroadcastControlRoom";
import type { CricketMatchStream, CricketBroadcastChecklist } from "@/lib/cricket/types";

// Mock server actions.
vi.mock("@/lib/cricket/streaming/actions", () => ({
  createOrUpdateMatchStream: vi.fn().mockResolvedValue({ success: true }),
  updateMatchStreamStatus: vi.fn().mockResolvedValue({ success: true }),
  initializeBroadcastChecklist: vi.fn().mockResolvedValue({ success: true }),
  updateBroadcastChecklistItem: vi.fn().mockResolvedValue({ success: true }),
  recordStreamHealthCheck: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/cricket/overlays/actions", () => ({
  createOverlayToken: vi.fn().mockResolvedValue({ success: true, data: { id: "tok-1", rawToken: "abc123", overlayUrls: {} } }),
  revokeOverlayToken: vi.fn().mockResolvedValue({ success: true }),
}));

const MATCH_ID = "match-id-1";
const LEAGUE_ID = "league-id-1";

const mockStream: CricketMatchStream = {
  id: "stream-id-1",
  matchId: MATCH_ID,
  leagueId: LEAGUE_ID,
  channelId: null,
  title: "Test Live Stream",
  description: null,
  status: "ready",
  provider: "overlay_only",
  publicWatchUrl: null,
  embedUrl: null,
  scheduledStart: null,
  actualStart: null,
  actualEnd: null,
  visibility: "league",
  allowPublicEmbed: false,
  overlayThemeId: null,
  streamOperatorUserId: null,
  createdBy: null,
  createdAt: "2026-06-04T00:00:00Z",
  updatedAt: "2026-06-04T00:00:00Z",
};

const mockChecklist: CricketBroadcastChecklist[] = [
  {
    id: "c1",
    matchId: MATCH_ID,
    matchStreamId: null,
    checklistKey: "match_setup_complete",
    label: "Match setup complete",
    completed: true,
    completedBy: null,
    completedAt: null,
    sortOrder: 0,
    createdAt: "2026-06-04T00:00:00Z",
    updatedAt: "2026-06-04T00:00:00Z",
  },
  {
    id: "c2",
    matchId: MATCH_ID,
    matchStreamId: null,
    checklistKey: "overlay_url_copied",
    label: "Overlay URL copied",
    completed: false,
    completedBy: null,
    completedAt: null,
    sortOrder: 4,
    createdAt: "2026-06-04T00:00:00Z",
    updatedAt: "2026-06-04T00:00:00Z",
  },
];

function renderComponent(props = {}) {
  return render(
    <BroadcastControlRoom
      matchId={MATCH_ID}
      matchSlug="test-match"
      matchTitle="Home XI vs Away XI"
      leagueId={LEAGUE_ID}
      stream={mockStream}
      tokens={[]}
      checklist={mockChecklist}
      events={[]}
      latestHealth={null}
      themes={[]}
      {...props}
    />
  );
}

describe("BroadcastControlRoom", () => {
  it("renders stream setup section", () => {
    renderComponent();
    expect(screen.getByText("Stream Setup")).toBeDefined();
  });

  it("renders overlay URL section", () => {
    renderComponent();
    expect(screen.getByText("OBS / vMix Overlay URLs")).toBeDefined();
  });

  it("renders checklist section", () => {
    renderComponent();
    expect(screen.getByText("Broadcast Checklist")).toBeDefined();
  });

  it("shows checklist items", () => {
    renderComponent();
    expect(screen.getByText("Match setup complete")).toBeDefined();
    expect(screen.getByText("Overlay URL copied")).toBeDefined();
  });

  it("shows overlay-only mode warning", () => {
    renderComponent();
    expect(screen.getByText(/Overlay-only mode is active/)).toBeDefined();
  });

  it("shows no-stream warning when no stream configured", () => {
    renderComponent({ stream: null });
    expect(screen.getByText(/No stream configured yet/)).toBeDefined();
  });

  it("shows generate token button", () => {
    renderComponent();
    expect(screen.getByText("Generate Token")).toBeDefined();
  });

  it("shows status controls section", () => {
    renderComponent();
    expect(screen.getByText("Stream Status & Controls")).toBeDefined();
  });
});
