import type { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { CreatePracticeRound, UpdatePracticeRound, PracticeRound, PracticeRoundMapper } from '@/features/practiceRound/practiceRound.types.js'


export async function createRoundWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: CreatePracticeRound): Promise<PracticeRound> {
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


export async function updatePracticeRoundWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: UpdatePracticeRound): Promise<PracticeRound> {

	const { data, error } = await supabaseAuthenticated
		.from('practice_rounds')
		.update(PracticeRoundMapper.updateToDb(fields))
		.eq('id', fields.roundId)
		.select()
		.single();

	if (error) {
		console.log('[updatePracticeRoundWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to update round');
	}

	if (!data) {
		throw new Error('Failed to update round: no data returned');
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

