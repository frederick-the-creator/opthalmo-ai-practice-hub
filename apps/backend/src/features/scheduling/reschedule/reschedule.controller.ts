import type { RequestHandler } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { getPracticeRoomById } from '@/features/scheduling/practiceRoom/practiceRoom.repo.js'
import { validateMagicTokenReturnPaylad } from '@/features/scheduling/notification/services/buildNotification/magicLink.service.js'
import type { GetRoomForRescheduleQuery, ProposeRescheduleBody, DecisionGetQuery, DecisionPostBody } from '@/features/scheduling/reschedule/reschedule.schema.js'
import { createPendingProposal } from '@/features/scheduling/reschedule/reschedule.repo.js'
import { requestCounterpartyApproval, decideByToken } from '@/features/scheduling/reschedule/reschedule.service.js'

type GetRoomForRescheduleResponse = {
  ok: true
  uid: string
  startUtc: string | null
  endUtc: string | null
}

export const getRoomForResscheduleController: RequestHandler<
  ParamsDictionary,
  GetRoomForRescheduleResponse,
  unknown,
  GetRoomForRescheduleQuery
> = async (req, res) => {

  const token = req.query.token
  const payload = await validateMagicTokenReturnPaylad(token)

  const admin = createAdminSupabaseClient()
  const room = await getPracticeRoomById(admin, payload.roomId)

  const startUtc = room.startUtc
  const endUtc = room.endUtc

  res.json({ ok: true, uid: payload.uid, startUtc, endUtc })
}

type ProposeResponse = { ok: true; proposalId: string }

export const proposeRescheduleController: RequestHandler<
  ParamsDictionary,
  ProposeResponse,
  ProposeRescheduleBody
> = async (req, res) => {

  const { token, proposedStartUtc, proposedEndUtc, note } = req.body

  const payload = await validateMagicTokenReturnPaylad(token)

  const proposal = await createPendingProposal({
    roomId: payload.roomId,
    uid: payload.uid,
    proposedBy: payload.actorRole,
    proposerEmail: payload.actorEmail,
    proposedStartUtc,
    proposedEndUtc,
    note: note ?? null,
  })

  const proposalId = proposal.id

  await requestCounterpartyApproval({
    roomId: payload.roomId,
    uid: payload.uid,
    proposerRole: payload.actorRole,
    proposerEmail: payload.actorEmail,
    proposalId,
  })

  res.json({ ok: true, proposalId })
}

type DecisionGetResponse = { ok: true; uid: string; proposalId: string | null; startUtc: string | null; endUtc: string | null; proposedStartUtc: string | null; proposedEndUtc: string | null }

export const validateDecisionDetailsController: RequestHandler<
  ParamsDictionary,
  DecisionGetResponse,
  unknown,
  DecisionGetQuery
> = async (req, res) => {
  const token = String(req.query.t)
  const payload = await validateMagicTokenReturnPaylad(token)
  let startUtc: string | null = null
  let endUtc: string | null = null
  const proposedStartUtc = payload.proposedStartUtc ?? null
  const proposedEndUtc = payload.proposedEndUtc ?? null
  if (payload.roomId) {
    const admin = createAdminSupabaseClient()
    const room = await getPracticeRoomById(admin, payload.roomId)
    startUtc = room.startUtc
    endUtc = room.endUtc
  }
  res.json({ ok: true, uid: payload.uid, proposalId: payload.proposalId ?? null, startUtc, endUtc, proposedStartUtc, proposedEndUtc })
}

type DecisionPostResponse = { ok: boolean }

export const decideController: RequestHandler<
  ParamsDictionary,
  DecisionPostResponse,
  DecisionPostBody
> = async (req, res) => {
  const { token, action, proposedStartUtc, proposedEndUtc, note } = req.body
  const result = await decideByToken(token, action, { proposedStartUtc, proposedEndUtc, note })
  res.json(result)
}