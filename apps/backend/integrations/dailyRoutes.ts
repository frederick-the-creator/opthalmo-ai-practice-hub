import axios from 'axios';

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

/**
 * Start a recording for a Daily.co room.
 * @param roomName The Daily.co room name (not the full URL)
 * @returns The recording object from Daily.co
 * @throws If the API call fails
 */
export async function startDailyRecording(roomName: string): Promise<any> {
  try {
    const dailyRes = await axios.post(
      `https://api.daily.co/v1/rooms/${roomName}/recordings/start`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return dailyRes.data;
  } catch (error: any) {
    console.error('Error starting recording:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || error.message || 'Failed to start Daily.co recording');
  }
}

/**
 * Stop a recording for a Daily.co room.
 * @param roomName The Daily.co room name (not the full URL)
 * @returns The response from Daily.co
 * @throws If the API call fails
 */
export async function stopDailyRecording(roomName: string): Promise<any> {
  try {
    const dailyRes = await axios.post(
      `https://api.daily.co/v1/rooms/${roomName}/recordings/stop`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return dailyRes.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to stop Daily.co recording');
  }
} 