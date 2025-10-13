import { z } from 'zod'
import type { CreatePracticeRoom, UpdatePracticeRoom } from '@/features/scheduling/practiceRoom/practiceRoom.types.js'

// Zod schema typed against database derived type
export const newRoomSchemaAPI = z.object({
    body: z.object({
        hostId: z.string(),
        guestId: z.string().nullable().optional(), // Remove as this is not provided on creation
        private: z.boolean().optional(), // Change from optional as this is mandatory
        startUtc: z.string(),
        durationMinutes: z.number(),
    }) as z.ZodType<Pick<CreatePracticeRoom, 'hostId' | 'guestId' | 'private' | 'durationMinutes' | 'startUtc'>>
});

export type NewRoomBody = z.infer<typeof newRoomSchemaAPI>["body"];


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
    }) as z.ZodType<UpdatePracticeRoom>
})

export type UpdateRoomBody = z.infer<typeof updateRoomSchemaAPI>["body"];

// Delete room (params)
export const deleteRoomSchemaAPI = z.object({
    params: z.object({
        roomId: z.string(),
    })
});

export type DeleteRoomParams = z.infer<typeof deleteRoomSchemaAPI>['params'];