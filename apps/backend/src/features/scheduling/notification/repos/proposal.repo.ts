import { createAdminSupabaseClient } from '@//utils/index.js'
import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'

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
  const { data, error } = await admin
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

export async function getPendingProposalById(id: string): Promise<{
  id: string
  roomId: string
  uid: string
  proposedBy: 'host' | 'guest'
  proposerEmail: string
  proposedStartUtc: string
  proposedEndUtc: string
  status: 'pending' | 'approved' | 'declined' | 'expired'
  approvedBy: 'host' | 'guest' | null
}> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('pending_proposals')
    .select('id, room_id, uid, proposed_by, proposer_email, proposed_start_utc, proposed_end_utc, status, approved_by')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message || 'Failed to load proposal')
  if (!data) throw new Error('Proposal not found')
  return {
    id: data.id as unknown as string,
    roomId: (data as any).room_id,
    uid: (data as any).uid,
    proposedBy: (data as any).proposed_by,
    proposerEmail: (data as any).proposer_email,
    proposedStartUtc: (data as any).proposed_start_utc,
    proposedEndUtc: (data as any).proposed_end_utc,
    status: (data as any).status,
    approvedBy: (data as any).approved_by,
  }
}

export async function markProposalDecision(params: {
  id: string
  status: 'approved' | 'declined'
  approvedBy: 'host' | 'guest' | null
}): Promise<void> {
  const admin = createAdminSupabaseClient()
  const { error } = await admin
    .from('pending_proposals')
    .update({ status: params.status, approved_by: params.approvedBy, decision_at: new Date().toISOString() })
    .eq('id', params.id)
  if (error) throw new Error(error.message || 'Failed to update proposal')
}


