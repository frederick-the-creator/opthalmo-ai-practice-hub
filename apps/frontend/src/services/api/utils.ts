import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ApiContext = 'booking' | 'reschedule' | 'cancel' | 'round' | 'recording' | 'assessment' | 'profile' | 'generic'

export function mapApiError(err: any, context: ApiContext = 'generic'): { title: string; description?: string } {
  const status = err?.response?.status
  const data = err?.response?.data
  const issues = Array.isArray(data?.issues) ? data.issues as Array<{ path?: string; message?: string } | string> : undefined
  const issuesText = issues?.map((i: any) => {
    const path = typeof i === 'object' ? String(i?.path || '') : ''
    const cleanPath = path.replace(/^body\./, '')
    const msg = typeof i === 'object' ? i?.message : String(i)
    return cleanPath ? `${cleanPath}: ${msg}` : String(msg)
  }).join('; ')
  const message = data?.error || issuesText || err?.message || ''

  if (status === 401) return { title: 'Session expired', description: 'Please sign in again.' }
  if (status === 403) {
    const desc = message || (context === 'booking' ? 'You cannot book this session.' : 'You are not allowed to perform this action.')
    return { title: 'Not allowed', description: desc }
  }
  if (status === 404) return { title: 'Not found', description: 'The requested resource was not found.' }
  if (status === 409) {
    if (context === 'booking') return { title: 'Already booked', description: 'This session has already been booked.' }
    if (context === 'recording') return { title: 'Conflict', description: 'Recording state prevents this action.' }
    return { title: 'Conflict', description: message || 'A conflicting state prevents this action.' }
  }
  if (status === 400) {
    const defaultMsg = context === 'reschedule' ? 'Please select a valid future date/time.' : 'Your request is invalid.'
    return { title: 'Invalid request', description: message || defaultMsg }
  }
  if (status >= 500) {
    const desc = context === 'recording' ? 'Upstream provider error. Try again shortly.' : 'Server error. Please try again.'
    return { title: 'Server error', description: message || desc }
  }
  return { title: 'Request failed', description: message }
}
