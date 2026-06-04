"use server";

/**
 * lib/cricket/polls/actions.ts
 * Server actions for cricket fan polls.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { createPollSchema, pollVoteSchema } from "@/lib/cricket/validation/polls";
import { createCricketNotification } from "@/lib/cricket/notifications/actions";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function createCricketPoll(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  if (d.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: d.league_id,
      p_user_id: user.id,
    });
    if (!canMod) return { success: false, error: "Not authorized to create polls in this league" };
  }

  const { data: poll, error: pollError } = await supabase
    .from("cricket_polls")
    .insert({
      post_id: d.post_id ?? null,
      league_id: d.league_id ?? null,
      team_id: d.team_id ?? null,
      match_id: d.match_id ?? null,
      question: d.question,
      visibility: d.visibility,
      allow_multiple_votes: d.allow_multiple_votes,
      allow_vote_change: d.allow_vote_change,
      show_results_before_close: d.show_results_before_close,
      status: "open",
      closes_at: d.closes_at ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (pollError) return { success: false, error: "Failed to create poll" };

  const pollId = poll.id as string;

  const options = d.options.map((text, index) => ({
    poll_id: pollId,
    option_text: text,
    sort_order: index,
  }));

  const { error: optionsError } = await supabase.from("cricket_poll_options").insert(options);
  if (optionsError) {
    await supabase.from("cricket_polls").delete().eq("id", pollId);
    return { success: false, error: "Failed to create poll options" };
  }

  // Notify league followers about new poll.
  if (d.league_id) {
    void notifyLeagueOfPoll(d.league_id, pollId, d.question, user.id);
  }

  return { success: true, data: { id: pollId } };
}

async function notifyLeagueOfPoll(
  leagueId: string,
  pollId: string,
  question: string,
  actorId: string
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: followers } = await supabase
    .from("cricket_follows")
    .select("user_id")
    .eq("target_type", "league")
    .eq("target_id", leagueId);

  if (!followers?.length) return;

  for (const f of followers) {
    if ((f.user_id as string) === actorId) continue;
    await createCricketNotification({
      recipient_user_id: f.user_id as string,
      actor_user_id: actorId,
      league_id: leagueId,
      notification_type: "poll.created",
      title: `New poll: ${question.slice(0, 80)}`,
      action_url: `/cricket/leagues`,
    });
  }
}

export async function voteInCricketPoll(
  pollId: string,
  optionIds: string[]
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = pollVoteSchema.safeParse({ poll_id: pollId, option_ids: optionIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: poll } = await supabase
    .from("cricket_polls")
    .select("status, allow_multiple_votes, allow_vote_change")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll) return { success: false, error: "Poll not found" };
  if ((poll.status as string) !== "open") return { success: false, error: "Poll is not open" };

  if (!(poll.allow_multiple_votes as boolean) && optionIds.length > 1) {
    return { success: false, error: "This poll only allows one vote" };
  }

  // Check existing votes.
  const { data: existingVotes } = await supabase
    .from("cricket_poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id);

  if (existingVotes && existingVotes.length > 0 && !(poll.allow_vote_change as boolean)) {
    return { success: false, error: "Vote changes are not allowed for this poll" };
  }

  // Remove old votes if changing.
  if (existingVotes && existingVotes.length > 0) {
    await supabase
      .from("cricket_poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", user.id);
  }

  const votes = optionIds.map((optionId) => ({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  }));

  const { error } = await supabase.from("cricket_poll_votes").insert(votes);
  if (error) return { success: false, error: "Failed to record vote" };

  return { success: true };
}

export async function changeCricketPollVote(
  pollId: string,
  optionIds: string[]
): Promise<ActionResult> {
  return voteInCricketPoll(pollId, optionIds);
}

export async function closeCricketPoll(pollId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: poll } = await supabase
    .from("cricket_polls")
    .select("league_id, created_by")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll) return { success: false, error: "Poll not found" };

  const isOwner = (poll.created_by as string) === user.id;
  let isModerator = false;
  if (poll.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: poll.league_id,
      p_user_id: user.id,
    });
    isModerator = Boolean(canMod);
  }

  if (!isOwner && !isModerator) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_polls")
    .update({ status: "closed" })
    .eq("id", pollId);

  if (error) return { success: false, error: "Failed to close poll" };
  return { success: true };
}

export async function archiveCricketPoll(pollId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: poll } = await supabase
    .from("cricket_polls")
    .select("league_id, created_by")
    .eq("id", pollId)
    .maybeSingle();

  if (!poll) return { success: false, error: "Poll not found" };

  const isOwner = (poll.created_by as string) === user.id;
  let isModerator = false;
  if (poll.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: poll.league_id,
      p_user_id: user.id,
    });
    isModerator = Boolean(canMod);
  }

  if (!isOwner && !isModerator) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_polls")
    .update({ status: "archived" })
    .eq("id", pollId);

  if (error) return { success: false, error: "Failed to archive poll" };
  return { success: true };
}
