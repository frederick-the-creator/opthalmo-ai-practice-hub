import {Router, Request, Response} from 'express'
import { runAssessment } from '../services/assessment';

const assessmentRouter = Router()

// Transcription endpoint: triggers transcription for the latest recording of a room
assessmentRouter.post('/', async (req: Request, res: Response) => {
  const { room_url, roomId, roundId, case_name } = req.body;

  if (!room_url || !roomId || !roundId || !case_name) {
    console.log('Missing room_url, roomId, roundId or case_name');
    return res.status(400).json({ error: 'Missing room_url, roomId, roundId or case_name' });
  }

  // Extract room name from URL (last segment)
  const urlParts = room_url.split('/');
  const roomName = urlParts[urlParts.length - 1];

  if (!roomName) {
    return res.status(400).json({ error: 'Invalid room_url' });
  }

  try {
    const assessment = await runAssessment(roomName, roomId, roundId, case_name);
    return res.json({ assessment });

  } catch (err: any) {
    console.error('Error in assessment workflow:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message || 'Internal server error' });
  }

});


// Replace transcription route with generate
// Add gemini utility
// Create service in assessment to take transcriptjson from transcribe function and pass to gemini

export default assessmentRouter