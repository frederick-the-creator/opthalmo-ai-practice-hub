import { z } from 'zod'
import type { CreatePracticeRound, UpdatePracticeRound } from '@/features/practiceRound/practiceRound.types.js'

// Create round (body)
export const newRoundSchemaAPI = z.object({
    body: z.object({
        roomId: z.string(),
        roundNumber: z.number(),
    }) as z.ZodType<Pick<CreatePracticeRound, 'roomId' | 'roundNumber'>>
});

export type NewRoundBody = z.infer<typeof newRoundSchemaAPI>["body"];

// Update round (body)
export const updateRoundSchemaAPI = z.object({
    body: z.object({
        roundId: z.string(),
        candidateId: z.string().nullable().optional(),
        caseBriefId: z.string().nullable().optional(),
        roomId: z.string().optional(),
        roundNumber: z.number().optional(),
        assessment: z.unknown().nullable().optional(),
        transcript: z.unknown().nullable().optional(),
        createdAt: z.string().nullable().optional(),
    }) as z.ZodType<UpdatePracticeRound>
});

export type UpdateRoundBody = z.infer<typeof updateRoundSchemaAPI>["body"];