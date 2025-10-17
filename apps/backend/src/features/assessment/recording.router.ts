import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js'
import { startDailyRecording, stopDailyRecording } from '@/features/assessment/recording.service.js';

const recordingRouter = Router()

interface StartRecordingBody { roomUrl: string }
interface StopRecordingBody { roomUrl: string; roomId: string }

// Start recording endpoint: starts a Daily.co recording for a given roomUrl
recordingRouter.post('/start', requireSupabaseUser, async (req: Request<unknown, unknown, StartRecordingBody>, res: Response) => {
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
    const recording: unknown = await startDailyRecording(roomName);
    return res.json({ recording });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start recording';
    console.error('Error starting recording:', message);
    return res.status(500).json({ error: message });
  }
});
  
// Stop recording endpoint: stops a Daily.co recording for a given roomUrl
recordingRouter.post('/stop', requireSupabaseUser, async (req: Request<unknown, unknown, StopRecordingBody>, res: Response) => {
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

    const stopResult: unknown = await stopDailyRecording(roomName);

    // Respond to the client immediately after stopping the recording
    return res.json({ stopResult });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process stop-recording workflow';
    console.error('Error in stop-recording workflow:', message);
    return res.status(500).json({ error: message });
  }
});

export default recordingRouter