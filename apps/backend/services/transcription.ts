import axios from 'axios';
import supabase from '../utils/supabase'

/**
 * Get the latest recording ID for a Daily.co room.
 * @param roomName The Daily.co room name
 * @returns The latest recording ID
 */
export async function getLatestRecordingId(roomName: string): Promise<string> {
  try {
    const res = await axios.get(
      `https://api.daily.co/v1/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('res:', res.data);
    // res.data.data is the array of recordings
    if (!res.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('No recordings found');
    }
    // Filter by room_name
    const filtered = res.data.data.filter((rec: any) => rec.room_name === roomName);
    if (filtered.length === 0) {
      throw new Error('No recordings found for room');
    }
    // Sort by start_ts descending, pick the latest
    const sorted = filtered.sort((a: any, b: any) => b.start_ts - a.start_ts);
    console.log('sorted:', sorted[0].id);
    return sorted[0].id;
  } catch (error: any) {
    console.error('Error fetching latest recording ID:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to get latest recording ID');
  }
}

/**
 * Submit a transcription job for a finished Daily.co recording using the batch processor API.
 * @param recordingId The Daily.co recording ID
 * @returns The transcription job ID
 */
export async function submitTranscriptionJob(recordingId: string): Promise<{ transcription_id: string }> {
    try {
      const res = await axios.post(
        'https://api.daily.co/v1/batch-processor',
        {
          preset: 'transcript',
          inParams: {
            sourceType: 'recordingId',
            recordingId: recordingId,
          },
          outParams: {
            s3Config: {
              s3KeyTemplate: `transcripts`
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // The job ID is typically in res.data.id or res.data.jobId
      console.log('res.data:', res.data);
      return { transcription_id: res.data.id || res.data.jobId };
    } catch (error: any) {
      console.error('Error submitting transcription job:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to submit transcription job');
    }
}
  
/**
 * Poll for transcription job status until complete using the batch processor API.
 * @param transcriptionId The transcription job ID
 * @param intervalMs Polling interval in ms (default 5000)
 * @param timeoutMs Max time to wait in ms (default 5 min)
 * @returns The final job object (with output/transcription info)
 */
export async function pollTranscriptionStatus(transcriptionId: string, intervalMs = 5000, timeoutMs = 300000): Promise<any> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      console.log('Polling transcription status for:', transcriptionId);
      try {
        const res = await axios.get(
          `https://api.daily.co/v1/batch-processor/${transcriptionId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const job = res.data;
        console.log('Transcription job status:', job.status);
        if (job.status === 'finished') {
          return job;
        } else if (job.status === 'error') {
          throw new Error('Transcription job failed: ' + (job.error || 'Unknown error'));
        }
        // else, still processing
      } catch (error: any) {
        console.error('Error polling transcription status:', error.response?.data || error.message);
        throw error; // Stop polling on error
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Transcription polling timed out');
}

/**
 * Fetch the transcription JSON from the batch processor job using the access-link endpoint.
 * @param transcriptionResult The transcription job result object (should contain the job id)
 * @returns The transcription JSON
 */
export async function fetchTranscriptionJson(transcriptionResult: any): Promise<any> {
    console.log('Fetching transcription JSON for:', transcriptionResult);
    try {
      const jobId = transcriptionResult.id;
      if (!jobId) throw new Error('No job ID found in transcription result');
      // Get access links for the job outputs
      const accessRes = await axios.get(
        `https://api.daily.co/v1/batch-processor/${jobId}/access-link`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const links = accessRes.data.transcription;
      if (!Array.isArray(links) || links.length === 0) {
        throw new Error('No transcription access links found');
      }
      // Prefer JSON format if available, otherwise use the first link
      let jsonLink = links.find((t: any) => t.format === 'json');
      if (!jsonLink) jsonLink = links[0];
      if (!jsonLink.link) throw new Error('No valid transcription link found');
      // Download the JSON transcript
      const transcriptRes = await axios.get(jsonLink.link);
      return transcriptRes.data;
    } catch (error: any) {
      console.error('Error fetching transcription JSON:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch transcription JSON');
    }
}

/**
 * Upload a transcription JSON to Supabase Storage in a folder named after the session ID.
 * @param sessionId The practice session ID
 * @param transcriptionJson The transcription JSON object
 * @returns The public URL or storage path of the uploaded file
 */
export async function uploadTranscriptionToStorage(sessionId: string, transcriptionJson: any): Promise<string> {
  const bucket = 'assessments';
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

/**
 * End-to-end transcription workflow for a finished Daily.co recording.
 * - Finds latest recording for the room
 * - Submits transcription job
 * - Polls until complete
 * - Fetches transcript JSON
 * - Uploads to Supabase Storage under the session ID
 */
export async function transcribe(roomName: string, sessionId: string): Promise<any> {
    try {
      // 1) Find latest recording ID for the room
      const recordingId = await getLatestRecordingId(roomName);
      console.log('latest recordingId:', recordingId);
      if (!recordingId) {
        console.error('No recording ID found for room');
        return;
      }
  
      // 2) Submit transcription job
      console.log('Submitting transcription job for recording:', recordingId);
      const { transcription_id } = await submitTranscriptionJob(recordingId);
  
      // 3) Poll for completion
      console.log('Polling transcription status for:', transcription_id);
      const transcriptionResult = await pollTranscriptionStatus(transcription_id);
  
      // 4) Fetch the transcription JSON
      console.log('Fetching transcription JSON for:', transcriptionResult);
      const transcriptionJson = await fetchTranscriptionJson(transcriptionResult);
      console.log('transcriptionJson:', transcriptionJson);
  
      // 5) Upload transcript to Supabase Storage
      console.log('Uploading transcription to Supabase Storage for session:', sessionId);
      const storageUrl = await uploadTranscriptionToStorage(sessionId, transcriptionJson);
  
      // 6) Log completion
      console.log('Transcription and upload complete:', {
        recordingId,
        transcription_id,
        transcription_status: transcriptionResult.status,
        storageUrl,
      });
      return transcriptionJson;
    } catch (err: any) {
      console.error('Error in transcribe workflow:', err.response?.data || err.message);
    }
}
  