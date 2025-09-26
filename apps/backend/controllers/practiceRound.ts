import {Router, Request, Response} from 'express'
import { updatePracticeRoundWithReturn } from '../repositories/practiceRound';

const roundRouter = Router()

roundRouter.post('/update', async (req: Request, res: Response) => {
    const { updateFields } = req.body;

    try {
      const round = await updatePracticeRoundWithReturn(updateFields);
      res.json({ round });
    } catch (err: any) {
      console.error('Error updating round:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to update round' });
    }
});

export default roundRouter