import { createAdminSupabaseClient } from '@/utils/supabaseClient.js'

export async function getUserEmailById(userId: string): Promise<string> {
  const admin = createAdminSupabaseClient()

  const { data, error } = await admin.auth.admin.getUserById(userId)

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user.email) {
    throw new Error("User email not found");
  }
  
  return data.user.email;
}

export async function getUserFirstNameById(userId: string): Promise<string> {

  const admin = createAdminSupabaseClient()

  const { data, error } = await admin
    .from('profiles')
    .select('first_name')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.warn('[getUserFirstNameById] Failed to load profile', userId, error.message)
    throw new Error(error.message)
  }

	if (!data) {
		throw new Error('User first name not found');
	}
  
  return data.first_name
}


