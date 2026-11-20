import { useEffect, useState } from 'react'
import { Room, RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'

// identity → порядковий номер підняття руки (чим менший, тим раніше). Піднята рука зберігається
// як атрибут учасника handRaised (див. HandRaiseButton); порожній рядок — рука опущена.
//
// Порядок НЕ береться з годинників пристроїв: у різних людей вони розходяться (інший часовий пояс,
// неточний час), тож «хто раніше» за чужим Date.now() було б помилковим. Натомість номер присвоюється
// в порядку, в якому подія підняття руки дійшла до цього клієнта: сервер LiveKit розсилає оновлення
// всім в одному порядку, тож черга однакова в усіх. Лише для тих, кого ми побачили вже піднятими
// (наприклад, коли самі щойно зайшли в кімнату), порядок між ними береться з їхньої позначки часу.
// Хук викликають кілька компонентів (сітка, панель учасників), тому номери зберігаємо один раз
// на кімнату, а не в кожного компонента окремо — інакше порядок у них міг би розійтись.
interface HandStore {
    sequence: Map<string, number>
    counter: number
}
const stores = new WeakMap<Room, HandStore>()
function storeFor(room: Room): HandStore {
    let store = stores.get(room)
    if (!store) {
        store = { sequence: new Map(), counter: 0 }
        stores.set(room, store)
    }
    return store
}

export function useHandRaisedAt(): Record<string, number> {
    const room = useRoomContext()
    const [map, setMap] = useState<Record<string, number>>({})

    useEffect(() => {
        function compute() {
            const store = storeFor(room)
            const raised: { identity: string; stamp: number }[] = []
            const all = [room.localParticipant, ...room.remoteParticipants.values()]
            for (const p of all) {
                const raw = p.attributes?.handRaised
                if (raw) raised.push({ identity: p.identity, stamp: Number(raw) || 0 })
            }
            // Хто опустив руку або вийшов — забуваємо; хто підняв знову, піде в кінець черги.
            const stillRaised = new Set(raised.map((r) => r.identity))
            for (const id of [...store.sequence.keys()]) {
                if (!stillRaised.has(id)) store.sequence.delete(id)
            }
            // Нові (ще без номера): якщо їх кілька одразу — між собою за позначкою часу.
            raised
                .filter((r) => !store.sequence.has(r.identity))
                .sort((a, b) => a.stamp - b.stamp)
                .forEach((r) => store.sequence.set(r.identity, ++store.counter))
            const next: Record<string, number> = {}
            for (const [id, n] of store.sequence) next[id] = n
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
