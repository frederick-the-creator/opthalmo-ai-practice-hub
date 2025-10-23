import { z } from 'zod'

// Recording Request Body
export const RecordingSchemaAPI = z.object({
  body: z.object({
    roomUrl: z.string().url()
  })
})

export type RecordingBody = z.infer<typeof RecordingSchemaAPI>["body"]


// Daily.co create room response (minimal shape we rely on)
export const DailyCreateRoomResponseSchema = z.object({
  url: z.string().url()
}).passthrough()
export type DailyCreateRoomResponse = z.infer<typeof DailyCreateRoomResponseSchema>

// Daily.co recording action response (start/stop/update share same minimal fields)
export const DailyRecordingStartResponseSchema = z.object({
  status: z.string(),
  recordingId: z.string()
}).passthrough()
export type DailyRecordingStartResponse = z.infer<typeof DailyRecordingStartResponseSchema>

export const DailyRecordingStopResponseSchema = z.object({
  status: z.string()
}).passthrough()
export type DailyRecordingStopResponse = z.infer<typeof DailyRecordingStopResponseSchema>
