/**
 * lib/cricket/commerce/events.ts
 * Commerce audit log helpers.
 * Call only from Server Actions / Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CommerceEventInput {
  event_type: string;
  actor_user_id?: string | null;
  league_id?: string | null;
  team_id?: string | null;
  vendor_id?: string | null;
  order_id?: string | null;
  event_payload?: Record<string, unknown>;
}

export async function logCommerceEvent(input: CommerceEventInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase.from("cricket_commerce_events").insert({
    event_type: input.event_type,
    actor_user_id: input.actor_user_id ?? null,
    league_id: input.league_id ?? null,
    team_id: input.team_id ?? null,
    vendor_id: input.vendor_id ?? null,
    order_id: input.order_id ?? null,
    event_payload: input.event_payload ?? {},
  });
  // Intentionally ignore errors — audit logging must never break main flows.
}
