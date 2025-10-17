import { z } from 'zod'
import type { CreatePendingProposal } from '@/features/scheduling/reschedule/reschedule.types.js'

// GET /room - require `token` query param
export const getRoomForRescheduleSchemaAPI = z.object({
  query: z.object({
    token: z.string(),
  })
})

export type GetRoomForRescheduleQuery = z.infer<typeof getRoomForRescheduleSchemaAPI>['query']


// POST /propose - require token, proposedStartUtc, proposedEndUtc; optional note
export const proposeRescheduleSchemaAPI = z.object({
  body: z.object({
    token: z.string(),
    proposedStartUtc: z.string(),
    proposedEndUtc: z.string(),
    note: z.string().optional(),
  }) as z.ZodType<Pick<CreatePendingProposal, 'proposedStartUtc' | 'proposedEndUtc' | 'note'> & { token: string }>
})

export type ProposeRescheduleBody = z.infer<typeof proposeRescheduleSchemaAPI>['body']


// GET /decision - require t (token) query param
export const decisionGetSchemaAPI = z.object({
  query: z.object({
    t: z.string(),
  })
})

export type DecisionGetQuery = z.infer<typeof decisionGetSchemaAPI>['query']


// POST /decision - { token, action, proposedStartUtc?, proposedEndUtc?, note? }
export const decisionPostSchemaAPI = z.object({
  body: z.object({
    token: z.string(),
    action: z.enum(['agree', 'propose', 'cancel']),
    proposedStartUtc: z.string().optional(),
    proposedEndUtc: z.string().optional(),
    note: z.string().optional(),
  })
})

export type DecisionPostBody = z.infer<typeof decisionPostSchemaAPI>['body']


