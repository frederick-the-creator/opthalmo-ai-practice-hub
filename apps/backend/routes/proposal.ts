import { Router, Request, Response } from 'express'
import { validateMagicToken } from '../services/proposals/magicLink'
import { createPendingProposal } from '../repositories/proposal'
import { createAdminSupabaseClient, type TypedSupabaseClient } from '../utils/supabaseClient'
import { getPracticeRoomById } from '../repositories/practiceRoom'

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

    // Notify counterparty via a lightweight email (no ICS) - optional placeholder
    // For now, we just log. Future slices will send Approve/Decline links.
    console.log('[reschedule:proposal:created]', JSON.stringify({ proposalId, uid: payload.uid }))

    return res.json({ ok: true, proposalId })
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Invalid token or request' })
  }
})

export default proposalRouter


