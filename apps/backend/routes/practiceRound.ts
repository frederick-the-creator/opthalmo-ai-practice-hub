import {Router, Request, Response} from 'express'
import { createRoundWithReturn, updatePracticeRoundWithReturn } from '../repositories/practiceRound';

const roundRouter = Router()

roundRouter.post('/create', async (req: Request, res: Response) => {
    const { createFields } = req.body;

    try {
      const round = await createRoundWithReturn(createFields);
      res.json({ round });
    } catch (err: any) {
      console.error('Error creating round:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to create round' });
    }
});

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