import axios from 'axios'
import supabase from '../utils/supabase'

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
 * Create a new Daily.co room and return its URL.
 * @returns The created room URL.
 * @throws If the room creation fails.
 */
export async function createDailyRoom(): Promise<string> {
  try {
    const dailyRes = await axios.post(
      'https://api.daily.co/v1/rooms',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return dailyRes.data.url;
  } catch (error: any) {
    console.error('Error creating Daily.co room:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create Daily.co room');
  }
}

export interface CreateSessionInput {
    host_id: string;
    type: string;
    datetime_utc: string;
    private?: boolean;
  }
  
  /**
   * Create a practice session by provisioning a Daily.co room and inserting the session in Supabase.
   * @returns The created session object
   */
export async function createSession(input: CreateSessionInput): Promise<any> {
    const { host_id, type, datetime_utc, private: isPrivate } = input;
    if (!host_id || !type || !datetime_utc) {
      throw new Error('Missing required fields');
    }
  
    // 1. Create Daily.co room
    const roomUrl = await createDailyRoom();
  
    // 2. Insert into Supabase
    const { data } = await createPracticeSession({
      host_id,
      type,
      room_url: roomUrl,
      datetime_utc,
      private: !!isPrivate,
    });
  
    return data[0];
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

/**
 * Upload a transcription JSON to Supabase Storage in a folder named after the session ID.
 * @param sessionId The practice session ID
 * @param transcriptionJson The transcription JSON object
 * @returns The public URL or storage path of the uploaded file
 */
export async function uploadTranscriptionToStorage(sessionId: string, transcriptionJson: any): Promise<string> {
  const bucket = 'transcriptions';
  const filePath = `${sessionId}/transcript.json`;
  // Use Buffer for Node.js compatibility
  let file;
  if (typeof Blob !== 'undefined') {
    file = new Blob([JSON.stringify(transcriptionJson)], { type: 'application/json' });
  } else {
    file = Buffer.from(JSON.stringify(transcriptionJson), 'utf-8');
  }

  // Upload the file
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) {
    throw new Error(error.message || 'Failed to upload transcription to storage');
  }

  // Get the public URL (or signed URL if you prefer)
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrlData?.publicUrl || filePath;
}





