import { useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Meeting } from '../api/meetingApi'

interface MeetingDetailsModalProps {
    meeting: Meeting
    // Миттєва зустріч: без «Видалити» — закриття вікна саме її видаляє.
    instant?: boolean
    onJoin: () => void
    onEdit: () => void
    onDelete: () => void
}

export function MeetingDetailsModal({ meeting, instant = false, onJoin, onEdit, onDelete }: MeetingDetailsModalProps) {
    const { t } = useI18n()
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        const query = meeting.password ? `?password=${encodeURIComponent(meeting.password)}` : ''
        await navigator.clipboard.writeText(`${window.location.origin}/join/${meeting.publicId}${query}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div className="details-stack">
            <div className="details-block">
                <p className="details-title"><strong>{meeting.title}</strong></p>
                {meeting.description && <p>{meeting.description}</p>}
            </div>
            <div className="details-info">
                <p><span className="info-label">{t('meetingDetails.meetingId')}</span><span className="info-chip">{meeting.publicId}</span></p>
                {meeting.password && <p><span className="info-label">{t('common.password')}</span><span className="info-chip">{meeting.password}</span></p>}
            </div>
            <div className="form-actions">
                <button type="button" className="btn-primary" onClick={onJoin}>{t('meetingDetails.join')}</button>
                <button type="button" onClick={handleCopy}>{copied ? t('common.copied') : t('common.copyLink')}</button>
                <button type="button" onClick={onEdit}>{t('common.edit')}</button>
                {!instant && <button type="button" onClick={onDelete}>{t('common.delete')}</button>}
            </div>
        </div>
    )
}
