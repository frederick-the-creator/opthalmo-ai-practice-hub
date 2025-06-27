const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Update a practice session with given fields.
 * @param {string} sessionId - The session ID to update.
 * @param {object} fields - The fields to update (e.g., { guest_id: '...', candidate_id: '...' }).
 * @returns {Promise<any>} The updated session object.
 * @throws {Error} If the update fails.
 */
async function updateSession(sessionId, fields) {
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
  return data[0];
}

module.exports = {
  supabase,
  updateSession,
}; 