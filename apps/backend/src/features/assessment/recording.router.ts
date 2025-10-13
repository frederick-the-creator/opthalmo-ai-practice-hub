import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '@/utils/supabaseClient.js'
import { startDailyRecording, stopDailyRecording } from '@/features/assessment/recording.service.js';

const recordingRouter = Router()

// Start recording endpoint: starts a Daily.co recording for a given roomUrl
recordingRouter.post('/start', requireSupabaseUser, async (req: Request, res: Response) => {
  const { roomUrl } = req.body;

  if (!roomUrl) {
    return res.status(400).json({ error: 'Missing roomUrl' });
  }

  try {
    // Extract room name from URL (last segment)
    const urlParts = roomUrl.split('/');
    const roomName = urlParts[urlParts.length - 1];

    if (!roomName) {
      return res.status(400).json({ error: 'Invalid roomUrl' });
    }

    // Start recording via Daily.co
    const recording = await startDailyRecording(roomName);
    res.json({ recording });

  } catch (err: any) {
    console.error('Error starting recording:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to start recording' });
  }
});
  
// Stop recording endpoint: stops a Daily.co recording for a given roomUrl
recordingRouter.post('/stop', requireSupabaseUser, async (req: Request, res: Response) => {
  const { roomUrl, roomId } = req.body;

  if (!roomUrl || !roomId) {
    console.log('Missing roomUrl or roomId');
    return res.status(400).json({ error: 'Missing roomUrl or roomId' });
  }

  try {
    // 1. Stop the recording
    const urlParts = roomUrl.split('/');
    const roomName = urlParts[urlParts.length - 1];

    if (!roomName) {
      return res.status(400).json({ error: 'Invalid roomUrl' });
    }

    const stopResult = await stopDailyRecording(roomName);

    // Respond to the client immediately after stopping the recording
    res.json({ stopResult });

  } catch (err: any) {
    console.error('Error in stop-recording workflow:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to process stop-recording workflow' });
  }
});

export default recordingRouter