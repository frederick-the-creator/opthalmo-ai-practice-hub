import { z } from 'zod'
import type { CreatePracticeRound } from '@/features/practiceRound/practiceRound.types.js'

// Create round (body)
export const newRoundSchemaAPI = z.object({
    body: z.object({
        roomId: z.string(),
        roundNumber: z.number(),
    }) as z.ZodType<Pick<CreatePracticeRound, 'roomId' | 'roundNumber'>>
});

export type NewRoundBody = z.infer<typeof newRoundSchemaAPI>["body"];