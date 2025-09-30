import adminSupabase from '../utils/supabase'
import { Profile, ProfileInsert, ProfileUpdate, ProfileMapper } from '../types'

export async function createProfileWithReturn(fields: ProfileInsert): Promise<Profile> {
	const { data, error } = await adminSupabase
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

export async function updateProfileWithReturn(fields: ProfileUpdate): Promise<Profile> {
	const { data, error } = await adminSupabase
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


