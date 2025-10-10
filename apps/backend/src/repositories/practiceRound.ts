import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { PracticeRound, PracticeRoundInsert, PracticeRoundUpdate, PracticeRoundMapper } from '@/features/practiceRoom/practiceRoom.types.js'

export async function createRoundWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: PracticeRoundInsert): Promise<PracticeRound> {
	const { data, error } = await supabaseAuthenticated
		.from('practice_rounds')
		.insert(PracticeRoundMapper.insertToDb(fields))
		.select()
		.single()

	if (error) {
		console.log('[createRoundWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to create round')
	}

	if (!data) {
		throw new Error('Failed to create round: no data returned')
	}

	return PracticeRoundMapper.fromDb(data)
}


export async function updatePracticeRoundWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: PracticeRoundUpdate): Promise<PracticeRound> {

	const { data, error } = await supabaseAuthenticated
		.from('practice_rounds')
		.update(PracticeRoundMapper.updateToDb(fields))
		.eq('id', fields.roundId)
		.select()
		.single();

	if (error) {
		console.log('[upsertRoomWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to upsert room');
	}

	if (!data) {
		throw new Error('Failed to upsert room: no data returned');
	}

	return PracticeRoundMapper.fromDb(data);
}


export async function deleteRoundsByRoomId(supabaseAuthenticated: TypedSupabaseClient, roomId: string): Promise<void> {
    const { error } = await supabaseAuthenticated
        .from('practice_rounds')
        .delete()
        .eq('room_id', roomId);

    if (error) {
        console.log('[deleteRoundsByRoomId] DB error: ', error)
        throw new Error(error.message || 'Failed to delete rounds for room')
    }
}

