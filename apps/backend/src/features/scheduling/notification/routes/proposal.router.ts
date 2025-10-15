import { Router, Request, Response } from 'express'
import { validateMagicTokenReturnPaylad } from '@/features/scheduling/notification/services/buildNotification/magicLink.service.js'
import { createPendingProposal } from '@/features/scheduling/notification/repos/proposal.repo.js'
import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { getPracticeRoomById } from '@/features/scheduling/practiceRoom/practiceRoom.repo.js'
import { requestCounterpartyApproval, decideByToken } from '@/features/scheduling/notification/services/proposal.service.js'

const proposalRouter = Router()

// Public: Route for retrieving room details and validating token
proposalRouter.get('/room', async (req: Request, res: Response) => {

    // Extract and validate token from query, extracting payload from token. Payload contains room id
    const token = String(req.query.r)
    const payload = await validateMagicTokenReturnPaylad(token, 'reschedule_propose')

	// Retrieve room
	const admin = createAdminSupabaseClient()
	const room = await getPracticeRoomById(admin, payload.roomId)
	const startUtc = room.startUtc
	const endUtc = room.endUtc
    
    return res.json({ ok: true, uid: payload.uid, startUtc, endUtc })
})

// Route to submit a proposal using the UI form, where details are provided from decrypted token
proposalRouter.post('/propose', async (req: Request, res: Response) => {
  try {
    const { token, proposedStartUtc, proposedEndUtc, note } = req.body || {}
    if (!token || !proposedStartUtc || !proposedEndUtc) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const payload = await validateMagicTokenReturnPaylad(token, 'reschedule_propose')

    // Persist proposal
    if (!payload.roomId) return res.status(400).json({ error: 'Missing room in token' })
    const proposalId = await createPendingProposal({
      roomId: payload.roomId,
      uid: payload.uid,
      proposedBy: payload.actorRole,
      proposerEmail: payload.actorEmail,
      proposedStartUtc,
      proposedEndUtc,
      note: note ?? null,
    })

    // Issue decision links via service and notify counterparty
    await requestCounterpartyApproval({
      roomId: payload.roomId,
      uid: payload.uid,
      proposerRole: payload.actorRole,
      proposerEmail: payload.actorEmail,
      proposalId,
    })

    return res.json({ ok: true, proposalId })
  } catch (e: any) {
    console.log(e?.message)
    return res.status(400).json({ error: e?.message || 'Invalid token or request' })
  }
})

// (Approve/Decline endpoints retired in favor of single-link decision flow)

// Decision flow (single-link): validate token for page load
proposalRouter.get('/decision', async (req: Request, res: Response) => {
  try {
    const token = String(req.query.t || '')
    if (!token) return res.status(400).json({ error: 'Missing token' })
    const payload = await validateMagicTokenReturnPaylad(token, 'reschedule_decide')
    let startUtc: string | null = null
    let endUtc: string | null = null
    const proposedStartUtc = (payload as any).proposedStartUtc ?? null
    const proposedEndUtc = (payload as any).proposedEndUtc ?? null
    if (payload.roomId) {
      const admin = createAdminSupabaseClient()
      try {
        const room = await getPracticeRoomById(admin, payload.roomId)
        startUtc = room.startUtc
        endUtc = room.endUtc
      } catch (_e) {}
    }
    return res.json({ ok: true, uid: payload.uid, proposalId: payload.proposalId ?? null, startUtc, endUtc, proposedStartUtc, proposedEndUtc })
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Invalid token' })
  }
})

// Decision flow submit: { token, action, proposedStartUtc?, proposedEndUtc?, note? }
proposalRouter.post('/decision', async (req: Request, res: Response) => {
  try {
    const { token, action, proposedStartUtc, proposedEndUtc, note } = req.body || {}
    if (!token || !action) return res.status(400).json({ error: 'Missing fields' })
    const result = await decideByToken(token, action, { proposedStartUtc, proposedEndUtc, note })
    return res.json(result)
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Invalid request' })
  }
})

export default proposalRouter


