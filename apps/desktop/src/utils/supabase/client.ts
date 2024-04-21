import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/constants";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
export const createClient = (customToken?: string) =>
  createSupabaseClient(SUPABASE_URL, customToken ?? SUPABASE_ANON_KEY);
