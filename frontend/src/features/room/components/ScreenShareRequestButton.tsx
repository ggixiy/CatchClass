import { useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { ScreenShareIcon } from '@/shared/ui/icons'
import { requestScreenShare } from '../api/roomApi'

interface ScreenShareRequestButtonProps {
    meetingId: string
}

// Для учасника (не організатора): за замовчуванням демонстрація екрана заблокована на
// рівні LiveKit-прав, тому штатної кнопки «Share screen» у нього немає. Ця кнопка стоїть
// рівно на її місці (між камерою й чатом) і лише надсилає запит організатору — після
// схвалення зникає, а на її місці з'являється звичайна кнопка LiveKit, без перезаходу.
export function ScreenShareRequestButton({ meetingId }: ScreenShareRequestButtonProps) {
    const { t } = useI18n()
    const [sent, setSent] = useState(false)
    const [sending, setSending] = useState(false)

    async function handleClick() {
        setSending(true)
        try {
            await requestScreenShare(meetingId)
            setSent(true)
        } catch {
            // Якщо запит не пройшов — просто дозволяємо спробувати ще раз.
        } finally {
            setSending(false)
        }
    }

    return (
        <button type="button" className="lk-button" disabled={sending || sent} onClick={handleClick}>
            <ScreenShareIcon /> {sent ? t('room.screenShareSent') : t('room.screenShareRequest')}
        </button>
    )
}
