import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import cors from 'cors';
import { updatePracticeSession, createPracticeSession, uploadTranscriptionToStorage } from './integrations/supabaseRoutes';
import { createDailyRoom, startDailyRecording, stopDailyRecording, submitTranscriptionJob, pollTranscriptionStatus, fetchTranscriptionJson, getLatestRecordingId } from './integrations/dailyRoutes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Create session endpoint: creates Daily room, then inserts session in Supabase
app.post('/api/create-session', async (req: Request, res: Response) => {

  const { host_id, type, datetime_utc } = req.body;
  console.log('Backend API Route - datetime_utc', datetime_utc);
  if (!host_id || !type || !datetime_utc) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // 1. Create Daily.co room
    const roomUrl = await createDailyRoom();
    console.log('Daily.co room created:', roomUrl);

    // 2. Insert into Supabase
    console.log('Backend API Route - datetime_utc', datetime_utc);
    const { data } = await createPracticeSession({ host_id, type, room_url: roomUrl, datetime_utc });
    res.json({ session: data[0] });
    
  } catch (error: any) {
    console.error('Error creating session:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/sessions/accept-invite', async (req: Request, res: Response) => {
  const { sessionId, guestId } = req.body;
  if (!sessionId || !guestId) {
    return res.status(400).json({ error: 'Missing sessionId or guestId' });
  }
  try {
    const { data, error } = await updatePracticeSession(sessionId, { guest_id: guestId });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ session: data[0] });
  } catch (err: any) {
    console.error('Error accepting invitation:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to accept invitation' });
  }
});

app.post('/api/sessions/set-candidate', async (req: Request, res: Response) => {
  const { sessionId, candidateId } = req.body;
  if (!sessionId || !candidateId) {
    return res.status(400).json({ error: 'Missing sessionId or candidateId' });
  }
  try {
    const { data, error } = await updatePracticeSession(sessionId, { candidate_id: candidateId });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ session: data[0] });
  } catch (err: any) {
    console.error('Error setting candidate:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to set candidate' });
  }
});

app.post('/api/sessions/set-case', async (req: Request, res: Response) => {
  const { sessionId, caseId } = req.body;
  if (!sessionId || !caseId) {
    return res.status(400).json({ error: 'Missing sessionId or caseId' });
  }
  try {
    const session = await updatePracticeSession(sessionId, { case_id: caseId });
    res.json({ session });
  } catch (err: any) {
    console.error('Error setting case:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to set case' });
  }
});

app.post('/api/sessions/set-stage', async (req: Request, res: Response) => {
  const { sessionId, version } = req.body;
  if (!sessionId || typeof version !== 'number') {
    return res.status(400).json({ error: 'Missing sessionId or version' });
  }
  try {
    const session = await updatePracticeSession(sessionId, { version });
    res.json({ session });
  } catch (err: any) {
    console.error('Error setting stage:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to set stage' });
  }
});

// Start recording endpoint: starts a Daily.co recording for a given room_url
app.post('/api/sessions/start-recording', async (req: Request, res: Response) => {
  console.log('Starting recording endpoint');
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
app.post('/api/sessions/stop-recording', async (req: Request, res: Response) => {
  console.log('Stopping recording endpoint 1');
  const { room_url, sessionId } = req.body;
  console.log('room_url:', room_url);
  console.log('sessionId:', sessionId);
  if (!room_url || !sessionId) {
    console.log('Missing room_url or sessionId');
    return res.status(400).json({ error: 'Missing room_url or sessionId' });
  }
  try {
    // 1. Stop the recording
    const urlParts = room_url.split('/');
    console.log('urlParts:', urlParts);
    const roomName = urlParts[urlParts.length - 1];
    console.log('roomName:', roomName);
    if (!roomName) {
      return res.status(400).json({ error: 'Invalid room_url' });
    }
    const stopResult = await stopDailyRecording(roomName);
    console.log('stopResult:', stopResult);

    // Respond to the client immediately after stopping the recording
    res.json({ stopResult });

    // Run the rest of the workflow in the background
    (async () => {
      try {
        // 2. Get the latest recording ID for the room
        const recordingId = await getLatestRecordingId(roomName);
        console.log('latest recordingId:', recordingId);
        if (!recordingId) {
          console.error('No recording ID found for room');
          return;
        }
        // 3. Submit transcription job
        console.log('Submitting transcription job for recording:', recordingId);
        const { transcription_id } = await submitTranscriptionJob(recordingId);
        // 4. Poll for transcription completion
        console.log('Polling transcription status for:', transcription_id);
        const transcriptionResult = await pollTranscriptionStatus(transcription_id);
        // 5. Fetch the transcription JSON
        console.log('Fetching transcription JSON for:', transcriptionResult);
        const transcriptionJson = await fetchTranscriptionJson(transcriptionResult);
        console.log('transcriptionJson:', transcriptionJson);
        // 6. Upload to Supabase Storage
        console.log('Uploading transcription to Supabase Storage for session:', sessionId);
        const storageUrl = await uploadTranscriptionToStorage(sessionId, transcriptionJson);
        // 7. Log completion
        console.log('Transcription and upload complete:', { recordingId, transcription_id, transcription_status: transcriptionResult.status, storageUrl });
      } catch (err: any) {
        console.error('Error in background stop-recording workflow:', err.response?.data || err.message);
      }
    })();
  } catch (err: any) {
    console.error('Error in stop-recording workflow:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to process stop-recording workflow' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});