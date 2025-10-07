import { createAdminSupabaseClient } from '../utils'
import type { TypedSupabaseClient } from '../utils/supabaseClient'

export type PendingProposalInsert = {
  roomId: string
  uid: string
  proposedBy: 'host' | 'guest'
  proposerEmail: string
  proposedStartUtc: string
  proposedEndUtc: string
  note?: string | null
}

export async function createPendingProposal(insert: PendingProposalInsert): Promise<string> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await (admin as TypedSupabaseClient)
    .from('pending_proposals')
    .insert({
      room_id: insert.roomId,
      uid: insert.uid,
      proposed_by: insert.proposedBy,
      proposer_email: insert.proposerEmail,
      proposed_start_utc: insert.proposedStartUtc,
      proposed_end_utc: insert.proposedEndUtc,
      note: insert.note ?? null,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message || 'Failed to create proposal')
  return data!.id as unknown as string
}


