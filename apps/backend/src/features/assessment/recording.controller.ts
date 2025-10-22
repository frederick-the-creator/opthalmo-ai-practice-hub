import type { RequestHandler } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import { HttpError } from '@/lib/httpError.js'
import type { RecordingBody } from '@/features/assessment/recording.schema.js'
import { startDailyRecording, stopDailyRecording } from '@/features/assessment/recording.service.js'

function extractRoomName(roomUrl: string): string {
  const urlParts = roomUrl.split('/')
  const roomName = urlParts[urlParts.length - 1]
  if (!roomName) {
    throw HttpError.BadRequest('Invalid roomUrl')
  }
  return roomName
}

export const startRecordingController: RequestHandler<
  ParamsDictionary,
  { recording: unknown },
  RecordingBody
> = async (req, res) => {
  const { roomUrl } = req.body
  const roomName = extractRoomName(roomUrl)
  const recording = await startDailyRecording(roomName)
  res.status(200).json({ recording })
}

export const stopRecordingController: RequestHandler<
  ParamsDictionary,
  { stopResult: unknown },
  RecordingBody
> = async (req, res) => {
  const { roomUrl } = req.body
  const roomName = extractRoomName(roomUrl)
  const stopResult = await stopDailyRecording(roomName)
  res.status(200).json({ stopResult })
}


