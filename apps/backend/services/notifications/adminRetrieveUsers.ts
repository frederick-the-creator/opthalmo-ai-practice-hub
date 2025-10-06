import { createAdminSupabaseClient } from '../../utils/supabase'

export async function getUserEmailById(userId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) {
    console.warn('[getUserEmailById] Failed to load user', userId, error.message)
    return null
  }
  return data?.user?.email ?? null
}


