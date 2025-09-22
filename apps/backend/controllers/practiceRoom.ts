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

// roomRouter.post('/set-stage', async (req: Request, res: Response) => {
//     const { roomId, stage } = req.body;
//     if (!roomId || typeof stage !== 'string') {
//       return res.status(400).json({ error: 'Missing roomId or stage' });
//     }
//     try {
//       const room = await updatePracticeRoomWithReturn({roomId, stage });
//       res.json({ room });
//     } catch (err: any) {
//       console.error('Error setting stage:', err.response?.data || err.message);
//       res.status(500).json({ error: err.message || 'Failed to set stage' });
//     }
// });

export default roomRouter