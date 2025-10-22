import type { RequestHandler } from 'express'
import { HttpError } from '@/lib/httpError.js'
import type { AuthenticatedRequest } from '@/middleware/auth.middleware.js'
import { runAssessment } from '@/features/assessment/assessment.service.js'
import type { RunAssessmentBody } from '@/features/assessment/assessment.schema.js'
import type { ParamsDictionary } from 'express-serve-static-core'
import type { Assessment } from '@/features/assessment/assessment.schema.js'


export const runAssessmentController: RequestHandler<
    ParamsDictionary,
    Assessment,
    RunAssessmentBody
> = async (req, res) => {
  if (!('supabaseAsUser' in req)) {
    throw HttpError.Unauthorized('Expected authenticated request')
  }

  const { roomUrl, roomId, roundId, caseName } = req.body

  // Extract room name from URL (last segment)
  const urlParts = roomUrl.split('/')
  const roomName = urlParts[urlParts.length - 1]
  if (!roomName) {
    throw HttpError.BadRequest('Invalid roomUrl')
  }

  const supabase = (req as AuthenticatedRequest).supabaseAsUser
  const params = { roomName, roomId, roundId, caseName }
  const assessment = await runAssessment(supabase, params)
  res.status(200).json(assessment)

}