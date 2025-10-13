import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'

export type PracticeRoomRow = Tables<'practice_rooms'>
export type PracticeRoomInsert = TablesInsert<'practice_rooms'>
export type PracticeRoomUpdate = TablesUpdate<'practice_rooms'>

export type PracticeRoom = SnakeToCamelKeys<PracticeRoomRow>
export type CreatePracticeRoom = Omit<SnakeToCamelKeys<PracticeRoomInsert>, 'id'>
export type UpdatePracticeRoom = { roomId: string } & SnakeToCamelKeys<Omit<PracticeRoomUpdate, 'id'>>
export type DeletePracticeRoom = { roomId: string }

export const PracticeRoomMapper = {
    insertToDb(insert: CreatePracticeRoom): PracticeRoomInsert {
        const mapped = camelToSnakeObject(insert) as PracticeRoomInsert
        return mapped
    },
    updateToDb(update: UpdatePracticeRoom): PracticeRoomUpdate {
        const { roomId, ...rest } = update
        const mapped = camelToSnakeObject(rest) as PracticeRoomUpdate
        return { id: roomId, ...mapped }
    },
	fromDb(row: PracticeRoomRow): PracticeRoom {
        const domain = snakeToCamelObject(row) as PracticeRoom
        return domain
    }
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

// ICS & Notifications

export type IcsMethod = 'REQUEST' | 'CANCEL'

