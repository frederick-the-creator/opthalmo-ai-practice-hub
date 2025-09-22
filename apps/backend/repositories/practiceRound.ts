import adminSupabase from '../utils/supabase'
import { PracticeRound, PracticeRoundInsert, PracticeRoundUpdate, PracticeRoundMapper } from '../types'

export async function createRoundWithReturn(fields: PracticeRoundInsert): Promise<PracticeRound> {
	const { data, error } = await adminSupabase
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


export async function updatePracticeRoundWithReturn(fields: PracticeRoundUpdate): Promise<PracticeRound> {

	const { data, error } = await adminSupabase
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

