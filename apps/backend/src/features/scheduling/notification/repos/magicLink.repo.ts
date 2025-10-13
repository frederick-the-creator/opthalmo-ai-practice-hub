import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types.js'

export async function insertMagicLink(
  admin: SupabaseClient<Database>,
  params: {
    purpose: 'reschedule_propose' | 'reschedule_approve' | 'reschedule_decline' | 'reschedule_decide'
    uid: string
    roomId: string | null
    actorEmail: string
    actorRole: 'host' | 'guest'
    tokenHash: string
    expiresAtIso: string
  }
): Promise<void> {
  const { error } = await (admin.from('magic_links' as any) as any)
    .insert({
      purpose: params.purpose,
      uid: params.uid,
      room_id: params.roomId,
      actor_email: params.actorEmail,
      actor_role: params.actorRole,
      token_hash: params.tokenHash,
      expires_at: params.expiresAtIso,
    })
  if (error) throw new Error(error.message || 'Failed to persist magic link')
}

export async function findActiveMagicLinkByHash(
  admin: SupabaseClient<Database>,
  tokenHash: string
): Promise<any | null> {
  const { data, error } = await (admin.from('magic_links' as any) as any)
    .select('*')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw new Error(error.message || 'Token lookup failed')
  return data ?? null
}

export async function markMagicLinkUsedByHash(
  admin: SupabaseClient<Database>,
  tokenHash: string
): Promise<void> {
  const { error } = await (admin.from('magic_links' as any) as any)
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
  if (error) throw new Error(error.message || 'Failed to mark magic link as used')
}