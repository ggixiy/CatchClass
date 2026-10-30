import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomContext } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { LeaveIcon } from '@/shared/ui/icons'
import { endMeetingForAll } from '../api/roomApi'

interface LeaveButtonProps {
    isHost: boolean
    meetingId?: string
}

// Остання кнопка нижньої панелі. Звичайний учасник просто виходить. Для організатора
// кнопка називається «Завершити конференцію» і відкриває маленьке меню з двох варіантів:
// вийти самому (конференція триває) або завершити її для всіх — окремої кнопки
// «завершити для всіх» деінде більше немає.
export function LeaveButton({ isHost, meetingId }: LeaveButtonProps) {
    const { t } = useI18n()
    const room = useRoomContext()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [ending, setEnding] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return
        function onPointerDown(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [menuOpen])

    function leave() {
        setMenuOpen(false)
        // onDisconnected у LiveKitRoom сам поверне на головну сторінку.
        room.disconnect()
    }

    async function endForAll() {
        if (!meetingId || !window.confirm(t('room.confirmEnd'))) return
        setEnding(true)
        try {
            await endMeetingForAll(meetingId)
            navigate('/')
        } finally {
            setEnding(false)
            setMenuOpen(false)
        }
    }

    if (!isHost) {
        return (
            <button type="button" className="lk-button lk-disconnect-button" onClick={leave}>
                <LeaveIcon /> {t('room.leave')}
            </button>
        )
    }

    return (
        <div className="leave-wrap" ref={wrapRef}>
            <button
                type="button"
                className="lk-button lk-disconnect-button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
            >
                <LeaveIcon /> {t('room.endConference')}
            </button>
            {menuOpen && (
                <div className="leave-menu" role="menu">
                    <button type="button" role="menuitem" onClick={leave}>
                        <strong>{t('room.leaveConference')}</strong>
                        <small>{t('room.leaveHint')}</small>
                    </button>
                    <button type="button" role="menuitem" className="leave-menu-danger" disabled={ending} onClick={endForAll}>
                        <strong>{ending ? t('room.ending') : t('room.endForAll')}</strong>
                        <small>{t('room.endHint')}</small>
                    </button>
                </div>
            )}
        </div>
    )
}
