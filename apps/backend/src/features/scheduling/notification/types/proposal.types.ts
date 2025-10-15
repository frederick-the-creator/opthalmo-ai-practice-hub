import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types.js'
import { SnakeToCamelKeys, camelToSnakeObject, snakeToCamelObject } from '@/types/casing.js'


export type ProposalActor = 'host' | 'guest'
export type ProposalStatus = 'pending' | 'approved' | 'declined' | 'expired'

export type PendingProposalRow = Tables<'pending_proposals'>
export type PendingProposalInsert = TablesInsert<'pending_proposals'>
export type PendingProposalUpdate = TablesUpdate<'pending_proposals'>

export type PendingProposal = SnakeToCamelKeys<PendingProposalRow>
export type CreatePendingProposal = Omit<SnakeToCamelKeys<PendingProposalInsert>, 'id'>
export type UpdatePendingProposal = { id: string } & SnakeToCamelKeys<Omit<PendingProposalUpdate, 'id'>>

export const PendingProposalMapper = {
	insertToDb(insert: CreatePendingProposal): PendingProposalInsert {
		const mapped = camelToSnakeObject(insert) as PendingProposalInsert
		return mapped
	},
	updateToDb(update: UpdatePendingProposal): PendingProposalUpdate {
		const { id, ...rest } = update
		const mapped = camelToSnakeObject(rest) as PendingProposalUpdate
		return { id, ...mapped }
	},
	fromDb(row: PendingProposalRow): PendingProposal {
		const domain = snakeToCamelObject(row) as PendingProposal
		return domain
	},
}


