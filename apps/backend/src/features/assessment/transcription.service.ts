import axios from 'axios';
import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { RunAssessmentParams } from './assessment.service.js';
import { HttpError } from '@/lib/httpError.js';
import { TranscriptionSubmitSuccessSchema, TranscriptionJobResponseSchema, TranscriptionJobSuccess, AccessLinkResponseSchema, TranscriptJsonSchema, TranscriptJson, DailyRecordingsListResponseSchema } from '@/features/assessment/transcription.schema.js';
import { updatePracticeRoundWithReturn } from '@/features/practiceRound/practiceRound.repo.js';

/**
 * Get the latest recording ID for a Daily.co room.
 * @param roomName The Daily.co room name
 * @returns The latest recording ID
 */
export async function getLatestRecordingId(roomName: string): Promise<string> {
    const res = await axios.get(
      `https://api.daily.co/v1/recordings`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: { room_name: roomName },
        validateStatus: () => true
      }
    );

    if (res.status !== 200) {
      throw HttpError.BadRequest('Bad request for list Daily recordings');
    }

    const parsed = DailyRecordingsListResponseSchema.parse(res.data);

    if (parsed.data.length === 0) {
      throw new Error('No recordings found for room');
    }

    // Daily returns recordings sorted by created_at desc; defensively sort by available timestamp
    const sorted = [...parsed.data].sort((a, b) => {
      const aTs = (typeof a.start_ts === 'number' ? a.start_ts : Date.parse(a.created_at ?? '0'));
      const bTs = (typeof b.start_ts === 'number' ? b.start_ts : Date.parse(b.created_at ?? '0'));
      return bTs - aTs;
    });

    return sorted[0].id;

}

/**
 * Submit a transcription job for a finished Daily.co recording using the batch processor API.
 * @param recordingId The Daily.co recording ID
 * @returns The transcription job ID
 */
export async function submitTranscriptionJob(recordingId: string): Promise<{ transcriptionId: string }> {

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
			// Prevent axios from throwing on 400 so we can validate the error shape
			validateStatus: () => true
		}
	);

	if (res.status === 200) {
		const parsed = TranscriptionSubmitSuccessSchema.parse(res.data);
		return { transcriptionId: parsed.id };
	}

	throw HttpError.BadRequest('Bad request for submit Daily transcription');

}
  
/**
 * Poll for transcription job status until complete using the batch processor API.
 * @param transcriptionId The transcription job ID
 * @param intervalMs Polling interval in ms (default 5000)
 * @param timeoutMs Max time to wait in ms (default 5 min)
 * @returns The final job object (with output/transcription info)
 */
export async function pollTranscriptionStatus(transcriptionId: string): Promise<TranscriptionJobSuccess> {
	const intervalMs = 5000
	const timeoutMs = 300000

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
		console.log('Polling...')

		const res = await axios.get(
			`https://api.daily.co/v1/batch-processor/${transcriptionId}`,
			{
			headers: {
				'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
				'Content-Type': 'application/json',
			},
			validateStatus: () => true
			}
		);

		if (res.status !== 200) {
			throw HttpError.BadRequest('Bad request for poll Daily transcription');
		}

		const job = TranscriptionJobResponseSchema.parse(res.data);

		if (job.status === 'finished') {
			console.log('Polling shows status finished')
			return job;
		}

		if (job.status === 'error') {
			throw new Error('Transcription job failed: ' + job.error);
		}

		// else, still processing
		await new Promise((resolve) => setTimeout(resolve, intervalMs));		


    }

    throw new Error('Transcription polling timed out');
}

/**
 * Fetch the transcription JSON from the batch processor job using the access-link endpoint.
 * @param transcriptionResult The transcription job result object (should contain the job id)
 * @returns The transcription JSON
 */
export async function fetchTranscriptionJson(transcriptionId: string): Promise<TranscriptJson> {

	// Get link to transcript
	const linkRes = await axios.get(
		`https://api.daily.co/v1/batch-processor/${transcriptionId}/access-link`,
		{
			headers: {
				'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
				'Content-Type': 'application/json',
			},
			validateStatus: () => true
		}
	);

	let jsonLink = null
	if (linkRes.status === 200) {

		const access = AccessLinkResponseSchema.parse(linkRes.data);

		if (!Array.isArray(access.transcription) || access.transcription.length === 0) {
			throw new Error('No transcription access links found');
		}

		jsonLink = access.transcription.find(t => t.format === 'json') ?? access.transcription[0];

	} else {
		throw HttpError.BadRequest('Bad request for fetch Daily transcription');
	}

	// Get transcript using link
	const transcriptRes = await axios.get(jsonLink.link, { validateStatus: () => true });

	if (transcriptRes.status === 200) {
		const transcript = TranscriptJsonSchema.parse(transcriptRes.data);
		return transcript;
	}

	throw HttpError.BadRequest('Bad request for fetch Daily transcription');
}

/**
 * Save a transcription JSON to the database under practice_rounds.transcript by round id.
 * @param roundId The practice round ID (matches practice_rounds.id)
 * @param transcriptionJson The transcription JSON object
 * @returns The updated round id
 */
export async function uploadTranscription(supabaseAuthenticated: TypedSupabaseClient, roundId: string, transcriptionJson: TranscriptJson): Promise<string> {
  
	if (!roundId) {
    	throw new Error('roundId is required');
  	}

	const updated = await updatePracticeRoundWithReturn(
		supabaseAuthenticated,
		{
		roundId,
		transcript: JSON.stringify(transcriptionJson)
		}
	);

  return updated.id;
}


type RunTranscribeParams = Omit<RunAssessmentParams, 'caseName'>

/**
 * End-to-end transcription workflow for a finished Daily.co recording.
 * - Finds latest recording for the room
 * - Submits transcription job
 * - Polls until complete
 * - Fetches transcript JSON
 * - Uploads to Supabase Storage under the session ID
 */
export async function transcribe(
  supabaseAuthenticated: TypedSupabaseClient,
  params: RunTranscribeParams
): Promise<TranscriptJson> {

    const { roomName, roomId, roundId } = params

	console.log('Starting new transcription workflow for roomId', roomId)
	console.log('roundId', roundId)

    const recordingId = await getLatestRecordingId(roomName);
	console.log('recordingId', recordingId)
    
    if (!recordingId) {
		throw new Error('No recording ID found for room')
    }

    // 2) Submit transcription job
    console.log('Submitting transcription job for recording:', recordingId);
    const { transcriptionId } = await submitTranscriptionJob(recordingId);

    // 3) Poll for completion
	console.log('Polling transcription job ID: ', transcriptionId)
    const transcriptionResult = await pollTranscriptionStatus(transcriptionId);

	console.log('Fetching transcription JSON for:', transcriptionId);
	const transcriptionJson = await fetchTranscriptionJson(transcriptionId);

    // 5) Upload transcript to Supabase Storage
    console.log('Uploading transcription to Supabase Storage for room:', roomId, 'and round:', roundId);
    await uploadTranscription(supabaseAuthenticated, roundId, transcriptionJson);

    // 6) Log completion
    console.log('Transcription and upload complete:', {
      recordingId,
      transcriptionId,
      transcription_status: transcriptionResult.status,
      roundId,
    });

    return transcriptionJson;

}
  