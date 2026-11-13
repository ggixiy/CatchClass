import { useCallback, useEffect, useRef } from 'react'
import { RoomEvent } from 'livekit-client'
import { useRoomContext } from '@livekit/components-react'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Обмін короткими JSON-повідомленнями через LiveKit data-канал (реакції, опитування).
 * publishData не доставляє повідомлення відправнику, тож «локальне відлуння» робить сам виклик.
 */
export function useDataTopic<T>(topic: string, onMessage: (msg: T, senderIdentity: string) => void) {
    const room = useRoomContext()
    const handler = useRef(onMessage)
    handler.current = onMessage

    useEffect(() => {
        function onData(payload: Uint8Array, participant: { identity: string } | undefined, _kind: unknown, msgTopic?: string) {
            if (msgTopic !== topic || !participant) return
            try {
                handler.current(JSON.parse(decoder.decode(payload)) as T, participant.identity)
            } catch {
                // некоректне повідомлення — ігноруємо
            }
        }
        room.on(RoomEvent.DataReceived, onData)
        return () => { room.off(RoomEvent.DataReceived, onData) }
    }, [room, topic])

    return useCallback((msg: T, destinationIdentities?: string[]) => {
        room.localParticipant
            .publishData(encoder.encode(JSON.stringify(msg)), { reliable: true, topic, destinationIdentities })
            .catch(() => {})
        // локальне відлуння — лише коли повідомлення адресоване й нам (тобто не точковій розсилці)
        if (!destinationIdentities) handler.current(msg, room.localParticipant.identity)
    }, [room, topic])
}
