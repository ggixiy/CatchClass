import { useI18n } from '@/shared/i18n/I18nContext'
import { LeaveIcon } from '@/shared/ui/icons'

interface RoomEndedOverlayProps {
    // ended — організатор завершив конференцію для всіх; removed — саме цього учасника вилучили.
    kind: 'ended' | 'removed'
    onHome: () => void
}

// Повноекранний оверлей, який показується учасникові, коли сервер розірвав його
// з'єднання з кімнатою не з його волі (а не мовчки перекидає на головну сторінку).
export function RoomEndedOverlay({ kind, onHome }: RoomEndedOverlayProps) {
    const { t } = useI18n()
    return (
        <div className="room-ended-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="room-ended-title">
            <div className="room-ended-card">
                <span className="room-ended-icon"><LeaveIcon size={28} /></span>
                <h2 id="room-ended-title">{t(kind === 'ended' ? 'room.endedTitle' : 'room.removedTitle')}</h2>
                <p>{t(kind === 'ended' ? 'room.endedText' : 'room.removedText')}</p>
                <button type="button" className="btn-primary" autoFocus onClick={onHome}>
                    {t('room.backHome')}
                </button>
            </div>
        </div>
    )
}
