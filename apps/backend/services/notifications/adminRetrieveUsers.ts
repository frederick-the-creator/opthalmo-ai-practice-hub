import { createAdminSupabaseClient } from '../../utils/supabaseClient'

export async function getUserEmailById(userId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) {
    console.warn('[getUserEmailById] Failed to load user', userId, error.message)
    return null
  }
  return data?.user?.email ?? null
}

export async function getUserFirstNameById(userId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('profiles')
    .select('first_name')
    .eq('user_id', userId)
    .single()
  if (error) {
    console.warn('[getUserFirstNameById] Failed to load profile', userId, error.message)
    return null
  }
  // Coerce to string; handle null/undefined gracefully
  const firstName = (data as any)?.first_name
  return firstName ?? null
}


