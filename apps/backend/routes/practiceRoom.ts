import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '../utils/supabase'
import { createPracticeRoom, updatePracticeRoomGuarded, deletePracticeRoomGuarded } from '../services/practiceRoom/practiceRoom';
import { HttpError } from '../utils/httpError';
import { updatePracticeRoomWithReturn } from '../repositories/practiceRoom';
import type { PracticeRoomUpdate } from '../types';

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
    console.log('Update route')
    const { updateFields } = req.body as { updateFields: PracticeRoomUpdate };

    try {
      const supabaseAuthenticated = req.supabaseAsUser!;
      const currentUserId = req.supabaseUser?.id as string;

      const room = await updatePracticeRoomGuarded(supabaseAuthenticated, currentUserId, updateFields);
      res.json({ room });
    } catch (err: any) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error('Error updating practice room:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to update practice room' });
    }
});

export default roomRouter
  
// Delete room endpoint: deletes dependent rounds then the room
roomRouter.delete('/:roomId', requireSupabaseUser, async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const supabaseAuthenticated = req.supabaseAsUser!;
    const currentUserId = req.supabaseUser?.id as string;
    const result = await deletePracticeRoomGuarded(supabaseAuthenticated, currentUserId, roomId);
    res.json(result);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Error deleting practice room:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to delete practice room' });
  }
});