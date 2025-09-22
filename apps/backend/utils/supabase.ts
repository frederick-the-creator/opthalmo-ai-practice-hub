import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/dbTypes'

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

type TypedSupabaseClient = SupabaseClient<Database>

const adminSupabase: TypedSupabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default adminSupabase