import {Router, Request, Response} from 'express'
import { createPracticeRoom, updateSupabaseRoom, updateSupabaseRound } from '../services/room';

const roomRouter = Router()

// Create room endpoint: creates Daily room, then inserts room in Supabase
roomRouter.post('/create-room', async (req: Request, res: Response) => {

    const { host_id, type, datetime_utc, private: isPrivate } = req.body;

    if (!host_id || !type || !datetime_utc) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
      const room = await createPracticeRoom({ host_id, type, datetime_utc, private: !!isPrivate });
      res.json({ room });
      
    } catch (error: any) {
      console.error('Error creating room:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create room' });
    }
});
  
roomRouter.post('/accept-invite', async (req: Request, res: Response) => {
    const { roomId, guestId } = req.body;
    if (!roomId || !guestId) {
      return res.status(400).json({ error: 'Missing roomId or guestId' });
    }
    try {
      const { data, error } = await updateSupabaseRoom(roomId, { guest_id: guestId });
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ room: data[0] });
    } catch (err: any) {
      console.error('Error accepting invitation:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to accept invitation' });
    }
});
  
roomRouter.post('/set-round-candidate', async (req: Request, res: Response) => {
    const { roundId, candidateId } = req.body;
    if (!roundId || !candidateId) {
      return res.status(400).json({ error: 'Missing roundId or candidateId' });
    }
    try {
      const { data, error } = await updateSupabaseRound(roundId, { candidate_id: candidateId });
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ room: data[0] });
    } catch (err: any) {
      console.error('Error setting candidate:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to set candidate' });
    }
});
  
roomRouter.post('/set-round-case', async (req: Request, res: Response) => {
    const { roundId, caseBriefId } = req.body;
    if (!roundId || !caseBriefId) {
      return res.status(400).json({ error: 'Missing roundId or caseBriefId' });
    }
    try {
      const room = await updateSupabaseRound(roundId, { case_brief_id: caseBriefId });
      res.json({ room });
    } catch (err: any) {
      console.error('Error setting case:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to set case' });
    }
});
  
roomRouter.post('/set-stage', async (req: Request, res: Response) => {
    const { roomId, stage } = req.body;
    if (!roomId || typeof stage !== 'number') {
      return res.status(400).json({ error: 'Missing roomId or stage' });
    }
    try {
      const room = await updateSupabaseRoom(roomId, { stage });
      res.json({ room });
    } catch (err: any) {
      console.error('Error setting stage:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to set stage' });
    }
});

export default roomRouter