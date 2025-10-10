import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js'
import { newRoomSchema } from '@/validation/practiceRoom.schemas.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { createPracticeRoomController } from '@/controllers/practiceRoom.controller.js'


const roomRouter = Router()

// Router
/*
All middleware passed must be a function that returns void and accepts the standard typed parameters (req: Request, res: Response, next: NextFunction) => void
  - requireSupabaseUser - Sync wrapper function that when run it triggers the nested async IIFE (Immediately Invoked Function Expression)
  - validate(newRoomSchema) - Calling validate at startup / runtime returns a function specific to newRoomSchema ready to be called when the route is hit. 
*/
roomRouter.post(
	'/create',
	requireSupabaseUser, // Authenticate user
	validate(newRoomSchema), // Add room parser using Zod to guarantee req.body is correct schema at runtime
	createPracticeRoomController
);


import { updatePracticeRoomGuarded, deletePracticeRoomGuarded } from '@/services/practiceRoom/practiceRoom.service.js';
import type { PracticeRoomUpdate } from '@/types/index.js';
import { HttpError } from '@/lib/httpError.js';

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

export default roomRouter