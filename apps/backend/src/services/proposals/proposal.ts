import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { issueMagicLink, validateMagicToken, markMagicTokenUsed } from './magicLink.js'
import { getPendingProposalById, markProposalDecision } from '@/repositories/proposal.js'
import { getPracticeRoomById, updatePracticeRoomWithReturn } from '@/repositories/practiceRoom.js'
import { buildBookingContext } from '@/services/notifications/bookingContextBuilder.js'
import { sendEmail, sendIcsNotification } from '@/services/notifications/notification.js'

export async function issueDecisionLinksAndNotify(params: {
  roomId: string
  uid: string
  proposerRole: 'host' | 'guest'
  proposerEmail: string
  proposalId: string
}): Promise<void> {
  const admin = createAdminSupabaseClient() as TypedSupabaseClient
  const room = await getPracticeRoomById(admin, params.roomId)
  const ctx = await buildBookingContext(room)
  if (!ctx) return
  const counterpartyRole = params.proposerRole === 'host' ? 'guest' : 'host'
  const counterpartyEmail = counterpartyRole === 'host' ? ctx.hostEmail : ctx.guestEmail
  if (!counterpartyEmail) return

  // Load proposal to embed proposed times into the decision token
  const proposal = await getPendingProposalById(params.proposalId)

  const decision = await issueMagicLink({
    purpose: 'reschedule_decide',
    uid: params.uid,
    roomId: params.roomId,
    proposalId: params.proposalId,
    proposedStartUtc: proposal.proposedStartUtc,
    proposedEndUtc: proposal.proposedEndUtc,
    actorEmail: counterpartyEmail,
    actorRole: counterpartyRole,
    ttlSeconds: 60 * 60 * 24 * 7,
  })

  const base = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:5173'
  const decisionUrl = `${base}/decision?t=${encodeURIComponent(decision.token)}`

  // Subject aligned with ICS: personalize with counterparty's first name
  let subject = 'Ophthalmo Practice Session'
  // Personalize with the other party's name (proposer), not the recipient's
  const otherPartyFirst = counterpartyRole === 'host' ? ctx.guestFirst : ctx.hostFirst
  if (otherPartyFirst) subject = `Ophthalmo Practice Session with ${otherPartyFirst}`
  subject = `New Time Proposed: ${subject}`

  await sendEmail({
    to: [{ email: counterpartyEmail }],
    subject,
    text: `A new time was proposed for your session.\n\nOpen to decide: ${decisionUrl}`,
  })
}

export async function decideByToken(token: string, action: 'agree' | 'propose' | 'cancel', proposalNote?: { proposedStartUtc?: string, proposedEndUtc?: string, note?: string }): Promise<{ ok: boolean }> {
  const payload = await validateMagicToken(token, 'reschedule_decide')
  if (!payload.roomId || !payload.proposalId) throw new Error('Invalid token payload')
  const admin = createAdminSupabaseClient() as TypedSupabaseClient
  const proposal = await getPendingProposalById(payload.proposalId)

  if (action === 'agree') {
    // Apply update (same as approve) using proposal and room
    const room = await getPracticeRoomById(admin, proposal.roomId)
    const isReschedule = proposal.proposedStartUtc !== room.startUtc
    const nextSequence = (room.icsSequence ?? 0) + (isReschedule ? 1 : 0)
    const updatedRoom = await updatePracticeRoomWithReturn(admin, {
      roomId: room.id,
      startUtc: proposal.proposedStartUtc,
      endUtc: new Date(new Date(proposal.proposedStartUtc).getTime() + (room.durationMinutes * 60 * 1000)).toISOString(),
      icsSequence: nextSequence,
    } as any)
    try { await sendIcsNotification('REQUEST', updatedRoom) } catch (_e) {}
    await markProposalDecision({ id: proposal.id, status: 'approved', approvedBy: payload.actorRole })
    await markMagicTokenUsed(token)
    return { ok: true }
  }

  if (action === 'cancel') {
    // Cancel meeting: send CANCEL to both and delete
    const room = await getPracticeRoomById(admin, proposal.roomId)
    try { await sendIcsNotification('CANCEL', room) } catch (_e) {}
    // Delete room + rounds
    // Reuse existing delete guard would require user context; here as system we directly delete via repos
    // For now, mark proposal declined and mark token used; actual deletion flow may stay host-only elsewhere
    await markProposalDecision({ id: proposal.id, status: 'declined', approvedBy: null })
    await markMagicTokenUsed(token)
    return { ok: true }
  }

  // action === 'propose' → create a new counter-proposal back to the other party
  if (!proposalNote?.proposedStartUtc || !proposalNote?.proposedEndUtc) throw new Error('Missing proposed times')
  const { createPendingProposal } = await import('@/repositories/proposal.js')
  // Persist a new proposal from the decider (counterparty)
  const newProposalId = await createPendingProposal({
    roomId: proposal.roomId,
    uid: proposal.uid,
    proposedBy: payload.actorRole,
    proposerEmail: payload.actorEmail,
    proposedStartUtc: proposalNote.proposedStartUtc,
    proposedEndUtc: proposalNote.proposedEndUtc,
    note: proposalNote?.note ?? null,
  })
  // Email a decision link back to the other party
  await issueDecisionLinksAndNotify({
    roomId: proposal.roomId,
    uid: proposal.uid,
    proposerRole: payload.actorRole,
    proposerEmail: payload.actorEmail,
    proposalId: newProposalId,
  })
  await markMagicTokenUsed(token)
  return { ok: true }
}

export async function approveProposalByToken(token: string): Promise<{ ok: boolean; alreadyApplied?: boolean }> {
  const payload = await validateMagicToken(token, 'reschedule_approve')
  if (!payload.roomId || !payload.proposalId) throw new Error('Invalid token payload')

  const admin = createAdminSupabaseClient() as TypedSupabaseClient
  const proposal = await getPendingProposalById(payload.proposalId)
  if (proposal.status === 'approved') return { ok: true, alreadyApplied: true }
  if (proposal.status === 'declined') throw new Error('Proposal already declined')

  const room = await getPracticeRoomById(admin, proposal.roomId)
  const isReschedule = proposal.proposedStartUtc !== room.startUtc
  const nextSequence = (room.icsSequence ?? 0) + (isReschedule ? 1 : 0)

  const updatedRoom = await updatePracticeRoomWithReturn(admin, {
    roomId: room.id,
    startUtc: proposal.proposedStartUtc,
    endUtc: new Date(new Date(proposal.proposedStartUtc).getTime() + (room.durationMinutes * 60 * 1000)).toISOString(),
    icsSequence: nextSequence,
  } as any)

  try { await sendIcsNotification('REQUEST', updatedRoom) } catch (_e) {}

  await markProposalDecision({ id: proposal.id, status: 'approved', approvedBy: payload.actorRole })
  await markMagicTokenUsed(token)
  return { ok: true }
}

export async function declineProposalByToken(token: string): Promise<{ ok: boolean; alreadyDeclined?: boolean }> {
  const payload = await validateMagicToken(token, 'reschedule_decline')
  if (!payload.proposalId) throw new Error('Invalid token payload')

  const proposal = await getPendingProposalById(payload.proposalId)
  if (proposal.status === 'declined') return { ok: true, alreadyDeclined: true }
  if (proposal.status === 'approved') throw new Error('Proposal already approved')

  await markProposalDecision({ id: proposal.id, status: 'declined', approvedBy: null })
  await markMagicTokenUsed(token)
  return { ok: true }
}


