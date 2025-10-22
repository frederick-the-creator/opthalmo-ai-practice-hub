import axios from 'axios';
import { HttpError } from '@/lib/httpError.js';
import {
  DailyCreateRoomResponseSchema,
  DailyRecordingActionResponseSchema,
  DailyRecordingActionResponse,
} from '@/features/assessment/recording.schema.js';

/**
 * Create a new Daily.co room and return its URL.
 * @returns The created room URL.
 * @throws If the room creation fails.
 */
export async function createDailyRoom(): Promise<string> {
  const { data, status } = await axios.post<unknown>(
    'https://api.daily.co/v1/rooms',
    {},
    {
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    }
  );

  if (status !== 200) {
    throw HttpError.BadRequest('Bad request for create Daily room');
  }

  const parsed = DailyCreateRoomResponseSchema.parse(data);
  return parsed.url;
}


/**
 * Start a recording for a Daily.co room.
 * @param roomName The Daily.co room name (not the full URL)
 * @returns The recording object from Daily.co
 * @throws If the API call fails
 */
export async function startDailyRecording(roomName: string): Promise<DailyRecordingActionResponse> {
    const { data, status } = await axios.post<unknown>(
      `https://api.daily.co/v1/rooms/${roomName}/recordings/start`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true
      }
    );

    if (status !== 200) {
		throw HttpError.BadRequest('Bad request for start Daily recording');
	}

    return DailyRecordingActionResponseSchema.parse(data);

}

/**
 * Stop a recording for a Daily.co room.
 * @param roomName The Daily.co room name (not the full URL)
 * @returns The response from Daily.co
 * @throws If the API call fails
 */
export async function stopDailyRecording(roomName: string): Promise<DailyRecordingActionResponse> {
  console.log('Stopping Daily.co recording for room:', roomName);
    const { data, status } = await axios.post<unknown>(
      `https://api.daily.co/v1/rooms/${roomName}/recordings/stop`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
		validateStatus: () => true
      }
    );

    if (status !== 200) {
		throw HttpError.BadRequest('Bad request for stop Daily recording');
	}

    return DailyRecordingActionResponseSchema.parse(data);

}
