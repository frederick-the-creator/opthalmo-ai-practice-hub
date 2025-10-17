import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { CreatePendingProposal, PendingProposal, PendingProposalMapper } from '@/features/scheduling/reschedule/reschedule.types.js'

export async function createPendingProposal(insert: CreatePendingProposal): Promise<PendingProposal> {

  const admin = createAdminSupabaseClient()

  const { data, error } = await admin
    .from('pending_proposals')
    .insert(PendingProposalMapper.insertToDb(insert))
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to create proposal')
  }
  
	if (!data) {
		throw new Error('Failed to create proposal: no data returned');
	}

  return PendingProposalMapper.fromDb(data)
}

export async function getPendingProposalById(id: string): Promise<PendingProposal> {

  const admin = createAdminSupabaseClient()

  const { data, error } = await admin
    .from('pending_proposals')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    throw new Error(error.message || 'Failed to load proposal')
  }

  if (!data) {
    throw new Error('Proposal not found')
  }

  return PendingProposalMapper.fromDb(data)
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
  
  if (error) {
    throw new Error(error.message || 'Failed to update proposal')
  }

}


