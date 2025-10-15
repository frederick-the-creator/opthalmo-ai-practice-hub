import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types.js'
export const SUPABASE_URL = process.env.SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY as string;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

export type TypedSupabaseClient = SupabaseClient<Database>;


/**
 * Create a Supabase client authenticated with the Secret key (admin privileges).
 * Used by services to access auth.admin endpoints.
 */
export function createAdminSupabaseClient(): TypedSupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Supabase admin client not configured. Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY);
}
