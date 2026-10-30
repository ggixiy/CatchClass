import { http } from '@/shared/api/http'

export interface RoomStatus {
    meetingId: string
    status: 'WAITING' | 'ADMITTED' | 'DENIED'
    accessToken: string | null
    serverUrl: string | null
    roomName: string
    isHost: boolean
    title: string
    waitingRoomEnabled: boolean
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

export interface ParticipantPhoto {
    userId: string
    photoUrl: string | null
}

// userId тут = LiveKit identity (RoomService.generateToken ставить token.setIdentity(userId)),
// тому на фронті його напряму зіставляють з Participant.identity.
export function listParticipantPhotos(meetingId: string) {
    return http<ParticipantPhoto[]>(`/rooms/${meetingId}/participants/photos`)
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

export function unmuteAll(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/unmute-all`, { method: 'POST' })
}

// Повне завершення заняття організатором — кімнату видаляє LiveKit, усіх присутніх одразу вилучає.
export function endMeetingForAll(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/end`, { method: 'POST' })
}

export interface ScreenShareRequest {
    userId: string
    displayName: string
}

// Учасник просить дозволу на демонстрацію екрана — за замовчуванням йому дозволені
// лише камера й мікрофон, екран стає доступним одразу після схвалення організатором.
export function requestScreenShare(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/screen-share/request`, { method: 'POST' })
}

export function listScreenShareRequests(meetingId: string) {
    return http<ScreenShareRequest[]>(`/rooms/${meetingId}/screen-share/requests`)
}

export function approveScreenShare(meetingId: string, userId: string) {
    return http<void>(`/rooms/${meetingId}/screen-share/approve/${userId}`, { method: 'POST' })
}

export function denyScreenShare(meetingId: string, userId: string) {
    return http<void>(`/rooms/${meetingId}/screen-share/deny/${userId}`, { method: 'POST' })
}

// Користувач сам відмовляється чекати на допуск організатора.
export function leaveWaitingRoom(meetingId: string) {
    return http<void>(`/rooms/${meetingId}/leave`, { method: 'POST' })
}

export function setWaitingRoom(meetingId: string, enabled: boolean) {
    return http<void>(`/rooms/${meetingId}/waiting-room?enabled=${enabled}`, { method: 'POST' })
}

export function getInvite(meetingId: string) {
    return http<{ publicId: string; password: string | null }>(`/rooms/${meetingId}/invite`)
}
