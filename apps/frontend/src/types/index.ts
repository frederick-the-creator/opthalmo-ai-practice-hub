import { Tables, Json } from './dbTypes'

// Practice Rooms
export const PracticeRoomMapper = {
	fromDb(row: Tables<'practice_rooms'>) {
		return {
			id: row.id,
			hostId: row.host_id,
			guestId: row.guest_id, // inferred as string | null
			stage: row.stage,
			roomUrl: row.room_url,
			private: row.private,
			createdAt: row.created_at,
			datetimeUtc: row.datetime_utc,
		}
	},
}
export type PracticeRoom = ReturnType<typeof PracticeRoomMapper['fromDb']>

// Practice Rounds 
export const PracticeRoundMapper = {
	fromDb(row: Tables<'practice_rounds'>) {
		return {
			id: row.id,
			candidateId: row.candidate_id,
			caseBriefId: row.case_brief_id,
			roomId: row.room_id,
			roundNumber: row.round_number,
			assessment: row.assessment,
			transcript: row.transcript,
			createdAt: row.created_at,
		}
	},
}
export type PracticeRound = ReturnType<typeof PracticeRoundMapper['fromDb']>

// Profile
export const ProfileMapper = {
	fromDb(row: Tables<'profiles'>) {
		return {
			userId: row.user_id,
			firstName: row.first_name,
			lastName: row.last_name,
			avatar: row.avatar,
		}
	},
}
export type Profile = ReturnType<typeof ProfileMapper['fromDb']>


// Extended PracticeRoom with joined profile info
export type PracticeRoomWithProfiles = PracticeRoom & {
	host_profile?: Profile | null
	guest_profile?: Profile | null
}

export type DbProfile = Tables<'profiles'>

export const PracticeRoomWithProfilesMapper = {
	fromDb(
		row: (Tables<'practice_rooms'> & {
			host_profile?: DbProfile | null
			guest_profile?: DbProfile | null
		}) | null
	): PracticeRoomWithProfiles | null {
		if (!row) return null
		const base = PracticeRoomMapper.fromDb(row as Tables<'practice_rooms'>)
		return {
			...base,
			host_profile: row.host_profile ? ProfileMapper.fromDb(row.host_profile) : null,
			guest_profile: row.guest_profile ? ProfileMapper.fromDb(row.guest_profile) : null,
		}
	},
}

// removed duplicate DB-shaped Profile alias


export type Round = Tables<"practice_rounds">;  
export type Case = Tables<"case_briefs">;