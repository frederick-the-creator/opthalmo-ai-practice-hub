import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '../utils/supabase'
import { createPracticeRoom } from '../services/practiceRoom';
import { updatePracticeRoomWithReturn } from '../repositories/practiceRoom';

const roomRouter = Router()

// Create room endpoint: creates Daily room, then inserts room in Supabase
roomRouter.post('/create', requireSupabaseUser, async (req: Request, res: Response) => {
    const { createFields } = req.body;

    try {
      const supabaseAuthenticated = req.supabaseAsUser!;
      const room = await createPracticeRoom(supabaseAuthenticated, createFields);
      res.json({ room });
      
    } catch (error: any) {
      console.error('Error creating room:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create room' });
    }
});
  
roomRouter.post('/update', requireSupabaseUser, async (req: Request, res: Response) => {

    const { updateFields } = req.body;

    try {
      const supabaseAuthenticated = req.supabaseAsUser!;
      const room = await updatePracticeRoomWithReturn(supabaseAuthenticated, updateFields);
      res.json({ room });
    } catch (err: any) {
      console.error('Error accepting invitation:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to accept invitation' });
    }
});

export default roomRouter