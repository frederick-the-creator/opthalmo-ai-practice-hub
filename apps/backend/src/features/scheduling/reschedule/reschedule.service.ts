import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { createMagicToken, validateMagicTokenReturnPaylad, markMagicTokenUsed } from '@/features/scheduling/notification/services/buildNotification/magicLink.service.js'
import { getPendingProposalById, markProposalDecision } from '@/features/scheduling/reschedule/reschedule.repo.js'
import { getPracticeRoomById, updatePracticeRoomWithReturn } from '@/features/scheduling/practiceRoom/practiceRoom.repo.js'
import { buildBookingContext } from '@/features/scheduling/notification/services/buildNotification/bookingContextBuilder.service.js'
import { sendEmailWithRetry, sendNotification } from '@/features/scheduling/notification/services/notification.service.js'
import { BookedRoom, PracticeRoom } from '../practiceRoom/practiceRoom.types.js'

function isBookedRoom(room: PracticeRoom): room is BookedRoom {
  return (
    typeof room.guestId === 'string' &&
    typeof room.icsUid === 'string' &&
    typeof room.endUtc === 'string'
  )
}

export async function requestCounterpartyApproval(params: {
  roomId: string
  uid: string
  proposerRole: 'host' | 'guest'
  proposerEmail: string
  proposalId: string
}): Promise<void> {

  const admin = createAdminSupabaseClient()
  const room = await getPracticeRoomById(admin, params.roomId) as BookedRoom
  const ctx = await buildBookingContext(room)

  const counterpartyRole = params.proposerRole === 'host' ? 'guest' : 'host'
  const counterpartyEmail = counterpartyRole === 'host' ? ctx.attendees.host.email : ctx.attendees.guest.email

  // Load proposal to embed proposed times into the decision token
  const proposal = await getPendingProposalById(params.proposalId)

  const decision = await createMagicToken({
    purpose: 'reschedule_decide',
    uid: params.uid,
    roomId: params.roomId,
    proposalId: params.proposalId,
    proposedStartUtc: proposal.proposedStartUtc,
    proposedEndUtc: proposal.proposedEndUtc,
    actorEmail: counterpartyEmail,
    actorRole: counterpartyRole
  })

  const base = process.env.FRONTEND_URL?.replace(/\/$/, '')
  const decisionUrl = `${base}/decision?t=${encodeURIComponent(decision.token)}`

  // Subject aligned with ICS: personalize with counterparty's first name
  let subject = 'Ophthalmo Practice Session'
  // Personalize with the other party's name (proposer), not the recipient's
  const otherPartyFirst = counterpartyRole === 'host' ? ctx.attendees.guest.name : ctx.attendees.host.name

  if (otherPartyFirst) subject = `Ophthalmo Practice Session with ${otherPartyFirst}`
  subject = `New Time Proposed: ${subject}`

  await sendEmailWithRetry({
    to: { email: counterpartyEmail },
    subject,
    text: `A new time was proposed for your session.\n\nOpen to decide: ${decisionUrl}`,
  })
}

export async function decideByToken(token: string, action: 'agree' | 'propose' | 'cancel', proposalNote?: { proposedStartUtc?: string, proposedEndUtc?: string, note?: string }): Promise<{ ok: boolean }> {
  
  const payload = await validateMagicTokenReturnPaylad(token)
  if (!payload.roomId || !payload.proposalId) throw new Error('Invalid token payload')
  const admin = createAdminSupabaseClient()
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
    })

    if (isBookedRoom(updatedRoom)) {
      await sendNotification('REQUEST', updatedRoom)
    }

    await markProposalDecision({ id: proposal.id, status: 'approved', approvedBy: payload.actorRole })
    await markMagicTokenUsed(token)
    return { ok: true }
  }

  if (action === 'cancel') {

    // Cancel meeting: send CANCEL to both and delete
    const room = await getPracticeRoomById(admin, proposal.roomId)

    if (isBookedRoom(room)) {
      await sendNotification('CANCEL', room)
    }

    // Delete room + rounds
    // Reuse existing delete guard would require user context; here as system we directly delete via repos
    // For now, mark proposal declined and mark token used; actual deletion flow may stay host-only elsewhere
    await markProposalDecision({ id: proposal.id, status: 'declined', approvedBy: null })
    await markMagicTokenUsed(token)
    return { ok: true }
  }

  // action === 'propose' → create a new counter-proposal back to the other party
  if (!proposalNote?.proposedStartUtc || !proposalNote?.proposedEndUtc) throw new Error('Missing proposed times')
  const { createPendingProposal } = await import('@/features/scheduling/reschedule/reschedule.repo.js')
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
  await requestCounterpartyApproval({
    roomId: proposal.roomId,
    uid: proposal.uid,
    proposerRole: payload.actorRole,
    proposerEmail: payload.actorEmail,
    proposalId: newProposalId.id,
  })
  await markMagicTokenUsed(token)
  return { ok: true }
}
