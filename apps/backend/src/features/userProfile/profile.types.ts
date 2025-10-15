
export type Profile = {
	userId: string
	firstName: string
	lastName: string
	avatar: string | null
}

export type ProfileInsert = {
	userId: string
	firstName: string
	lastName: string
	avatar?: string | null
}

export type ProfileUpdate = {
	userId: string
	firstName?: string
	lastName?: string
	avatar?: string | null
}

export const ProfileMapper = {
	insertToDb(insert: ProfileInsert): TablesInsert<'profiles'> {
		return {
			user_id: insert.userId,
			first_name: insert.firstName,
			last_name: insert.lastName,
			avatar: insert.avatar ?? null,
		}
	},

	fromDb(row: Tables<'profiles'>): Profile {
		return {
			userId: row.user_id,
			firstName: row.first_name,
			lastName: row.last_name,
			avatar: row.avatar,
		}
	},

	updateToDb(update: ProfileUpdate): TablesUpdate<'profiles'> {
		return {
			user_id: update.userId, // required
			...(update.firstName !== undefined && { first_name: update.firstName }),
			...(update.lastName !== undefined && { last_name: update.lastName }),
			...(update.avatar !== undefined && { avatar: update.avatar }),
		}
	},
}
