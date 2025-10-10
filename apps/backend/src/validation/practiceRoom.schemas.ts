import { z } from 'zod'

export const newRoomSchema = z.object({
    body: z.object({
        hostId: z.string(),
        guestId: z.string().nullable().optional(),
        stage: z.string().optional(),
        roomUrl: z.string().nullable().optional(),
        icsUid: z.string().nullable().optional(),
        icsSequence: z.number().optional(),
        private: z.boolean().optional(),
        createdAt: z.string().nullable().optional(),
        startUtc: z.string().nullable().optional(),
        endUtc: z.string().nullable().optional(),
        durationMinutes: z.number(),
    })
});

export type NewRoom = z.infer<typeof newRoomSchema>['body'];