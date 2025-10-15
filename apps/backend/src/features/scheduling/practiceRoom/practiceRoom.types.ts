import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'
import { RequireNonNull } from '@/types/generics.js'


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

export type BookedRoom = RequireNonNull<PracticeRoom, 'guestId' | 'icsUid' | 'endUtc'> 