import { Tables, TablesInsert, TablesUpdate, Json } from './database.types'

// Practice Rooms

export type PracticeRoom = {
	id: string
	hostId: string
	guestId: string | null
	stage: string
	roomUrl: string | null
	icsUid: string | null
	private: boolean
	createdAt: string | null
	datetimeUtc: string | null
}

export type PracticeRoomInsert = {
	hostId: string
	guestId?: string | null
	stage: string
	roomUrl?: string | null
	icsUid?: string | null
	private?: boolean
	createdAt?: string | null
	datetimeUtc?: string | null
}

export type PracticeRoomUpdate = {
	roomId: string
	hostId?: string
	guestId?: string | null
	stage?: string
	roomUrl?: string | null
	private?: boolean
	createdAt?: string | null
	datetimeUtc?: string | null
}

export const PracticeRoomMapper = {
	insertToDb(insert: PracticeRoomInsert): TablesInsert<'practice_rooms'> {
		return {
			host_id: insert.hostId,
			guest_id: insert.guestId ?? null,
			stage: insert.stage,
			room_url: insert.roomUrl ?? null,
			ics_uid: insert.icsUid ?? null,
			private: insert.private ?? false,
			created_at: insert.createdAt ?? undefined,
			datetime_utc: insert.datetimeUtc ?? null,
		}
	},

	fromDb(row: Tables<'practice_rooms'>): PracticeRoom {
		return {
			id: row.id,
			hostId: row.host_id,
			guestId: row.guest_id,
			stage: row.stage,
			roomUrl: row.room_url,
			icsUid: row.ics_uid ?? null,
			private: row.private,
			createdAt: row.created_at,
			datetimeUtc: row.datetime_utc,
		}
	},

	updateToDb(update: PracticeRoomUpdate): TablesUpdate<'practice_rooms'> {
        return {
            id: update.roomId, // required
            ...(update.hostId !== undefined && { host_id: update.hostId }),
            ...(update.guestId !== undefined && { guest_id: update.guestId }),
            ...(update.stage !== undefined && { stage: update.stage }),
            ...(update.roomUrl !== undefined && { room_url: update.roomUrl }),
            // ics_uid is immutable once set for stability across ICS lifecycle
            ...(update.private !== undefined && { private: update.private }),
            ...(update.createdAt !== undefined && { created_at: update.createdAt }),
            ...(update.datetimeUtc !== undefined && { datetime_utc: update.datetimeUtc }),
        };
	},
}

// Practice Rounds


export type PracticeRound = {
	id: string
	candidateId: string | null
	caseBriefId: string | null
	roomId: string
	roundNumber: number
	assessment: Json | null
	transcript: Json | null
	createdAt: string
}

export type PracticeRoundInsert = {
	candidateId?: string | null
	caseBriefId?: string | null
	roomId: string
	roundNumber: number
	assessment?: Json | null
	transcript?: Json | null
	createdAt?: string
}

export type PracticeRoundUpdate = {
	roundId: string
	candidateId?: string | null
	caseBriefId?: string | null
	roomId?: string
	roundNumber?: number
	assessment?: Json | null
	transcript?: Json | null
	createdAt?: string
}



export const PracticeRoundMapper = {
	insertToDb(insert: PracticeRoundInsert): TablesInsert<'practice_rounds'> {
		return {
			assessment: insert.assessment ?? null,
			candidate_id: insert.candidateId ?? null,
			case_brief_id: insert.caseBriefId ?? null,
			created_at: insert.createdAt ?? undefined,
			room_id: insert.roomId,
			round_number: insert.roundNumber,
			transcript: insert.transcript ?? null,
		}
	},

	fromDb(row: Tables<'practice_rounds'>): PracticeRound {
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

	updateToDb(update: PracticeRoundUpdate): TablesUpdate<'practice_rounds'> {
        return {
            id: update.roundId, // required
            ...(update.candidateId !== undefined && { candidate_id: update.candidateId }),
            ...(update.caseBriefId !== undefined && { case_brief_id: update.caseBriefId }),
            ...(update.roomId !== undefined && { room_id: update.roomId }),
            ...(update.roundNumber !== undefined && { round_number: update.roundNumber }),
            ...(update.assessment !== undefined && { assessment: update.assessment }),
            ...(update.transcript !== undefined && { transcript: update.transcript }),
            ...(update.createdAt !== undefined && { created_at: update.createdAt })
        };
	},
}



// Profiles

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
