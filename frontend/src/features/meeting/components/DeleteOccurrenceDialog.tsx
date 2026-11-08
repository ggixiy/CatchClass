import { useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Modal } from '@/shared/ui/Modal'
import { deleteMeeting, deleteOccurrence, MeetingOccurrence } from '../api/meetingApi'

interface DeleteOccurrenceDialogProps {
    occurrence: MeetingOccurrence
    onClose: () => void
    onDeleted: () => void
}

// Питає, що видалити в повторюваному занятті: лише обране проведення чи всю серію.
export function DeleteOccurrenceDialog({ occurrence, onClose, onDeleted }: DeleteOccurrenceDialogProps) {
    const { t } = useI18n()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function run(action: () => Promise<void>) {
        setBusy(true)
        setError(null)
        try {
            await action()
            onDeleted()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.deleteError'))
            setBusy(false)
        }
    }

    return (
        <Modal title={t('home.deleteRecurringTitle')} onClose={onClose}>
            <div className="details-stack">
                <p>{t('home.deleteRecurringText', { title: occurrence.title })}</p>
                {error && <p className="error">{error}</p>}
                <div className="form-actions">
                    <button type="button" className="btn-primary" disabled={busy}
                        onClick={() => run(() => deleteOccurrence(occurrence.meetingId, occurrence.startTime))}>
                        {t('home.deleteThisOnly')}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run(() => deleteMeeting(occurrence.meetingId))}>
                        {t('home.deleteSeries')}
                    </button>
                    <button type="button" disabled={busy} onClick={onClose}>{t('common.cancel')}</button>
                </div>
            </div>
        </Modal>
    )
}
