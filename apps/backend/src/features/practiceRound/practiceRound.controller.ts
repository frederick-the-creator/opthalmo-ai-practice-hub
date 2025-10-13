import type { RequestHandler } from 'express'
import type { PracticeRound } from '@/features/practiceRound/practiceRound.types.js'
import type { NewRoundBody } from '@/features/practiceRound/practiceRound.schemas.js'
import type { AuthenticatedRequest } from '@/utils/supabaseClient.js'
import type { ParamsDictionary } from 'express-serve-static-core'
import { HttpError } from '@/lib/httpError.js'
import { createRoundWithReturn } from '@/features/practiceRound/practiceRound.repo.js'

export const createPracticeRoundController: RequestHandler<
    ParamsDictionary,
    PracticeRound,
    NewRoundBody
> = async (req, res) => {
    if (!('supabaseAsUser' in req)) {
        throw HttpError.Unauthorized('Expected authenticated request');
    }

    const supabase = (req as AuthenticatedRequest).supabaseAsUser;
    const round = await createRoundWithReturn(supabase, req.body);

    res.status(201).json(round);
}
