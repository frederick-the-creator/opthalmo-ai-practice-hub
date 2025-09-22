import { Tables, TablesInsert, TablesUpdate, Json } from '../types/dbTypes'

// Practice Rooms

export type PracticeRoom = {
	id: string
	hostId: string
	guestId: string | null
	firstRoundId: string | null
	secondRoundId: string | null
	stage: string | null
	roomUrl: string | null
	private: boolean
	type: string
	createdAt: string | null
	datetimeUtc: string | null
}

export type PracticeRoomInsert = {
	hostId: string
	guestId?: string | null
	firstRoundId?: string | null
	secondRoundId?: string | null
	stage?: string | null
	roomUrl?: string | null
	private?: boolean
	type: string
	createdAt?: string | null
	datetimeUtc?: string | null
}

export type PracticeRoomUpdate = {
	roomId: string
	hostId?: string
	guestId?: string | null
	firstRoundId?: string | null
	secondRoundId?: string | null
	stage?: string | null
	roomUrl?: string | null
	private?: boolean
	type?: string
	createdAt?: string | null
	datetimeUtc?: string | null
}

export const PracticeRoomMapper = {
	insertToDb(insert: PracticeRoomInsert): TablesInsert<'practice_rooms'> {
		return {
			host_id: insert.hostId,
			guest_id: insert.guestId ?? null,
			first_round_id: insert.firstRoundId ?? null,
			second_round_id: insert.secondRoundId ?? null,
			stage: insert.stage ?? null,
			room_url: insert.roomUrl ?? null,
			private: insert.private ?? false,
			type: insert.type,
			created_at: insert.createdAt ?? null,
			datetime_utc: insert.datetimeUtc ?? null,
		}
	},

	fromDb(row: Tables<'practice_rooms'>): PracticeRoom {
		return {
			id: row.id,
			hostId: row.host_id,
			guestId: row.guest_id,
			firstRoundId: row.first_round_id,
			secondRoundId: row.second_round_id,
			stage: row.stage,
			roomUrl: row.room_url,
			private: row.private,
			type: row.type,
			createdAt: row.created_at,
			datetimeUtc: row.datetime_utc,
		}
	},

	updateToDb(update: PracticeRoomUpdate): TablesUpdate<'practice_rooms'> {
        return {
            id: update.roomId, // required
            ...(update.hostId !== undefined && { host_id: update.hostId }),
            ...(update.guestId !== undefined && { guest_id: update.guestId }),
            ...(update.firstRoundId !== undefined && { first_round_id: update.firstRoundId }),
            ...(update.secondRoundId !== undefined && { second_round_id: update.secondRoundId }),
            ...(update.stage !== undefined && { stage: update.stage }),
            ...(update.roomUrl !== undefined && { room_url: update.roomUrl }),
            ...(update.private !== undefined && { private: update.private }),
            ...(update.type !== undefined && { type: update.type }),
            ...(update.createdAt !== undefined && { created_at: update.createdAt }),
            ...(update.datetimeUtc !== undefined && { datetime_utc: update.datetimeUtc }),
        };
	},
}

// Practice Rounds


export type PracticeRound = {
	id: string
	hostId: string | null
	candidateId: string | null
	caseBriefId: string | null
	roomId: string | null
	roundNumber: number | null
	assessment: Json | null
	transcript: Json | null
	createdAt: string
}

export type PracticeRoundInsert = {
	hostId?: string | null
	candidateId?: string | null
	caseBriefId?: string | null
	roomId?: string | null
	roundNumber?: number | null
	assessment?: Json | null
	transcript?: Json | null
	createdAt?: string
}

export type PracticeRoundUpdate = {
	roundId: string
	hostId?: string | null
	candidateId?: string | null
	caseBriefId?: string | null
	roomId?: string | null
	roundNumber?: number | null
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
			host_id: insert.hostId ?? null,
			room_id: insert.roomId ?? null,
			round_number: insert.roundNumber ?? null,
			transcript: insert.transcript ?? null,
		}
	},

	fromDb(row: Tables<'practice_rounds'>): PracticeRound {
		return {
			id: row.id,
			hostId: row.host_id,
			candidateId: row.candidate_id,
			caseBriefId: row.case_brief_id,
			roomId: row.room_id,
			roundNumber: row.round_number,
			assessment: row.assessment,
			transcript: row.transcript,
			createdAt: row.created_at ?? null,
		}
	},

	updateToDb(update: PracticeRoundUpdate): TablesUpdate<'practice_rounds'> {
        return {
            id: update.roundId, // required
            ...(update.hostId !== undefined && { host_id: update.hostId }),
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


