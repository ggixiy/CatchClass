import { http } from '@/shared/api/http'

export type RecurrenceRule = 'NONE' | 'WEEKLY' | 'MONTHLY'

export interface Meeting {
    id: string
    publicId: string
    password: string | null
    title: string
    description: string | null
    startTime: string
    durationMinutes: number
    recurrence: RecurrenceRule
    recurrenceEndsAt: string | null
}

export interface MeetingOccurrence {
    meetingId: string
    publicId: string
    title: string
    startTime: string
    endTime: string
    recurring: boolean
}

export interface MeetingFormData {
    title: string
    description: string
    startTime: string
    durationMinutes: number
    recurrence: RecurrenceRule
    recurrenceEndsAt: string | null
    requirePassword: boolean
    password: string
}

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateMeetingPassword(length = 6): string {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += PASSWORD_ALPHABET[Math.floor(Math.random() * PASSWORD_ALPHABET.length)]
    }
    return result
}

export function listOccurrences(from: string, to: string) {
    return http<MeetingOccurrence[]>(`/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
}

export function createMeeting(data: MeetingFormData) {
    return http<Meeting>('/meetings', { method: 'POST', body: data })
}

export function createInstantMeeting(title: string) {
    return http<Meeting>(`/meetings/instant?title=${encodeURIComponent(title)}`, { method: 'POST' })
}

export function getMeeting(id: string) {
    return http<Meeting>(`/meetings/${id}`)
}

export function updateMeeting(id: string, data: MeetingFormData) {
    return http<Meeting>(`/meetings/${id}`, { method: 'PUT', body: data })
}

export function deleteMeeting(id: string) {
    return http<void>(`/meetings/${id}`, { method: 'DELETE' })
}