import {Router} from 'express'
import { requireSupabaseUser } from '@/middleware/auth.middleware.js'
import { validate } from '@/middleware/validate.middleware.js'
import { startRecordingController, stopRecordingController } from '@/features/assessment/recording.controller.js'
import { RecordingSchemaAPI } from '@/features/assessment/recording.schema.js'

const recordingRouter = Router()

// Router keeps minimal logic: auth -> validate -> controller
recordingRouter.post(
  '/start',
  requireSupabaseUser,
  validate(RecordingSchemaAPI),
  startRecordingController
)

recordingRouter.post(
  '/stop',
  requireSupabaseUser,
  validate(RecordingSchemaAPI),
  stopRecordingController
)

export default recordingRouter