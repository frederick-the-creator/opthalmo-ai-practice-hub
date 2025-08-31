import {Router, Request, Response} from 'express'
import { updatePracticeSession } from '../services/session';
import { createSession } from '../services/session';

const sessionRouter = Router()

// Create session endpoint: creates Daily room, then inserts session in Supabase
sessionRouter.post('/create-session', async (req: Request, res: Response) => {

    const { host_id, type, datetime_utc, private: isPrivate } = req.body;
    if (!host_id || !type || !datetime_utc) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const session = await createSession({ host_id, type, datetime_utc, private: !!isPrivate });
      res.json({ session });
      
    } catch (error: any) {
      console.error('Error creating session:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create session' });
    }
});
  
sessionRouter.post('/accept-invite', async (req: Request, res: Response) => {
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
  
sessionRouter.post('/set-candidate', async (req: Request, res: Response) => {
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
  
sessionRouter.post('/set-case', async (req: Request, res: Response) => {
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
  
sessionRouter.post('/set-stage', async (req: Request, res: Response) => {
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

export default sessionRouter