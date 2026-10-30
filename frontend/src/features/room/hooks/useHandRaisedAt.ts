import { useEffect, useState } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'

// identity → момент (мс), коли людина підняла руку. Піднята рука зберігається як атрибут
// учасника handRaised = String(Date.now()) (див. HandRaiseButton), тож за цим числом можна
// впорядкувати "хто підняв першим". Опущена рука — порожній рядок, у мапу не потрапляє.
export function useHandRaisedAt(): Record<string, number> {
    const room = useRoomContext()
    const [map, setMap] = useState<Record<string, number>>({})

    useEffect(() => {
        function compute() {
            const next: Record<string, number> = {}
            const all = [room.localParticipant, ...room.remoteParticipants.values()]
            for (const p of all) {
                const raw = p.attributes?.handRaised
                if (raw) next[p.identity] = Number(raw) || 0
            }
            setMap((prev) => {
                // Не перемальовуємо все дерево, якщо нічого не змінилось.
                const prevKeys = Object.keys(prev)
                const nextKeys = Object.keys(next)
                if (prevKeys.length === nextKeys.length && nextKeys.every((k) => prev[k] === next[k])) return prev
                return next
            })
        }

        compute()
        room.on(RoomEvent.ParticipantAttributesChanged, compute)
        room.on(RoomEvent.ParticipantConnected, compute)
        room.on(RoomEvent.ParticipantDisconnected, compute)
        return () => {
            room.off(RoomEvent.ParticipantAttributesChanged, compute)
            room.off(RoomEvent.ParticipantConnected, compute)
            room.off(RoomEvent.ParticipantDisconnected, compute)
        }
    }, [room])

    return map
}

// Підняті руки — першими, у порядку підняття (хто раніше, той лівіше/вище); ті, хто руку
// не піднімав, лишаються в кінці у своєму початковому порядку. sort() у сучасних рушіях
// стабільний, тож "без руки" між собою не перемішуються.
export function sortByRaisedHand<T>(items: T[], identityOf: (item: T) => string, raisedAt: Record<string, number>): T[] {
    return [...items].sort((a, b) => {
        const ta = raisedAt[identityOf(a)]
        const tb = raisedAt[identityOf(b)]
        if (ta === undefined && tb === undefined) return 0
        if (ta === undefined) return 1
        if (tb === undefined) return -1
        return ta - tb
    })
}
