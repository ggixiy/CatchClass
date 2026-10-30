import { useParticipantAttribute, useLocalParticipant } from '@livekit/components-react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { HandIcon } from '@/shared/ui/icons'

// Піднята рука зберігається як атрибут учасника (LiveKit сам синхронізує його з усіма
// присутніми, включно з тими, хто приєднається пізніше). Значення — момент підняття
// (мс), за ним потім впорядковуються плитки: хто раніше підняв, той першим у сітці.
// Порожній рядок означає "опущена".
export function HandRaiseButton() {
    const { t } = useI18n()
    const { localParticipant } = useLocalParticipant()
    const raised = Boolean(useParticipantAttribute('handRaised', { participant: localParticipant }))

    async function toggle() {
        try {
            await localParticipant.setAttributes({ handRaised: raised ? '' : String(Date.now()) })
        } catch {
            // Якщо з якоїсь причини атрибут не оновився — просто нічого не станеться візуально.
        }
    }

    return (
        <button
            type="button"
            className={`participants-toggle room-topbar-button ${raised ? 'hand-raised' : ''}`}
            aria-pressed={raised}
            onClick={toggle}
        >
            <HandIcon /> {raised ? t('room.lowerHand') : t('room.raiseHand')}
        </button>
    )
}
