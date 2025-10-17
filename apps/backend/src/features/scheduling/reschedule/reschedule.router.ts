import { Router } from 'express'
import { validate } from '@/middleware/validate.middleware.js'
import { getRoomForRescheduleSchemaAPI, proposeRescheduleSchemaAPI, decisionGetSchemaAPI, decisionPostSchemaAPI } from '@/features/scheduling/reschedule/reschedule.schema.js'
import { getRoomForResscheduleController, proposeRescheduleController, validateDecisionDetailsController, decideController } from '@/features/scheduling/reschedule/reschedule.controller.js'

const rescheduleRouter = Router()

// Public: Route for retrieving room details and validating token
rescheduleRouter.get(
  '/',
  validate(getRoomForRescheduleSchemaAPI),
  getRoomForResscheduleController
)

// Route to submit a proposal using the UI form, where details are provided from decrypted token
rescheduleRouter.post(
  '/propose',
  validate(proposeRescheduleSchemaAPI),
  proposeRescheduleController
)

// Decision flow (single-link): validate token for page load
rescheduleRouter.get(
  '/decision',
  validate(decisionGetSchemaAPI),
  validateDecisionDetailsController
)

// Decision flow submit: { token, action, proposedStartUtc?, proposedEndUtc?, note? }
rescheduleRouter.post(
  '/decision',
  validate(decisionPostSchemaAPI),
  decideController
)

export default rescheduleRouter


