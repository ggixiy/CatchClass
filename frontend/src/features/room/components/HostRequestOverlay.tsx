import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { ScreenShareIcon, UsersIcon } from '@/shared/ui/icons'
import type { HostRequests } from '../hooks/useHostRequests'

// Скільки нове сповіщення висить поверх відео. Запит нікуди не зникає — він і далі
// видно в панелі «Учасники» та в лічильнику на кнопці; це лише швидкий спосіб відповісти.
const VISIBLE_MS = 12000

interface OverlayItem {
    key: string
    kind: 'join' | 'screen'
    userId: string
    name: string
}

interface HostRequestOverlayProps {
    requests: HostRequests
    // Коли відкрита панель «Учасники», запити й так перед очима — дублювати їх не треба.
    hidden: boolean
}

export function HostRequestOverlay({ requests, hidden }: HostRequestOverlayProps) {
    const { t } = useI18n()
    const { waiting, screenShare, busyUserId, admit, deny, allowScreen, declineScreen } = requests
    const firstSeenAt = useRef(new Map<string, number>())
    const [, tick] = useState(0)

    const items = useMemo<OverlayItem[]>(
        () => [
            ...waiting.map((g) => ({ key: `join:${g.userId}`, kind: 'join' as const, userId: g.userId, name: g.displayName })),
            ...screenShare.map((r) => ({ key: `screen:${r.userId}`, kind: 'screen' as const, userId: r.userId, name: r.displayName })),
        ],
        [waiting, screenShare],
    )

    // Запам'ятовуємо момент, коли запит з'явився вперше, і забуваємо ті, що вже оброблені.
    useEffect(() => {
        const now = Date.now()
        const alive = new Set(items.map((i) => i.key))
        for (const item of items) {
            if (!firstSeenAt.current.has(item.key)) firstSeenAt.current.set(item.key, now)
        }
        for (const key of [...firstSeenAt.current.keys()]) {
            if (!alive.has(key)) firstSeenAt.current.delete(key)
        }
        tick((n) => n + 1)
    }, [items])

    // Раз на секунду перевіряємо, чи не пора сховати сповіщення, що висить надто довго.
    useEffect(() => {
        if (items.length === 0) return
        const id = setInterval(() => tick((n) => n + 1), 1000)
        return () => clearInterval(id)
    }, [items.length])

    const now = Date.now()
    const visible = items.filter((i) => now - (firstSeenAt.current.get(i.key) ?? now) < VISIBLE_MS)
    if (hidden || visible.length === 0) return null

    return (
        <div className="request-overlay" role="region" aria-live="polite">
            {visible.map((item) => {
                const busy = busyUserId === item.userId
                return (
                    <div key={item.key} className="request-card">
                        <span className="request-card-icon">
                            {item.kind === 'join' ? <UsersIcon size={18} /> : <ScreenShareIcon size={18} />}
                        </span>
                        <span className="request-card-text">
                            {t(item.kind === 'join' ? 'room.requestJoin' : 'room.requestScreen', { name: item.name })}
                        </span>
                        <span className="request-card-actions">
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={busy}
                                onClick={() => (item.kind === 'join' ? admit(item.userId) : allowScreen(item.userId))}
                            >
                                {t(item.kind === 'join' ? 'room.letIn' : 'room.allow')}
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => (item.kind === 'join' ? deny(item.userId) : declineScreen(item.userId))}
                            >
                                {t(item.kind === 'join' ? 'room.reject' : 'room.decline')}
                            </button>
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
