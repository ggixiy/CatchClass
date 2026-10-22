import { http } from '@/shared/api/http'

export interface RoomStatus {
    meetingId: string
    status: 'WAITING' | 'ADMITTED' | 'DENIED'
    accessToken: string | null
    serverUrl: string | null
    roomName: string
    isHost: boolean
}

export interface WaitingGuest {
    userId: string
    displayName: string
    requestedAt: string
}

export function joinRoom(publicId: string, password: string) {
    return http<RoomStatus>('/rooms/join', { method: 'POST', body: { publicId, password } })
}

export function getRoomStatus(meetingId: string) {
    return http<RoomStatus>(`/rooms/${meetingId}/status`)
}

export function listWaitingGuests(meetingId: string) {
    return http<WaitingGuest[]>(`/rooms/${meetingId}/waiting`)
}

export function admitGuest(meetingId: string, guestUserId: string) {
    return http<void>(`/rooms/${meetingId}/admit/${guestUserId}`, { method: 'POST' })
}

export function denyGuest(meetingId: string, guestUserId: string) {
    return http<void>(`/rooms/${meetingId}/deny/${guestUserId}`, { method: 'POST' })
}

export function kickParticipant(meetingId: string, targetUserId: string) {
    return http<void>(`/rooms/${meetingId}/kick/${targetUserId}`, { method: 'POST' })
}

export function muteAll(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/mute-all`, { method: 'POST' })
}

// Користувач сам відмовляється чекати на допуск організатора.
export function leaveWaitingRoom(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/leave`, { method: 'POST' })
}
