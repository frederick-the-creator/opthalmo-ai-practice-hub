import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'

export type PracticeRoundRow = Tables<'practice_rounds'>
export type PracticeRoundInsert = TablesInsert<'practice_rounds'>
export type PracticeRoundUpdate = TablesUpdate<'practice_rounds'>

export type PracticeRound = SnakeToCamelKeys<Tables<'practice_rounds'>>
export type CreatePracticeRound = Omit<SnakeToCamelKeys<TablesInsert<'practice_rounds'>>, 'id'>
export type UpdatePracticeRound = { roundId: string } & SnakeToCamelKeys<Omit<TablesUpdate<'practice_rounds'>, 'id'>>
export type DeletePracticeRound = { roomId: string }

export const PracticeRoundMapper = {
    insertToDb(insert: CreatePracticeRound): PracticeRoundInsert {
        const mapped = camelToSnakeObject(insert) as PracticeRoundInsert
        return mapped
    },
    updateToDb(update: UpdatePracticeRound): PracticeRoundUpdate {
        const { roundId, ...rest } = update
        const mapped = camelToSnakeObject(rest) as PracticeRoundUpdate
        return { id: roundId, ...mapped }
    },
	fromDb(row: PracticeRoundRow): PracticeRound {
        const domain = snakeToCamelObject(row) as PracticeRound
        return domain
    }
}