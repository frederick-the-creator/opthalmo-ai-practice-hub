import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

export type NotificationMethod = 'REQUEST' | 'CANCEL'

export type NotificationSendKey = {
  uid: string
  sequence: number
  attendeeEmail: string
  method: NotificationMethod
}

export type NotificationSendRow = {
  id: string
  uid: string
  sequence: number
  attendee_email: string
  method: NotificationMethod
  status: 'pending' | 'sent' | 'failed'
  attempts: number
  provider_message_id: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export async function claimSend(
  admin: SupabaseClient<Database>,
  key: NotificationSendKey
): Promise<{ alreadySent: boolean; row: NotificationSendRow }>{
  // Try to insert a new record; if it already exists, ignore and fetch existing
  const insertPayload = {
    uid: key.uid,
    sequence: key.sequence,
    attendee_email: key.attendeeEmail,
    method: key.method,
    status: 'pending' as const,
    attempts: 0,
  }
  await (admin.from('notification_sends' as any) as any)
    .upsert(insertPayload, { onConflict: 'uid,sequence,attendee_email,method', ignoreDuplicates: true })
  const { data, error } = await (admin.from('notification_sends' as any) as any)
    .select('*')
    .eq('uid', key.uid)
    .eq('sequence', key.sequence)
    .eq('attendee_email', key.attendeeEmail)
    .eq('method', key.method)
    .single()
  if (error || !data) {
    throw new Error(error?.message || 'Failed to claim notification send record')
  }
  const row = data as NotificationSendRow
  return { alreadySent: row.status === 'sent', row }
}

export async function markSendSent(
  admin: SupabaseClient<Database>,
  id: string,
  providerMessageId: string | null
): Promise<void> {
  const { error } = await (admin.from('notification_sends' as any) as any)
    .update({ status: 'sent', provider_message_id: providerMessageId, attempts: (undefined as any), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// 
export async function incrementAttemptAndFail(
  admin: SupabaseClient<Database>,
  id: string,
  lastError: string
): Promise<void> {
  // We cannot do atomic attempts++ easily without RPC; fetch then update
  const { data, error } = await (admin.from('notification_sends' as any) as any)
    .select('attempts')
    .eq('id', id)
    .single()
  if (error || !data) throw new Error(error?.message || 'Failed to read attempts')
  const attempts = (data.attempts as number) + 1
  const { error: uerr } = await (admin.from('notification_sends' as any) as any)
    .update({ attempts, status: 'failed', last_error: lastError, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (uerr) throw new Error(uerr.message)
}


