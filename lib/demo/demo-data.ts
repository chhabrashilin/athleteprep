/**
 * lib/demo/demo-data.ts — Demo workspace data constants.
 *
 * These are used by the demo setup server action to create a realistic
 * cricket-themed demo workspace for any authenticated user.
 *
 * Only used when NEXT_PUBLIC_ENABLE_MOCK_DATA=true.
 * All names are clearly fictional. No real individuals are depicted.
 */

export const DEMO_TEAM = {
  name: "Madison Cricket XI",
  sport: "cricket" as const,
  organizationName: "Demo Club",
  level: "College / Competitive Club",
  location: "Madison, WI",
  description:
    "A demo team used to showcase AI-powered game review, player feedback, and practice planning.",
};

export const DEMO_PLAYERS = [
  {
    firstName: "Arjun",
    lastName: "Patel",
    jerseyNumber: "7",
    position: "Top-order batter",
    role: "Captain",
    dominantSide: "right",
    notes: "Aggressive opener with strong off-side play. Anchor of the batting lineup.",
  },
  {
    firstName: "Rohan",
    lastName: "Mehta",
    jerseyNumber: "12",
    position: "Opening batter",
    role: "Player",
    dominantSide: "left",
    notes: "Left-handed opener. Strong on the leg side. Tends to struggle with short-pitched deliveries early.",
  },
  {
    firstName: "Sameer",
    lastName: "Khan",
    jerseyNumber: "18",
    position: "All-rounder",
    role: "Player",
    dominantSide: "right",
    notes: "Reliable middle-order batter and right-arm medium pacer. Good under pressure.",
  },
  {
    firstName: "Vikram",
    lastName: "Rao",
    jerseyNumber: "9",
    position: "Fast bowler",
    role: "Player",
    dominantSide: "right",
    notes: "Leading pace bowler. Gets early movement with the new ball. Tends to leak runs in the death.",
  },
  {
    firstName: "Neil",
    lastName: "Desai",
    jerseyNumber: "22",
    position: "Wicketkeeper",
    role: "Player",
    dominantSide: "right",
    notes: "Reliable keeper-batter. Crucial in the middle order for strike rotation.",
  },
  {
    firstName: "Kabir",
    lastName: "Singh",
    jerseyNumber: "5",
    position: "Spinner",
    role: "Player",
    dominantSide: "right",
    notes: "Off-spin bowler who creates pressure through accuracy. Economical in the middle overs.",
  },
  {
    firstName: "Aman",
    lastName: "Shah",
    jerseyNumber: "33",
    position: "Middle-order batter",
    role: "Player",
    dominantSide: "right",
    notes: "Composed middle-order batter. Good at rebuilding innings after early wickets.",
  },
  {
    firstName: "Dev",
    lastName: "Iyer",
    jerseyNumber: "45",
    position: "Finisher",
    role: "Player",
    dominantSide: "left",
    notes: "Hard-hitting finisher. Effective in the death overs. Inconsistent against quality spin.",
  },
  {
    firstName: "Rahul",
    lastName: "Nair",
    jerseyNumber: "11",
    position: "Medium pacer",
    role: "Player",
    dominantSide: "right",
    notes: "Swing bowler. Gets good movement with the new ball. Useful change-up bowler.",
  },
  {
    firstName: "Ishan",
    lastName: "Gupta",
    jerseyNumber: "16",
    position: "Utility fielder",
    role: "Player",
    dominantSide: "right",
    notes: "Excellent fielder in the ring. Useful lower-order batter.",
  },
] as const;

export const DEMO_GAME = {
  title: "Match vs Lakeside CC",
  sport: "cricket" as const,
  gameType: "match" as const,
  opponentName: "Lakeside CC",
  gameDate: "2026-05-24",
  homeAway: "neutral" as const,
  venue: "Demo Ground",
  competitionName: "Spring Invitational",
  teamScore: "148/7",
  opponentScore: "151/6",
  result: "Lost by 4 wickets",
  summaryNotes:
    "Competitive match where Madison Cricket XI posted a defendable total but struggled to control the middle overs and death-over fielding execution.",
  coachNotes: `Our batting showed real intent in the powerplay — Arjun and Rohan's opening partnership was confident and set a strong platform. However, once we lost the second wicket in the 9th over, we failed to rebuild at the required run rate. The middle order needed to rotate strike more effectively and avoid the dot-ball clusters that cost us 15–20 runs in the critical overs 12–17.

Bowling-wise, Kabir's spell in the middle overs was excellent — tight lines, good flight, and he extracted turn. But we gave away too many extras in the death and our fielding execution in the 38th–42nd overs was below standard. Two missed run-outs and a dropped catch changed the game.

The key lesson from this match: our death-over plan needs a dedicated decision tree — who bowls, which end, what field, and what pace variations we attack with. We improvised too much under pressure.

Individual standout: Kabir Singh — 2 wickets, 22 runs from 8 overs in the middle was outstanding. Needs recognition and we should plan to use him more assertively in this role next match.`,
  opponentNotes: `Lakeside CC is a well-drilled side with experienced top-order batters who target pace bowling early. Their opener — #34 — is strong square of the wicket and pulls well. We should bring mid-on up and tempt him into a lofted shot early.

Their lower order is aggressive and tends to go aerial in the final 4 overs. We need our fielding positions to be pre-set for these batters, not reactive.

Weakness: they struggled initially against Kabir's off-spin when the ball was turning. We should look to use spin earlier in the innings in the next meeting.

Their pace attack bowled good lengths but went short too often against our middle order. Aman and Neil both looked comfortable when length was given. However, their yorker execution in the final over was near-perfect.`,
};

export const DEMO_EVENTS = [
  {
    timestampSeconds: 135, // 2:15
    label: "Strong opening boundary — Arjun drives through covers",
    eventType: "batting",
    teamContext: "own_team",
    description:
      "Arjun Patel drives a full-length delivery through the covers for four. Great timing and intent. Sets the tone for the powerplay.",
    importance: "medium" as const,
    tags: ["batting intent", "powerplay", "top-order"],
    playerNames: ["Arjun Patel"],
  },
  {
    timestampSeconds: 400, // 6:40
    label: "Dot-ball pressure builds — three in a row",
    eventType: "batting",
    teamContext: "own_team",
    description:
      "Three consecutive dot balls from Rohan in the 7th over. Unable to find the gap against a disciplined line-and-length spell. Pressure building.",
    importance: "high" as const,
    tags: ["dot-ball pressure", "powerplay", "strike rotation"],
    playerNames: ["Rohan Mehta"],
  },
  {
    timestampSeconds: 565, // 9:25
    label: "Risky aerial shot — wicket falls, 2nd wicket down",
    eventType: "wicket",
    teamContext: "own_team",
    description:
      "Rohan attempts a lofted on-drive but finds mid-on. Poor shot selection under pressure — tried to break the dot-ball sequence with a high-risk shot. 2nd wicket falls at 42/2.",
    importance: "critical" as const,
    tags: ["wicket", "shot selection", "powerplay", "dot-ball pressure"],
    playerNames: ["Rohan Mehta"],
  },
  {
    timestampSeconds: 790, // 13:10
    label: "Smart strike rotation — Arjun and Aman rebuild",
    eventType: "batting",
    teamContext: "own_team",
    description:
      "Good running between the wickets from Arjun and Aman. Seven singles off the last 9 balls of the over. Strike rotation restoring momentum after 2nd wicket.",
    importance: "medium" as const,
    tags: ["strike rotation", "rebuilding", "middle overs", "batting intent"],
    playerNames: ["Arjun Patel", "Aman Shah"],
  },
  {
    timestampSeconds: 1125, // 18:45
    label: "Missed run-out — Lakeside opener survives at 22",
    eventType: "fielding",
    teamContext: "own_team",
    description:
      "Clear run-out chance at the striker's end after direct throw from Ishan Gupta — batter was well short but the stumps were missed. Critical lapse at a key moment.",
    importance: "high" as const,
    tags: ["fielding", "run-out", "missed chance", "middle overs"],
    playerNames: ["Ishan Gupta"],
  },
  {
    timestampSeconds: 1350, // 22:30
    label: "Kabir Singh creates pressure — 2 dots and a wicket",
    eventType: "bowling",
    teamContext: "own_team",
    description:
      "Kabir's off-spin is getting sharp turn on the surface. Two dot balls followed by a caught-behind off the outside edge. Lakeside opener departs. Excellent bowling spell underway.",
    importance: "high" as const,
    tags: ["bowling plan", "spin", "middle overs", "wicket", "pressure"],
    playerNames: ["Kabir Singh"],
  },
  {
    timestampSeconds: 1625, // 27:05
    label: "Opponent targets short boundary — sweep for six",
    eventType: "batting",
    teamContext: "opponent",
    description:
      "Lakeside #3 goes down the track and hits over mid-wicket for six. Pre-meditated sweep against the spin. Exposed our mid-wicket gap — field placement error.",
    importance: "high" as const,
    tags: ["opponent tendency", "boundary", "field placement", "spin"],
    playerNames: [],
  },
  {
    timestampSeconds: 1880, // 31:20
    label: "Fielding miscommunication — boundary conceded",
    eventType: "fielding",
    teamContext: "own_team",
    description:
      "Sameer and Ishan both go for the same ball in the deep and leave it for each other — four runs resulted. Avoidable communication failure at a critical stage of the chase.",
    importance: "critical" as const,
    tags: ["fielding", "miscommunication", "decision-making", "death overs"],
    playerNames: ["Sameer Khan", "Ishan Gupta"],
  },
  {
    timestampSeconds: 2155, // 35:55
    label: "Death-over yorker missed — full toss conceded",
    eventType: "bowling",
    teamContext: "own_team",
    description:
      "Vikram Rao attempts yorker but bowls a waist-high full toss. Lakeside finisher hits it over mid-on for six. Yorker plan not executing cleanly under pressure.",
    importance: "high" as const,
    tags: ["bowling plan", "death overs", "yorker", "pressure", "execution"],
    playerNames: ["Vikram Rao"],
  },
  {
    timestampSeconds: 2355, // 39:15
    label: "Opponent finisher attacks pace — two sixes in over",
    eventType: "batting",
    teamContext: "opponent",
    description:
      "Lakeside #7 hits Vikram for two consecutive sixes, playing down the ground and over mid-wicket. Clear plan to attack pace. Our field was not set for the pull.",
    importance: "critical" as const,
    tags: ["opponent tendency", "death overs", "pace attack", "boundary"],
    playerNames: [],
  },
  {
    timestampSeconds: 2520, // 42:00
    label: "Good slower-ball — dot ball and almost a wicket",
    eventType: "bowling",
    teamContext: "own_team",
    description:
      "Sameer adjusts mid-over and bowls a slower ball. Batter mistimes the pull straight to deep mid-wicket — dropped, but good instinct on the variation. Slower ball working.",
    importance: "medium" as const,
    tags: ["bowling plan", "variation", "death overs", "adjustment"],
    playerNames: ["Sameer Khan"],
  },
  {
    timestampSeconds: 2730, // 45:30
    label: "Final-over field placement issue — winning run scored",
    eventType: "fielding",
    teamContext: "own_team",
    description:
      "In the final over needing 6 off 3, we left a gap at deep square leg. Lakeside #7 hit one straight into the gap for four — winning the game with two balls to spare. Field was not designed for the specific batter.",
    importance: "critical" as const,
    tags: ["fielding", "field placement", "death overs", "decision-making", "final over"],
    playerNames: [],
  },
] as const;

/** Used to detect if demo data already exists for the current user. */
export const DEMO_TEAM_MARKER = "Madison Cricket XI";
