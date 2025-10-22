import {Router} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js'
import { validate } from '@/middleware/validate.middleware.js'
import { runAssessmentSchemaAPI } from '@/features/assessment/assessment.schema.js'
import { runAssessmentController } from '@/features/assessment/assessment.controller.js'

const assessmentRouter = Router()

// Router: thin, using auth, schema validation, then controller
assessmentRouter.post(
	'/',
	requireSupabaseUser,
	validate(runAssessmentSchemaAPI),
	runAssessmentController
)

export default assessmentRouter