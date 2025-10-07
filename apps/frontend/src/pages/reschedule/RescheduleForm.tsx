import React, { useEffect, useMemo, useState } from 'react'
import { validateRescheduleToken, proposeReschedule, type RescheduleValidateResponse } from '@/services/api/api'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RescheduleForm() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'submitted'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')
  const [uid, setUid] = useState<string>('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>('12:00')
  const [endTime, setEndTime] = useState<string>('13:00')

  const timeOptions = useMemo(() => {
    const options: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourString = String(hour).padStart(2, '0')
        const minuteString = String(minute).padStart(2, '0')
        options.push(`${hourString}:${minuteString}`)
      }
    }
    return options
  }, [])

  // Validate token from query and load current room booking details
  useEffect(() => {
    const url = new URL(window.location.href)
    const r = url.searchParams.get('r')
    if (!r) {
      setStatus('error')
      setError('Missing token. Please use the link from your email.')
      return
    }
    setToken(r)
    validateRescheduleToken(r)
      .then((data: RescheduleValidateResponse) => {
        setUid(data.uid)
        // Prefill from current scheduled start/end if available
        if (data.startUtc) {
          const dt = new Date(data.startUtc)
          setStartDate(dt)
          const hrs = String(dt.getHours()).padStart(2, '0')
          const mins = String(dt.getMinutes() - (dt.getMinutes() % 15)).padStart(2, '0')
          setStartTime(`${hrs}:${mins}`)
        }
        if (data.endUtc) {
          const dt = new Date(data.endUtc)
          const hrs = String(dt.getHours()).padStart(2, '0')
          const mins = String(dt.getMinutes() - (dt.getMinutes() % 15)).padStart(2, '0')
          setEndTime(`${hrs}:${mins}`)
        }
        setStatus('ready')
      })
      .catch((e: any) => {
        setStatus('error')
        setError(e?.message || 'Invalid or expired link')
      })
  }, [])

  function toIsoUtcFromDateAndTime(date: Date, hhmm: string): string {
    const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10))
    const d = new Date(date)
    d.setHours(h, m, 0, 0)
    return new Date(d.getTime()).toISOString()
  }

  // Propose new time, passing token so we can record which user requested
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (!startDate) throw new Error('Please select a date')
      const proposedStartUtc = toIsoUtcFromDateAndTime(startDate, startTime)
      const proposedEndUtc = toIsoUtcFromDateAndTime(startDate, endTime)
      if (new Date(proposedEndUtc).getTime() <= new Date(proposedStartUtc).getTime()) {
        throw new Error('End time must be after start time')
      }
      await proposeReschedule({ token, proposedStartUtc, proposedEndUtc })
      setStatus('submitted')
    } catch (e: any) {
      setError(e?.message || 'Failed to submit proposal')
    }
  }

  if (status === 'loading') return null
  if (status === 'error') return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Reschedule</h1>
      <p className="text-red-600">{error}</p>
      <p className="mt-4">You can request a new link from the organizer.</p>
    </div>
  )
  if (status === 'submitted') return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Proposal submitted</h1>
      <p>We notified the other attendee. You will receive an email once they respond.</p>
    </div>
  )
  return (
    <div className="container mx-auto px-4 py-16 max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Propose a new time</h1>
      {startDate && (
        <div className="mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Currently scheduled:</span>
            <span>
              {new Date((new Date(startDate)).setHours(parseInt(startTime.split(':')[0],10), parseInt(startTime.split(':')[1],10))).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              {` — `}
              {new Date((new Date(startDate)).setHours(parseInt(endTime.split(':')[0],10), parseInt(endTime.split(':')[1],10))).toLocaleString([], { timeStyle: 'short' })}
            </span>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Date</Label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            fromDate={new Date()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-time">Start time</Label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">End time</Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" className="bg-primary">Submit proposal</Button>
        </div>
      </form>
      <p className="text-xs text-gray-500 mt-4">Event: {uid}</p>
    </div>
  )
}


