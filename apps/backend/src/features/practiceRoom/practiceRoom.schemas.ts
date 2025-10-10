import { z } from 'zod'
import type { CreatePracticeRoom, PracticeRoomUpdate } from '@/features/practiceRoom/practiceRoom.types.js'

// Zod schema typed against database derived type
export const newRoomSchemaAPI = z.object({
    body: z.object({
        hostId: z.string(),
        guestId: z.string().nullable().optional(),
        private: z.boolean().optional(),
        startUtc: z.string(),
        durationMinutes: z.number(),
    }) as z.ZodType<Pick<CreatePracticeRoom, 'hostId' | 'guestId' | 'private' | 'durationMinutes' | 'startUtc'>>
});

/*
Pattern
- Generate camelCase Supabase types from database.types.ts. E.g. PracticeRoom, PracticeRoomInsert, etc
- Derive domain types from DB types. E.g. CreatePracticeRoom as pick of PracticeRoomInsert
- Derive zod schema for API validation, anchoring type against domain type. 
- Domain types are used throughout backend
*/



// Update room
export const updateRoomSchemaAPI = z.object({
    body: z.object({
        roomId: z.string(),
        hostId: z.string().optional(),
        guestId: z.string().nullable().optional(),
        stage: z.string().optional(),
        roomUrl: z.string().nullable().optional(),
        // icsUid immutable by convention, allow sequence bump only
        icsSequence: z.number().optional(),
        private: z.boolean().optional(),
        createdAt: z.string().nullable().optional(),
        startUtc: z.string().nullable().optional(),
        endUtc: z.string().nullable().optional(),
        durationMinutes: z.number().optional(),
    }) as z.ZodType<PracticeRoomUpdate>
})

// Delete room (params)
export const deleteRoomSchemaAPI = z.object({
    params: z.object({
        roomId: z.string(),
    })
});

export type DeleteRoomParams = z.infer<typeof deleteRoomSchemaAPI>['params'];