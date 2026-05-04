import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  // Surfaces clearly in dev if .env.local is missing
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars.");
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
  },
});

// Map a username to a synthetic email so Supabase Auth can use it.
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@bnb.local`;
