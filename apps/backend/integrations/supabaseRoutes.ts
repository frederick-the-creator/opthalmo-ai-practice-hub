import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Insert a new practice session into the database.
 * @param fields - The fields for the new session (e.g., { host_id, date, time, type, room_url }).
 * @returns The inserted session object.
 * @throws If the insert fails.
 */
export async function createPracticeSession(fields: Record<string, any>): Promise<any> {
  const { data, error } = await supabase
    .from('practice_sessions')
    .insert([fields])
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to create session');
  }
  if (!data || !data[0]) {
    throw new Error('No session created');
  }
  return { data, error: null };
} 

/**
 * Update a practice session with given fields.
 * @param sessionId - The session ID to update.
 * @param fields - The fields to update (e.g., { guest_id: '...', candidate_id: '...' }).
 * @returns The updated session object.
 * @throws If the update fails.
 */
export async function updatePracticeSession(
  sessionId: string,
  fields: Record<string, any>
): Promise<any> {
  const { data, error } = await supabase
    .from('practice_sessions')
    .update(fields)
    .eq('id', sessionId)
    .select();
  if (error) {
    throw new Error(error.message || 'Failed to update session');
  }
  if (!data || !data[0]) {
    throw new Error('No session found or updated');
  }
  return { data, error: null };
}

