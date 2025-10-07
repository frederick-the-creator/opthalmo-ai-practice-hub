import { Router, Request, Response } from 'express'
import { validateMagicToken } from '../services/proposals/magicLink'
import { createPendingProposal } from '../repositories/proposal'
import { createAdminSupabaseClient, type TypedSupabaseClient } from '../utils/supabaseClient'
import { getPracticeRoomById } from '../repositories/practiceRoom'
import { issueDecisionLinksAndNotify, decideByToken } from '../services/proposals/proposal'

const proposalRouter = Router()

// Public: Route for retrieving room details and validating token
proposalRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Extract and validate token from query, extracting payload from token. Payload contains room id
    const token = String(req.query.r || '')
    if (!token) return res.status(400).json({ error: 'Missing token' })
    const payload = await validateMagicToken(token, 'reschedule_propose')

    // Fetch minimal room info for display
    let startUtc: string | null = null
    let endUtc: string | null = null
    if (payload.roomId) {
      const admin = createAdminSupabaseClient() as TypedSupabaseClient
      try {
        const room = await getPracticeRoomById(admin, payload.roomId)
        startUtc = room.startUtc
        endUtc = room.endUtc
        // Duration and names are not required for the public reschedule UI
      } catch (_e) {
        // If room not found, keep defaults (null)
      }
    }
    
    return res.json({ ok: true, uid: payload.uid, startUtc, endUtc })
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Invalid token' })
  }
})

// Route to submit a proposal using the UI form, where details are provided from decrypted token
proposalRouter.post('/propose', async (req: Request, res: Response) => {
  try {
    const { token, proposedStartUtc, proposedEndUtc, note } = req.body || {}
    if (!token || !proposedStartUtc || !proposedEndUtc) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const payload = await validateMagicToken(token, 'reschedule_propose')

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
    await issueDecisionLinksAndNotify({
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
    const payload = await validateMagicToken(token, 'reschedule_decide')
    let startUtc: string | null = null
    let endUtc: string | null = null
    const proposedStartUtc = (payload as any).proposedStartUtc ?? null
    const proposedEndUtc = (payload as any).proposedEndUtc ?? null
    if (payload.roomId) {
      const admin = createAdminSupabaseClient() as TypedSupabaseClient
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


