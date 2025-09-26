import {Router, Request, Response} from 'express'
import { createPracticeRoom } from '../services/practiceRoom';
import { updatePracticeRoomWithReturn } from '../repositories/practiceRoom';

const roomRouter = Router()

// Create room endpoint: creates Daily room, then inserts room in Supabase
roomRouter.post('/create', async (req: Request, res: Response) => {
    console.log('create route hit')
    const { createFields } = req.body;
    console.log('createFields', createFields)

    try {
      const room = await createPracticeRoom(createFields);
      res.json({ room });
      
    } catch (error: any) {
      console.error('Error creating room:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to create room' });
    }
});
  
roomRouter.post('/update', async (req: Request, res: Response) => {

    const { updateFields } = req.body;

    try {
      const room = await updatePracticeRoomWithReturn(updateFields);
      res.json({ room });
    } catch (err: any) {
      console.error('Error accepting invitation:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to accept invitation' });
    }
});

export default roomRouter