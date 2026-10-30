import { useCallback, useEffect, useState } from 'react'
import {
    admitGuest, approveScreenShare, denyGuest, denyScreenShare, listScreenShareRequests, listWaitingGuests,
    ScreenShareRequest, WaitingGuest,
} from '../api/roomApi'

const POLL_MS = 2000

// Запити до організатора: хто стоїть у кімнаті очікування й хто просить показ екрана.
// Живе ОДИН раз на кімнату (MeetingRoomPage) і роздається вниз — від нього залежать і
// лічильник на кнопці «Учасники», і спливаюче вікно швидкої відповіді, і сама панель.
export function useHostRequests(meetingId: string | undefined, isHost: boolean) {
    const [waiting, setWaiting] = useState<WaitingGuest[]>([])
    const [screenShare, setScreenShare] = useState<ScreenShareRequest[]>([])
    const [busyUserId, setBusyUserId] = useState<string | null>(null)

    useEffect(() => {
        if (!isHost || !meetingId) return
        let active = true

        async function poll() {
            try {
                const [guests, shares] = await Promise.all([
                    listWaitingGuests(meetingId!),
                    listScreenShareRequests(meetingId!),
                ])
                if (!active) return
                setWaiting(guests)
                setScreenShare(shares)
            } catch {
                // Тимчасова помилка опитування не критична — пробуємо знову за кілька секунд.
            }
        }

        poll()
        const interval = setInterval(poll, POLL_MS)
        return () => { active = false; clearInterval(interval) }
    }, [meetingId, isHost])

    const run = useCallback(async (userId: string, action: () => Promise<void>, after: () => void) => {
        setBusyUserId(userId)
        try {
            await action()
            after()
        } finally {
            setBusyUserId(null)
        }
    }, [])

    const admit = (userId: string) =>
        run(userId, () => admitGuest(meetingId!, userId), () => setWaiting((p) => p.filter((g) => g.userId !== userId)))
    const deny = (userId: string) =>
        run(userId, () => denyGuest(meetingId!, userId), () => setWaiting((p) => p.filter((g) => g.userId !== userId)))
    const allowScreen = (userId: string) =>
        run(userId, () => approveScreenShare(meetingId!, userId), () => setScreenShare((p) => p.filter((r) => r.userId !== userId)))
    const declineScreen = (userId: string) =>
        run(userId, () => denyScreenShare(meetingId!, userId), () => setScreenShare((p) => p.filter((r) => r.userId !== userId)))

    return {
        waiting,
        screenShare,
        count: waiting.length + screenShare.length,
        busyUserId,
        admit,
        deny,
        allowScreen,
        declineScreen,
    }
}

export type HostRequests = ReturnType<typeof useHostRequests>
