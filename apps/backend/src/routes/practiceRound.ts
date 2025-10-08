import {Router, Request, Response} from 'express'
import { requireSupabaseUser } from '@/utils/supabaseClient.js'
import { createRoundWithReturn, updatePracticeRoundWithReturn } from '@/repositories/practiceRound.js';

const roundRouter = Router()

roundRouter.post('/create', requireSupabaseUser, async (req: Request, res: Response) => {
    const { createFields } = req.body;

    try {
      const supabaseAuthenticated = req.supabaseAsUser!;
      const round = await createRoundWithReturn(supabaseAuthenticated, createFields);
      res.json({ round });
    } catch (err: any) {
      console.error('Error creating round:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to create round' });
    }
});

roundRouter.post('/update', requireSupabaseUser, async (req: Request, res: Response) => {
    const { updateFields } = req.body;

    try {
      const supabaseAuthenticated = req.supabaseAsUser!;
      const round = await updatePracticeRoundWithReturn(supabaseAuthenticated, updateFields);
      res.json({ round });
    } catch (err: any) {
      console.error('Error updating round:', err.response?.data || err.message);
      res.status(500).json({ error: err.message || 'Failed to update round' });
    }
});

export default roundRouter