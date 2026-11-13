import { useEffect } from 'react'
import { sendPresence, sendPresenceLeave } from '../api/roomApi'

const INTERVAL_MS = 30_000

/** Відвідуваність: поки користувач у кімнаті, раз на 30 с повідомляємо серверу, що він тут. */
export function usePresenceHeartbeat(meetingId: string | undefined, active: boolean) {
    useEffect(() => {
        if (!meetingId || !active) return
        const ping = () => { sendPresence(meetingId).catch(() => {}) }
        ping()
        const timer = window.setInterval(ping, INTERVAL_MS)
        return () => {
            window.clearInterval(timer)
            sendPresenceLeave(meetingId).catch(() => {})
        }
    }, [meetingId, active])
}
