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
    throw new Error(error.response?.data?.error || error.message || 'Failed to create Daily.co room');
  }
} 