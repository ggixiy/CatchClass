import { http } from '@/shared/api/http'

export interface RoomStatus {
    meetingId: string
    status: 'WAITING' | 'ADMITTED' | 'DENIED'
    accessToken: string | null
    serverUrl: string | null
    roomName: string
}

export function joinRoom(publicId: string, password: string) {
    return http<RoomStatus>('/rooms/join', { method: 'POST', body: { publicId, password } })
}

export function getRoomStatus(meetingId: string) {
    return http<RoomStatus>(`/rooms/${meetingId}/status`)
}