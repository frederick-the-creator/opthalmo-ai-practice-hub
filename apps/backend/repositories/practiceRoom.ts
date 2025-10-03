import type { TypedSupabaseClient } from '../utils/supabase'
import { PracticeRoom, PracticeRoomInsert, PracticeRoomUpdate, PracticeRoomMapper } from '../types'


export async function createRoomWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: PracticeRoomInsert): Promise<PracticeRoom> {

	const { data, error } = await supabaseAuthenticated
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

export async function updatePracticeRoomWithReturn(supabaseAuthenticated: TypedSupabaseClient, fields: PracticeRoomUpdate): Promise<PracticeRoom> {

	const { data, error } = await supabaseAuthenticated
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

export async function getPracticeRoomById(supabaseAuthenticated: TypedSupabaseClient, roomId: string): Promise<PracticeRoom> {
	const { data, error } = await supabaseAuthenticated
		.from('practice_rooms')
		.select('*')
		.eq('id', roomId)
		.single();

	if (error) {
		console.log('[getPracticeRoomById] DB error: ', error)
		throw new Error(error.message || 'Failed to load room');
	}

	if (!data) {
		throw new Error('Room not found');
	}

	return PracticeRoomMapper.fromDb(data);
}

export async function deletePracticeRoomById(supabaseAuthenticated: TypedSupabaseClient, roomId: string): Promise<void> {
    const { error } = await supabaseAuthenticated
        .from('practice_rooms')
        .delete()
        .eq('id', roomId);

    if (error) {
        console.log('[deletePracticeRoomById] DB error: ', error)
        throw new Error(error.message || 'Failed to delete room');
    }
}
