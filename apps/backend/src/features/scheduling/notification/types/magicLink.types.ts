import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'


// Narrow unions used across magic-link flows
export type ActorRole = 'host' | 'guest'
export type MagicPurpose =
  | 'reschedule_propose'
  | 'reschedule_approve'
  | 'reschedule_decline'
  | 'reschedule_decide'

// Supabase-typed table bindings
export type MagicLinkRow = Tables<'magic_links'>
export type MagicLinkInsert = TablesInsert<'magic_links'>
export type MagicLinkUpdate = TablesUpdate<'magic_links'>

// Domain types (camelCase)
export type MagicLink = SnakeToCamelKeys<MagicLinkRow>
export type CreateMagicLink = Omit<SnakeToCamelKeys<MagicLinkInsert>, 'id'>
export type UpdateMagicLink = { id: string } & SnakeToCamelKeys<Omit<MagicLinkUpdate, 'id'>>

// Mapper utilities between domain and DB shapes
export const MagicLinkMapper = {
  insertToDb(insert: CreateMagicLink): MagicLinkInsert {
    const mapped = camelToSnakeObject(insert) as MagicLinkInsert
    return mapped
  },
  updateToDb(update: UpdateMagicLink): MagicLinkUpdate {
    const { id, ...rest } = update
    const mapped = camelToSnakeObject(rest) as MagicLinkUpdate
    return { id, ...mapped }
  },
  fromDb(row: MagicLinkRow): MagicLink {
    const domain = snakeToCamelObject(row) as MagicLink
    return domain
  },
}

// Convenience helper for common update-by-hash operation
export type UpdateMagicLinkByTokenHash =
  { tokenHash: string } & SnakeToCamelKeys<Omit<MagicLinkUpdate, 'id' | 'token_hash'>>
