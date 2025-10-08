import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { Profile, ProfileInsert, ProfileUpdate, ProfileMapper } from '@/types/index.js'

export async function createProfileWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: ProfileInsert): Promise<Profile> {
	const { data, error } = await supabaseAuthenticated
		.from('profiles')
		.insert(ProfileMapper.insertToDb(fields))
		.select()
		.single()

	if (error) {
		console.log('[createProfileWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to create profile')
	}

	if (!data) {
		throw new Error('Failed to create profile: no data returned')
	}

	return ProfileMapper.fromDb(data)
}

export async function updateProfileWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: ProfileUpdate): Promise<Profile> {
	const { data, error } = await supabaseAuthenticated
		.from('profiles')
		.update(ProfileMapper.updateToDb(fields))
		.eq('user_id', fields.userId)
		.select()
		.single()

	if (error) {
		console.log('[updateProfileWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to update profile')
	}

	if (!data) {
		throw new Error('Failed to update profile: no data returned')
	}

	return ProfileMapper.fromDb(data)
}


