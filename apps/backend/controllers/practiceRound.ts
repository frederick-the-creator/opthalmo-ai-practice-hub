import {Router, Request, Response} from 'express'
import { updatePracticeRoundWithReturn } from '../repositories/practiceRound';

const roundRouter = Router()

roundRouter.post('/set-candidate', async (req: Request, res: Response) => {
    const { roundId, candidateId } = req.body;
    if (!roundId || !candidateId) {
      return res.status(400).json({ error: 'Missing roundId or candidateId' });
    }
    try {
      const round = await updatePracticeRoundWithReturn({ roundId, candidateId });
      res.json({ round });
    } catch (err: any) {
      console.error('Error setting candidate:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to set candidate' });
    }
});
  
roundRouter.post('/set-case', async (req: Request, res: Response) => {
    const { roundId, caseBriefId } = req.body;
    if (!roundId || !caseBriefId) {
      return res.status(400).json({ error: 'Missing roundId or caseBriefId' });
    }
    try {
      const round = await updatePracticeRoundWithReturn({roundId, caseBriefId });
      res.json({ round });
    } catch (err: any) {
      console.error('Error setting case:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to set case' });
    }
});

export default roundRouter