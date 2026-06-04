/**
 * lib/cricket/polls/queries.ts
 * Data access for cricket fan polls.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  calculatePollResults,
  type PollResults,
  type PollOptionResult,
} from "@/lib/cricket/validation/polls";

export interface CricketPoll {
  id: string;
  postId: string | null;
  leagueId: string | null;
  teamId: string | null;
  matchId: string | null;
  question: string;
  visibility: string;
  allowMultipleVotes: boolean;
  allowVoteChange: boolean;
  showResultsBeforeClose: boolean;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  options?: CricketPollOption[];
}

export interface CricketPollOption {
  id: string;
  pollId: string;
  optionText: string;
  sortOrder: number;
  createdAt: string;
}

function rowToPoll(row: Record<string, unknown>): CricketPoll {
  return {
    id: row.id as string,
    postId: (row.post_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    question: row.question as string,
    visibility: row.visibility as string,
    allowMultipleVotes: row.allow_multiple_votes as boolean,
    allowVoteChange: row.allow_vote_change as boolean,
    showResultsBeforeClose: row.show_results_before_close as boolean,
    status: row.status as string,
    opensAt: (row.opens_at as string | null) ?? null,
    closesAt: (row.closes_at as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToOption(row: Record<string, unknown>): CricketPollOption {
  return {
    id: row.id as string,
    pollId: row.poll_id as string,
    optionText: row.option_text as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

export async function getCricketPoll(pollId: string): Promise<CricketPoll | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_polls")
    .select("*, cricket_poll_options(*)")
    .eq("id", pollId)
    .maybeSingle();

  if (!data) return null;
  const poll = rowToPoll(data as Record<string, unknown>);
  const optionsRaw = (data as Record<string, unknown>).cricket_poll_options as
    | Record<string, unknown>[]
    | undefined;
  poll.options = (optionsRaw ?? []).map(rowToOption);
  return poll;
}

export async function getActivePollsForLeague(leagueId: string): Promise<CricketPoll[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_polls")
    .select("*, cricket_poll_options(*)")
    .eq("league_id", leagueId)
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => {
    const poll = rowToPoll(row as Record<string, unknown>);
    const optionsRaw = (row as Record<string, unknown>).cricket_poll_options as
      | Record<string, unknown>[]
      | undefined;
    poll.options = (optionsRaw ?? []).map(rowToOption);
    return poll;
  });
}

export async function getActivePollsForMatch(matchId: string): Promise<CricketPoll[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_polls")
    .select("*, cricket_poll_options(*)")
    .eq("match_id", matchId)
    .in("status", ["open", "closed"])
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((row) => {
    const poll = rowToPoll(row as Record<string, unknown>);
    const optionsRaw = (row as Record<string, unknown>).cricket_poll_options as
      | Record<string, unknown>[]
      | undefined;
    poll.options = (optionsRaw ?? []).map(rowToOption);
    return poll;
  });
}

export async function getPollResults(
  pollId: string,
  userId?: string
): Promise<PollResults | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const [{ data: pollData }, { data: votesData }] = await Promise.all([
    supabase
      .from("cricket_polls")
      .select("*, cricket_poll_options(*)")
      .eq("id", pollId)
      .maybeSingle(),
    supabase.from("cricket_poll_votes").select("option_id, user_id").eq("poll_id", pollId),
  ]);

  if (!pollData) return null;

  const optionsRaw = (pollData as Record<string, unknown>).cricket_poll_options as
    | Record<string, unknown>[]
    | undefined;
  const options = (optionsRaw ?? []).map(rowToOption);
  const votes = (votesData ?? []) as Array<{ option_id: string; user_id: string }>;
  const userVoteOptionIds = userId
    ? votes.filter((v) => v.user_id === userId).map((v) => v.option_id)
    : [];

  const results = calculatePollResults(options, votes, userVoteOptionIds);

  return {
    poll_id: pollId,
    question: (pollData as Record<string, unknown>).question as string,
    total_votes: votes.length,
    status: (pollData as Record<string, unknown>).status as string,
    closes_at: ((pollData as Record<string, unknown>).closes_at as string | null) ?? null,
    options: results,
    user_voted_option_ids: userVoteOptionIds,
  };
}

export async function getUserPollVotes(
  pollId: string,
  userId: string
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_poll_votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  return (data ?? []).map((v) => v.option_id as string);
}
