import { TypedSupabaseClient } from '@/utils/supabaseClient.js'
import { CreateMagicLink, MagicLinkMapper, MagicLink } from '@/features/scheduling/notification/types/magicLink.types.js'


export async function insertMagicLink(
  admin: TypedSupabaseClient,
  fields: CreateMagicLink
): Promise<void> {

	const { error } = await admin
		.from('magic_links')
		.insert(MagicLinkMapper.insertToDb(fields))

	if (error) {
		throw new Error(error.message || 'Failed to persist magic link')
	}

}

export async function findActiveMagicLinkByHash(
  admin: TypedSupabaseClient,
  tokenHash: string
): Promise<MagicLink> {
	const { data, error } = await admin
		.from('magic_links')
		.select('*')
		.eq('token_hash', tokenHash)
		.is('used_at', null)
		.gt('expires_at', new Date().toISOString())
		.maybeSingle()

	if (error) {
		throw new Error(error.message || 'Token lookup failed')
	}
	if (!data) {
		throw new Error('Magic Link not found');
	}

  return MagicLinkMapper.fromDb(data)

}

export async function markMagicLinkUsedByHash(
  admin: TypedSupabaseClient,
  tokenHash: string
): Promise<void> {

	const { error } = await admin
		.from('magic_links')
		.update({ used_at: new Date().toISOString() })
		.eq('token_hash', tokenHash)

	if (error) {
		throw new Error(error.message || 'Failed to mark magic link as used')
	}

}