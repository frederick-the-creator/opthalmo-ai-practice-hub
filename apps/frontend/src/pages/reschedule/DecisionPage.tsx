import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { decideProposal, retrieveRescheduleProposal } from '@/services/api/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function DecisionPage() {
  const [params] = useSearchParams()
  const token = params.get('t') || ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentStartUtc, setCurrentStartUtc] = useState<string | null>(null)
  const [currentEndUtc, setCurrentEndUtc] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>('12:00')
  const [endTime, setEndTime] = useState<string>('13:00')
  const [proposedStartUtc, setProposedStartUtc] = useState<string | null>(null)
  const [proposedEndUtc, setProposedEndUtc] = useState<string | null>(null)
  const [proposeMode, setProposeMode] = useState(false)

  const timeOptions = React.useMemo(() => {
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

  function toIsoUtcFromDateAndTime(date: Date, hhmm: string): string {
    const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10))
    const d = new Date(date)
    d.setHours(h, m, 0, 0)
    return new Date(d.getTime()).toISOString()
  }

  useEffect(() => {
    async function init() {
      try {
        if (!token) throw new Error('Missing token')
        const res = await retrieveRescheduleProposal(token)
        if (!res.ok) throw new Error('Invalid or expired link')
        setCurrentStartUtc(res.startUtc)
        setCurrentEndUtc(res.endUtc)
        setProposedStartUtc(res.proposedStartUtc)
        setProposedEndUtc(res.proposedEndUtc)
        setLoading(false)
      } catch (e: any) {
        setError(e?.message || 'Invalid or expired link')
        setLoading(false)
      }
    }
    init()
  }, [token])

  async function doAction(action: 'agree' | 'cancel' | 'propose') {
    try {
      setError(null)
      setSuccess(null)
      const payload: any = { token, action }
      if (action === 'propose') {
        if (!startDate) throw new Error('Please select a date')
        const proposedStartUtc = toIsoUtcFromDateAndTime(startDate, startTime)
        const proposedEndUtc = toIsoUtcFromDateAndTime(startDate, endTime)
        if (new Date(proposedEndUtc).getTime() <= new Date(proposedStartUtc).getTime()) {
          throw new Error('End time must be after start time')
        }
        payload.proposedStartUtc = proposedStartUtc
        payload.proposedEndUtc = proposedEndUtc
      }
      const res = await decideProposal(payload)
      if (res.ok) {
        setSuccess(action === 'agree' ? 'Approved and updated invites sent.' : action === 'cancel' ? 'Meeting cancelled.' : 'Alternative proposal sent.')
      } else {
        setError('Unable to process decision')
      }
    } catch (e: any) {
      setError(e?.message || 'Error processing decision')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Session decision</h1>
        {loading && <p>Validating link…</p>}
        {!loading && (
          <>
            {error && <p className="text-red-600 mb-3">{error}</p>}
            {success && <p className="text-green-700 mb-3">{success}</p>}
            {(currentStartUtc && currentEndUtc) || (proposedStartUtc && proposedEndUtc) ? (
              <div className="mb-6 rounded border p-4 bg-gray-50">
                {currentStartUtc && currentEndUtc && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Currently scheduled:</span>
                    <span className="text-base">
                      {new Date(currentStartUtc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {` — `}
                      {new Date(currentEndUtc).toLocaleString([], { timeStyle: 'short' })}
                    </span>
                  </div>
                )}
                {proposedStartUtc && proposedEndUtc && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Proposed time:</span>
                    <span className="text-base text-gray-900">
                      {new Date(proposedStartUtc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {` — `}
                      {new Date(proposedEndUtc).toLocaleString([], { timeStyle: 'short' })}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
            <div className="space-y-3 mb-6">
              <Button className="w-full" onClick={() => doAction('agree')}>Agree</Button>
              <Button className="w-full" variant="destructive" onClick={() => doAction('cancel')}>Cancel meeting</Button>
              <Button className="w-full" variant="secondary" onClick={() => setProposeMode(true)}>Propose alternative</Button>
            </div>
            {proposeMode && (
            <div className="border rounded p-3 space-y-3">
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
              {startDate && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Proposed:</span>
                    <span>
                      {new Date((new Date(startDate)).setHours(parseInt(startTime.split(':')[0],10), parseInt(startTime.split(':')[1],10))).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {` — `}
                      {new Date((new Date(startDate)).setHours(parseInt(endTime.split(':')[0],10), parseInt(endTime.split(':')[1],10))).toLocaleString([], { timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button className="w-full" variant="secondary" onClick={() => doAction('propose')}>Send proposal</Button>
                <Button className="w-full" variant="ghost" onClick={() => setProposeMode(false)}>Cancel</Button>
              </div>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


