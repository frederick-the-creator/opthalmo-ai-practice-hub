import crypto from 'crypto'
import { TypedSupabaseClient, createAdminSupabaseClient } from '@/utils/supabaseClient.js'
import { insertMagicLink, findActiveMagicLinkByHash, markMagicLinkUsedByHash } from '@/features/scheduling/notification/repos/magicLink.repo.js'
import { ActorRole, CreateMagicLink, MagicPurpose,  } from '@/features/scheduling/notification/types/magicLink.types.js'

export type MagicTokenPayload = {
  uid: string
  roomId: string
  proposalId?: string | null
  proposedStartUtc?: string | null
  proposedEndUtc?: string | null
  actorEmail: string
  actorRole: ActorRole
  purpose: MagicPurpose
  exp: number // unix seconds
  nonce: string
}

function getSecret(): string {
  const secret = process.env.MAGIC_LINKS_SECRET
  if (!secret) throw new Error('MAGIC_LINKS_SECRET is required')
  return secret
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(input: string): Buffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) input += '='.repeat(4 - pad)
  return Buffer.from(input, 'base64')
}

function sign(payload: object): { token: string; signature: string } {
  const secret = getSecret()
  const json = JSON.stringify(payload)
  const data = base64UrlEncode(json)
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex')
  const token = `${data}.${signature}`
  return { token, signature }
}

function verify(token: string): MagicTokenPayload | null {
  const secret = getSecret()
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [data, signature] = parts
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const json = base64UrlDecode(data).toString('utf8')
    const payload = JSON.parse(json) as MagicTokenPayload
    if (typeof payload.exp !== 'number' || Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createMagicToken(
  params: Pick<CreateMagicLink, 'uid' | 'purpose' | 'roomId' | 'actorEmail' | 'actorRole'>
): Promise<{ token: string; expiresAt: string }> {

  // Calculate expiry date of token
  const ttl = 60 * 60 * 24 * 7 // 7 days in seconds
  const exp = Math.floor(Date.now() / 1000) + ttl // current date plus 7 days in seconds
  const expiresAt = new Date(exp * 1000).toISOString() 

  const nonce = crypto.randomBytes(8).toString('hex')
  const payload = { ...params, ttl, exp, nonce }

  const { token } = sign(payload)
  const tokenHash = hashToken(token)

  const admin = createAdminSupabaseClient()

  await insertMagicLink(admin, {
    uid: params.uid,
    purpose: params.purpose,
    roomId: params.roomId,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    tokenHash,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function validateMagicTokenReturnPaylad(token: string, purpose?: MagicPurpose): Promise<MagicTokenPayload> {
  const payload = verify(token)
  if (!payload) throw new Error('Invalid or expired token')
  if (purpose && payload.purpose !== purpose) throw new Error('Invalid token purpose')
  const tokenHash = hashToken(token)
  const admin = createAdminSupabaseClient()
  const data = await findActiveMagicLinkByHash(admin, tokenHash)
  if (!data) throw new Error('Token not found or already used')
  return payload
}

export async function markMagicTokenUsed(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  const admin = createAdminSupabaseClient()
  await markMagicLinkUsedByHash(admin, tokenHash)
}