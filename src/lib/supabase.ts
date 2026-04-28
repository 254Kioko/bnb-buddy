import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your values."
  );
}

export const supabase = createClient(url ?? "http://localhost", anonKey ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type Room = {
  id: string;
  user_id: string;
  name: string;
  price_per_night: number;
  status: "available" | "occupied";
  created_at?: string;
};

export type Booking = {
  id: string;
  user_id: string;
  room_id: string;
  client_name: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  payment_status: "paid" | "unpaid" | "partial";
  created_at?: string;
};

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category: "rent" | "water" | "electricity" | "maintenance" | "other";
  description: string | null;
  date: string;
  created_at?: string;
};
