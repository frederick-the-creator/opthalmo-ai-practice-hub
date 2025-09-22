import adminSupabase from '../utils/supabase'
import { PracticeRoom, PracticeRoomInsert, PracticeRoomUpdate, PracticeRoomMapper } from '../types'


export async function createRoomWithReturn(fields: PracticeRoomInsert): Promise<PracticeRoom> {

	const { data, error } = await adminSupabase
        .from('practice_rooms')
		.insert(PracticeRoomMapper.insertToDb(fields))
		.select()
		.single();

    if (error) {
        console.log('[createRoomWithReturn] DB error: ', error)
        throw new Error(error.message || 'Failed to create room');
    }

	if (!data) {
		throw new Error('Failed to create room: no data returned');
	}

	return PracticeRoomMapper.fromDb(data);
}

export async function updatePracticeRoomWithReturn(fields: PracticeRoomUpdate): Promise<PracticeRoom> {

	const { data, error } = await adminSupabase
		.from('practice_rooms')
		.update(PracticeRoomMapper.updateToDb(fields))
		.eq('id', fields.roomId)
		.select()
		.single();

	if (error) {
		console.log('[upsertRoomWithReturn] DB error: ', error)
		throw new Error(error.message || 'Failed to upsert room');
	}

	if (!data) {
		throw new Error('Failed to upsert room: no data returned');
	}

	return PracticeRoomMapper.fromDb(data);
}
