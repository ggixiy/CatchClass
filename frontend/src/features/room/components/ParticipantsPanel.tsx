import { useEffect, useState } from 'react'
import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import {
    admitGuest, denyGuest, kickParticipant, listWaitingGuests, muteAll, WaitingGuest,
} from '../api/roomApi'

interface ParticipantsPanelProps {
    meetingId: string
    isHost: boolean
    open: boolean
    onClose: () => void
}

// Єдина панель (рис. 4.7 ТЗ "Панель списку учасників"): зверху — хто вже в кімнаті
// (живий список з LiveKit через useParticipants) з кнопкою «Kick» для організатора,
// знизу — у організатора — черга кімнати очікування з кнопками «Let in» / «Reject».
// Відкривається окремою кнопкою в кімнаті, а не спливає сама по собі.
export function ParticipantsPanel({ meetingId, isHost, open, onClose }: ParticipantsPanelProps) {
    const participants = useParticipants()
    const { localParticipant } = useLocalParticipant()
    const [waiting, setWaiting] = useState<WaitingGuest[]>([])
    const [busyUserId, setBusyUserId] = useState<string | null>(null)
    const [mutingAll, setMutingAll] = useState(false)

    useEffect(() => {
        if (!isHost) return
        let active = true

        async function poll() {
            try {
                const result = await listWaitingGuests(meetingId)
                if (active) setWaiting(result)
            } catch {
                // Тимчасова помилка опитування не критична — просто пробуємо знову за 3с.
            }
        }

        poll()
        const interval = setInterval(poll, 3000)
        return () => { active = false; clearInterval(interval) }
    }, [meetingId, isHost])

    async function handleAdmit(userId: string) {
        setBusyUserId(userId)
        try {
            await admitGuest(meetingId, userId)
            setWaiting((prev) => prev.filter((g) => g.userId !== userId))
        } finally {
            setBusyUserId(null)
        }
    }

    async function handleDeny(userId: string) {
        setBusyUserId(userId)
        try {
            await denyGuest(meetingId, userId)
            setWaiting((prev) => prev.filter((g) => g.userId !== userId))
        } finally {
            setBusyUserId(null)
        }
    }

    async function handleKick(identity: string) {
        setBusyUserId(identity)
        try {
            await kickParticipant(meetingId, identity)
        } finally {
            setBusyUserId(null)
        }
    }

    async function handleMuteAll() {
        setMutingAll(true)
        try {
            await muteAll(meetingId)
        } finally {
            setMutingAll(false)
        }
    }

    if (!open) return null

    return (
        <aside className="participants-panel">
            <div className="participants-panel-header">
                <h3>Учасники</h3>
                <button type="button" className="icon-button" onClick={onClose} title="Закрити">×</button>
            </div>

            <div className="participants-section">
                <div className="participants-section-header">
                    <h4>У кімнаті ({participants.length})</h4>
                    {isHost && (
                        <button type="button" disabled={mutingAll} onClick={handleMuteAll}>
                            Mute all
                        </button>
                    )}
                </div>
                <ul className="participants-list">
                    {participants.map((p) => {
                        const isSelf = p.identity === localParticipant.identity
                        return (
                            <li key={p.identity} className="participants-item">
                                <span>{p.name || p.identity}{isSelf && ' (ви)'}</span>
                                <span className="participant-status">
                                    {p.isMicrophoneEnabled ? '🎤' : '🔇'} {p.isCameraEnabled ? '📹' : '📷'}
                                    {isHost && !isSelf && (
                                        <button
                                            type="button"
                                            className="kick-button"
                                            disabled={busyUserId === p.identity}
                                            onClick={() => handleKick(p.identity)}
                                        >
                                            Kick
                                        </button>
                                    )}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>

            {isHost && (
                <div className="participants-section">
                    <h4>Кімната очікування ({waiting.length})</h4>
                    {waiting.length === 0 && <p className="hint">Немає нових запитів.</p>}
                    <ul className="participants-list">
                        {waiting.map((guest) => (
                            <li key={guest.userId} className="participants-item">
                                <span>{guest.displayName}</span>
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        disabled={busyUserId === guest.userId}
                                        onClick={() => handleAdmit(guest.userId)}
                                    >
                                        Let in
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busyUserId === guest.userId}
                                        onClick={() => handleDeny(guest.userId)}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    )
}
