import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'


export type ProfileRow = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Profile = SnakeToCamelKeys<ProfileRow>
export type CreateProfile = SnakeToCamelKeys<ProfileInsert>
export type UpdateProfile = { userId: string } & SnakeToCamelKeys<Omit<ProfileUpdate, 'user_id'>>

export const ProfileMapper = {
	insertToDb(insert: CreateProfile): ProfileInsert {
		const mapped = camelToSnakeObject(insert) as ProfileInsert
		return mapped
	},
	updateToDb(update: UpdateProfile): ProfileUpdate {
		const { userId, ...rest } = update
		const mapped = camelToSnakeObject(rest) as ProfileUpdate
		return {user_id: userId, ...mapped}
	},
	fromDb(row: ProfileRow): Profile {
		const domain = snakeToCamelObject(row) as Profile
		return domain
	}
}