import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { getInvite, getRoomStatus, setWaitingRoom } from '../api/roomApi'

interface RoomSettingsMenuProps {
    isHost: boolean
    meetingId?: string
    publicId: string
    waitingRoomEnabled: boolean
}

// Меню «⋯» у правому верхньому куті кімнати: налаштування, які можна міняти під час заняття.
// Копіювати ідентифікатор і посилання може будь-хто, кімнату очікування перемикає лише організатор.
export function RoomSettingsMenu({ isHost, meetingId, publicId, waitingRoomEnabled }: RoomSettingsMenuProps) {
    const { t } = useI18n()
    const [open, setOpen] = useState(false)
    const [waiting, setWaiting] = useState(waitingRoomEnabled)
    const [copied, setCopied] = useState<'id' | 'link' | null>(null)
    const [failed, setFailed] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => setWaiting(waitingRoomEnabled), [waitingRoomEnabled])

    // Щоразу при відкритті меню беремо актуальний стан із сервера.
    useEffect(() => {
        if (!open || !meetingId) return
        getRoomStatus(meetingId).then((r) => setWaiting(r.waitingRoomEnabled)).catch(() => {})
    }, [open, meetingId])

    useEffect(() => {
        if (!open) return
        function onDown(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    async function copy(kind: 'id' | 'link') {
        try {
            let text = publicId
            if (kind === 'link') {
                const invite = meetingId ? await getInvite(meetingId) : { publicId, password: null }
                const query = invite.password ? `?password=${encodeURIComponent(invite.password)}` : ''
                text = `${window.location.origin}/join/${invite.publicId}${query}`
            }
            await navigator.clipboard.writeText(text)
            setCopied(kind)
            setTimeout(() => setCopied(null), 1500)
        } catch {
            // буфер обміну недоступний — нічого не робимо
        }
    }

    async function toggleWaiting() {
        if (!meetingId) return
        const next = !waiting
        setWaiting(next)
        try {
            await setWaitingRoom(meetingId, next)
        } catch {
            setWaiting(!next)
            setFailed(true)
            setTimeout(() => setFailed(false), 2500)
        }
    }

    return (
        <div className="settings-wrap" ref={wrapRef}>
            <button
                type="button"
                className="room-topbar-button settings-trigger"
                aria-label={t('room.settings')}
                title={t('room.settings')}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
            </button>
            {open && (
                <div className="settings-menu" role="menu">
                    {isHost && (
                        <button type="button" role="menuitemcheckbox" aria-checked={waiting} onClick={toggleWaiting}>
                            <span>
                                <strong>{t('room.waitingRoomToggle')}</strong>
                                <small>{failed ? t('room.settingFailed') : t('room.waitingRoomHint')}</small>
                            </span>
                            <span className={`switch ${waiting ? 'on' : ''}`} aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" role="menuitem" onClick={() => copy('id')}>
                        <strong>{copied === 'id' ? t('common.copied') : t('room.copyId')}</strong>
                    </button>
                    <button type="button" role="menuitem" onClick={() => copy('link')}>
                        <strong>{copied === 'link' ? t('common.copied') : t('common.copyLink')}</strong>
                    </button>
                </div>
            )}
        </div>
    )
}
