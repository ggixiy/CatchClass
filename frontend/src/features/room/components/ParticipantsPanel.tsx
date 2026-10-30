import { useMemo, useState } from 'react'
import { Participant } from 'livekit-client'
import { useLocalParticipant, useParticipants } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { CameraIcon, CameraOffIcon, HandIcon, MicIcon, MicOffIcon } from '@/shared/ui/icons'
import { kickParticipant, muteAll, unmuteAll } from '../api/roomApi'
import { sortByRaisedHand, useHandRaisedAt } from '../hooks/useHandRaisedAt'
import type { HostRequests } from '../hooks/useHostRequests'

interface ParticipantsPanelProps {
    meetingId: string
    isHost: boolean
    requests: HostRequests
    open: boolean
    onClose: () => void
}

interface ParticipantRowProps {
    participant: Participant
    isSelf: boolean
    isHost: boolean
    handRaised: boolean
    busy: boolean
    onKick: (identity: string) => void
}

function ParticipantRow({ participant: p, isSelf, isHost, handRaised, busy, onKick }: ParticipantRowProps) {
    const { t } = useI18n()
    return (
        <li className={`participants-item ${handRaised ? 'hand-raised' : ''}`}>
            <span className="participants-name">
                {handRaised && <HandIcon className="hand-icon" size={15} />}
                {p.name || p.identity}{isSelf && ` ${t('room.you')}`}
            </span>
            <span className="participant-status">
                {p.isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon className="status-icon-off" />}
                {p.isCameraEnabled ? <CameraIcon /> : <CameraOffIcon className="status-icon-off" />}
                {isHost && !isSelf && (
                    <button type="button" className="kick-button" disabled={busy} onClick={() => onKick(p.identity)}>
                        {t('room.kick')}
                    </button>
                )}
            </span>
        </li>
    )
}

// Бокова панель «Учасники» (рис. 4.7 ТЗ): хто в кімнаті (піднята рука — першими, у порядку
// підняття), для організатора — «Заглушити всіх / Розмутити всіх», кімната очікування та
// запити на показ екрана. «Завершити конференцію для всіх» тут більше немає — вона живе в
// меню кнопки виходу. Саме опитування запитів робить useHostRequests, один раз на кімнату.
export function ParticipantsPanel({ meetingId, isHost, requests, open, onClose }: ParticipantsPanelProps) {
    const { t } = useI18n()
    const participants = useParticipants()
    const { localParticipant } = useLocalParticipant()
    const handRaisedAt = useHandRaisedAt()
    const [kickingId, setKickingId] = useState<string | null>(null)
    const [mutingAll, setMutingAll] = useState(false)
    const [unmutingAll, setUnmutingAll] = useState(false)

    const ordered = useMemo(
        () => sortByRaisedHand(participants, (p) => p.identity, handRaisedAt),
        [participants, handRaisedAt],
    )

    async function handleKick(identity: string) {
        setKickingId(identity)
        try {
            await kickParticipant(meetingId, identity)
        } finally {
            setKickingId(null)
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

    async function handleUnmuteAll() {
        setUnmutingAll(true)
        try {
            await unmuteAll(meetingId)
        } finally {
            setUnmutingAll(false)
        }
    }

    if (!open) return null

    const { waiting, screenShare, busyUserId, admit, deny, allowScreen, declineScreen } = requests

    return (
        <aside className="participants-panel">
            <div className="participants-panel-header">
                <h3>{t('room.title')}</h3>
                <button type="button" className="icon-button" onClick={onClose} title={t('common.close')}>×</button>
            </div>

            <div className="side-panel-body">
                {isHost && (waiting.length > 0 || screenShare.length > 0) && (
                    <div className="participants-section">
                        {waiting.length > 0 && (
                            <>
                                <h4>{t('room.waitingRoomSection', { count: waiting.length })}</h4>
                                <ul className="participants-list">
                                    {waiting.map((guest) => (
                                        <li key={guest.userId} className="participants-item">
                                            <span>{guest.displayName}</span>
                                            <div className="form-actions">
                                                <button type="button" className="btn-primary" disabled={busyUserId === guest.userId} onClick={() => admit(guest.userId)}>
                                                    {t('room.letIn')}
                                                </button>
                                                <button type="button" disabled={busyUserId === guest.userId} onClick={() => deny(guest.userId)}>
                                                    {t('room.reject')}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {screenShare.length > 0 && (
                            <>
                                <h4 className="participants-subheading">{t('room.screenShareRequests', { count: screenShare.length })}</h4>
                                <ul className="participants-list">
                                    {screenShare.map((req) => (
                                        <li key={req.userId} className="participants-item">
                                            <span>{req.displayName}</span>
                                            <div className="form-actions">
                                                <button type="button" className="btn-primary" disabled={busyUserId === req.userId} onClick={() => allowScreen(req.userId)}>
                                                    {t('room.allow')}
                                                </button>
                                                <button type="button" disabled={busyUserId === req.userId} onClick={() => declineScreen(req.userId)}>
                                                    {t('room.decline')}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                <div className="participants-section">
                    <div className="participants-section-header">
                        <h4>{t('room.inRoom', { count: participants.length })}</h4>
                        {isHost && (
                            <div className="form-actions">
                                <button type="button" disabled={mutingAll} onClick={handleMuteAll}>
                                    {t('room.muteAll')}
                                </button>
                                <button type="button" disabled={unmutingAll} onClick={handleUnmuteAll}>
                                    {t('room.unmuteAll')}
                                </button>
                            </div>
                        )}
                    </div>
                    <ul className="participants-list">
                        {ordered.map((p) => (
                            <ParticipantRow
                                key={p.identity}
                                participant={p}
                                isSelf={p.identity === localParticipant.identity}
                                isHost={isHost}
                                handRaised={handRaisedAt[p.identity] !== undefined}
                                busy={kickingId === p.identity}
                                onKick={handleKick}
                            />
                        ))}
                    </ul>
                </div>

                {isHost && waiting.length === 0 && screenShare.length === 0 && (
                    <p className="hint">{t('room.noRequests')}</p>
                )}
            </div>
        </aside>
    )
}
