import {Router} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js';
import { validate } from '@/middleware/validate.middleware.js'
import { newRoundSchemaAPI, updateRoundSchemaAPI } from '@/features/practiceRound/practiceRound.schemas.js'
import { createPracticeRoundController, updatePracticeRoundController } from '@/features/practiceRound/practiceRound.controller.js'

const roundRouter = Router()

roundRouter.post(
  '/create',
  requireSupabaseUser,
  validate(newRoundSchemaAPI),
  createPracticeRoundController
);

roundRouter.post(
  '/update',
  requireSupabaseUser,
  validate(updateRoundSchemaAPI),
  updatePracticeRoundController
)

export default roundRouter