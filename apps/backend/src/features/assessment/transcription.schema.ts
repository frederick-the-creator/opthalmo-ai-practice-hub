import { z } from 'zod'



// Daily recordings list
export const DailyRecordingItemSchema = z.object({
  id: z.string(),
  room_name: z.string(),
  // Daily responses may include different timestamp fields; keep both optional and accept passthrough
  start_ts: z.number().optional(),
  created_at: z.string().optional()
}).passthrough()

export const DailyRecordingsListResponseSchema = z.object({
  total_count: z.number(),
  data: z.array(DailyRecordingItemSchema)
})

// Submit Transcript
export const TranscriptionSubmitSuccessSchema = z.object({
  id: z.string().uuid()
})
export type TranscriptionSubmitSuccess = z.infer<typeof TranscriptionSubmitSuccessSchema>


export const TranscriptionSubmitErrorSchema = z.object({
  error: z.string(),
  info: z.string()
})
export type TranscriptionSubmitError = z.infer<typeof TranscriptionSubmitErrorSchema>


// Polling transcript

const DailyJobInputSchema = z.object({
  sourceType: z.literal('recordingId'),
  recordingId: z.string()
})


const DailyJobOutputSchema = z.object({
    transcription: z.array(
        z.object({
            format: z.string(),
            link: z.string().url().optional()
        }).passthrough()
    ).optional()
})

export const TranscriptionJobInProgressSchema = z.object({
    id: z.string().uuid(),
    preset: z.literal('transcript'),
    status: z.enum(['submitted', 'processing']),
    input: DailyJobInputSchema,
    output: DailyJobOutputSchema
})

export const TranscriptionJobSuccessSchema = z.object({
  id: z.string().uuid(),
  preset: z.literal('transcript'),
  status: z.literal('finished'),
  input: DailyJobInputSchema,
  output: DailyJobOutputSchema
})

export const TranscriptionJobErrorSchema = z.object({
  id: z.string().uuid(),
  preset: z.literal('transcript'),
  status: z.literal('error'),
  input: DailyJobInputSchema,
  output: DailyJobOutputSchema,
  error: z.string()
})


export const TranscriptionJobResponseSchema = z.union([
  TranscriptionJobSuccessSchema,
  TranscriptionJobErrorSchema,
  TranscriptionJobInProgressSchema
])

export type TranscriptionJobSuccess = z.infer<typeof TranscriptionJobSuccessSchema>
export type TranscriptionJobResponse = z.infer<typeof TranscriptionJobResponseSchema>


// Retrieve Transcript

export const AccessLinkResponseSchema = z.object({
    id: z.string(),
    preset: z.literal('transcript'),
    status: z.literal('finished'),
    transcription: z.array(
        z.object({
            format: z.string(),
            link: z.string().url()
        })
    )
})

export type AccessLinkResponse = z.infer<typeof AccessLinkResponseSchema>

// Transcript JSON (minimal shape we rely on downstream)
export const TranscriptJsonSchema = z.object({
  results: z.object({
    channels: z.array(
      z.object({
        alternatives: z.array(
          z.object({
            paragraphs: z.object({
              transcript: z.string().optional()
            }).optional()
          })
        ).optional()
      })
    ).optional()
  }).optional()
}).passthrough()

export type TranscriptJson = z.infer<typeof TranscriptJsonSchema>


