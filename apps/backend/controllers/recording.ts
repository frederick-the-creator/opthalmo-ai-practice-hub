import {Router, Request, Response} from 'express'
import { startDailyRecording, stopDailyRecording, transcribe } from '../services/recording';

const recordingRouter = Router()

// Start recording endpoint: starts a Daily.co recording for a given room_url
recordingRouter.post('/start', async (req: Request, res: Response) => {
  const { room_url } = req.body;

  if (!room_url) {
    return res.status(400).json({ error: 'Missing room_url' });
  }

  try {
    // Extract room name from URL (last segment)
    const urlParts = room_url.split('/');
    const roomName = urlParts[urlParts.length - 1];

    if (!roomName) {
      return res.status(400).json({ error: 'Invalid room_url' });
    }

    // Start recording via Daily.co
    const recording = await startDailyRecording(roomName);
    res.json({ recording });

  } catch (err: any) {
    console.error('Error starting recording:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to start recording' });
  }
});
  
// Stop recording endpoint: stops a Daily.co recording for a given room_url
recordingRouter.post('/stop', async (req: Request, res: Response) => {
  const { room_url, sessionId } = req.body;

  if (!room_url || !sessionId) {
    console.log('Missing room_url or sessionId');
    return res.status(400).json({ error: 'Missing room_url or sessionId' });
  }

  try {
    // 1. Stop the recording
    const urlParts = room_url.split('/');
    const roomName = urlParts[urlParts.length - 1];

    if (!roomName) {
      return res.status(400).json({ error: 'Invalid room_url' });
    }

    const stopResult = await stopDailyRecording(roomName);

    // Respond to the client immediately after stopping the recording
    res.json({ stopResult });

  } catch (err: any) {
    console.error('Error in stop-recording workflow:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to process stop-recording workflow' });
  }
});

// Transcription endpoint: triggers transcription for the latest recording of a room
recordingRouter.post('/transcribe', async (req: Request, res: Response) => {
  const { room_url, sessionId } = req.body;

  if (!room_url || !sessionId) {
    console.log('Missing room_url or sessionId');
    return res.status(400).json({ error: 'Missing room_url or sessionId' });
  }

  // Extract room name from URL (last segment)
  const urlParts = room_url.split('/');
  const roomName = urlParts[urlParts.length - 1];

  if (!roomName) {
    return res.status(400).json({ error: 'Invalid room_url' });
  }

  // Respond immediately and run transcription in the background
  res.json({ started: true });

  (async () => {
    try {
      await transcribe(roomName, sessionId);
    } catch (err: any) {
      console.error('Error in transcription workflow:', err.response?.data || err.message);
    }
  })();
});

export default recordingRouter