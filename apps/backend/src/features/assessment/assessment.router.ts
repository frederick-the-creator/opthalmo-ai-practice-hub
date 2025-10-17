import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js'
import { runAssessment } from '@/features/assessment/assessment.service.js';

const assessmentRouter = Router()

// Transcription endpoint: triggers transcription for the latest recording of a room
assessmentRouter.post('/', requireSupabaseUser, async (req: Request, res: Response) => {
  const { roomUrl, roomId, roundId, caseName } = req.body;

  if (!roomUrl || !roomId || !roundId || !caseName) {
    console.log('Missing roomUrl, roomId, roundId or caseName');
    return res.status(400).json({ error: 'Missing roomUrl, roomId, roundId or caseName' });
  }

  // Extract room name from URL (last segment)
  const urlParts = roomUrl.split('/');
  const roomName = urlParts[urlParts.length - 1];

  if (!roomName) {
    return res.status(400).json({ error: 'Invalid roomUrl' });
  }

  try {
    const supabaseAuthenticated = req.supabaseAsUser!;
    const assessment = await runAssessment(supabaseAuthenticated, roomName, roomId, roundId, caseName);
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