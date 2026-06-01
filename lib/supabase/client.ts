"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a Supabase browser client for use in Client Components.
 * Returns null if Supabase is not configured (missing env vars).
 * The singleton pattern avoids creating a new client on every render.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[GameIQ] Supabase not configured. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return null;
  }
  if (!_client) {
    _client = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  return _client;
}
