import type { GeneratedGameReport } from "@/types/analysis";

export const fixtureGeneratedReport: GeneratedGameReport = {
  title: "Match vs Lakeside CC — AI Coaching Report",
  executiveSummary:
    "Madison Cricket XI won by 22 runs in a well-contested match. Batting was the team's standout performance, with Arjun Sharma setting a strong foundation. Bowling showed improvement with Priya Patel taking a key early wicket. Fielding requires attention, particularly around run-out opportunities.",
  overallConfidence: "medium",
  assumptions: [
    "Player positions are assumed to match their registered roles.",
    "Opponent player names are sourced from coach notes only.",
  ],
  limitations: [
    "Analysis is based on manually tagged key moments, coach notes, and structured game metadata. No automated video tracking or computer vision was performed.",
    "Only 3 events were tagged — a small sample for a full game analysis.",
  ],
  coachingInsights: [
    {
      title: "Strong batting foundation from opening partnership",
      summary:
        "Arjun Sharma's aggressive but controlled batting in the powerplay set the platform for the innings total.",
      whyItMatters:
        "Powerplay run rate directly correlates with final innings total in limited-overs cricket. A strong start reduces pressure on the middle order.",
      recommendedAction:
        "Encourage Arjun to continue his aggressive approach against pace but review footwork against spin in training.",
      confidence: "high",
      evidence: [
        {
          id: "ev-ref-001",
          type: "timestamp",
          label: "Opening boundary hit",
          description: "Arjun drives through covers for four.",
          timestampSeconds: 120,
          eventId: "event-001",
          playerIds: ["player-001"],
        },
      ],
      assumptions: ["Batting performance inferred from event data and coach notes."],
      affectedPlayerIds: ["player-001"],
      relatedEventIds: ["event-001"],
      sortOrder: 0,
    },
    {
      title: "Early wicket disrupts opponent's game plan",
      summary:
        "Priya Patel's early breakthrough reduced Lakeside CC's run rate in the crucial 10–20 over window.",
      whyItMatters:
        "Taking the opener early forces the opposition to rebuild, typically reducing their scoring rate by 15–25% over the following 5 overs.",
      recommendedAction:
        "Consider opening with Priya more consistently when facing aggressive top-order batters.",
      confidence: "medium",
      evidence: [
        {
          id: "ev-ref-002",
          type: "timestamp",
          label: "Wicket taken",
          description: "Priya gets the opener LBW.",
          timestampSeconds: 450,
          eventId: "event-002",
          playerIds: ["player-002"],
        },
      ],
      assumptions: ["Impact on opposition scoring rate inferred from game result."],
      affectedPlayerIds: ["player-002"],
      relatedEventIds: ["event-002"],
      sortOrder: 1,
    },
  ],
  playerReports: [
    {
      playerId: "player-001",
      playerDisplayName: "Arjun Sharma",
      summary:
        "Arjun had an excellent match with a composed batting performance setting up the team's total.",
      strengths: ["Aggressive shot selection in powerplay", "Strong off-side play"],
      improvementAreas: ["Footwork against left-arm spin", "Running between wickets communication"],
      keyMoments: [
        {
          description: "Boundary hit through covers",
          significance: "Set the tone for the innings",
          eventId: "event-001",
          timestampSeconds: 120,
        },
      ],
      recommendedFocus: "Left-arm spin defensive drills — 20 minutes per session.",
      playerFacingSummary:
        "Great batting today, Arjun. Focus on your footwork against left-arm spin in the next session.",
      confidence: "high",
      dataCoverage: "1 tagged event, coach notes",
    },
    {
      playerId: "player-002",
      playerDisplayName: "Priya Patel",
      summary: "Priya's early breakthrough was the bowling highlight of the match.",
      strengths: ["Disciplined line and length", "Effective swing with the new ball"],
      improvementAreas: ["Death bowling economy rate"],
      keyMoments: [
        {
          description: "LBW wicket",
          significance: "Early breakthrough disrupted the opener",
          eventId: "event-002",
          timestampSeconds: 450,
        },
      ],
      recommendedFocus: "Death bowling drills — yorkers and slower balls.",
      playerFacingSummary:
        "Excellent wicket today, Priya. Work on your death bowling variations for the next game.",
      confidence: "medium",
      dataCoverage: "1 tagged event, coach notes",
    },
  ],
  practiceRecommendations: [
    {
      title: "Run-out drill — pressure situations",
      priority: 1,
      description:
        "Focus on fielding techniques for run-out opportunities under pressure, particularly wicket-keeper coordination.",
      drillName: "Cone-and-throw run-out relay",
      durationMinutes: 20,
      coachingPoints: [
        "Practice throwing at stumps from 10m, 15m, and 20m",
        "Communication calls between fielders and keeper",
        "Decision-making on go / no-go run-outs",
      ],
      playerIds: ["player-003"],
      confidence: "high",
    },
  ],
  opponentTendencies: [
    {
      title: "Opponent top-order struggles against left-arm spin",
      description:
        "Based on coach notes, Lakeside CC's top-order batters showed difficulty against left-arm spin bowling.",
      evidence: [
        {
          id: "ev-ref-003",
          type: "coach_note",
          label: "Coach notes on opponent",
          description: "Their top-order is aggressive but struggles against left-arm spin.",
        },
      ],
      recommendedResponse:
        "Open bowling with Priya against Lakeside CC's top order in the next fixture.",
      confidence: "low",
      tags: ["left-arm-spin", "batting-weakness"],
    },
  ],
};
