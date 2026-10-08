import { useState } from 'react'
import { Meeting } from '../api/meetingApi'

interface MeetingDetailsModalProps {
    meeting: Meeting
    onJoin: () => void
    onEdit: () => void
    onDelete: () => void
}

export function MeetingDetailsModal({ meeting, onJoin, onEdit, onDelete }: MeetingDetailsModalProps) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        const text = `Meeting ID: ${meeting.publicId}${meeting.password ? `\nПароль: ${meeting.password}` : ''}`
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div>
            <p><strong>{meeting.title}</strong></p>
            {meeting.description && <p>{meeting.description}</p>}
            <p>Meeting ID: <code>{meeting.publicId}</code></p>
            {meeting.password && <p>Пароль: <code>{meeting.password}</code></p>}
            <div className="form-actions">
                <button type="button" className="btn-primary" onClick={onJoin}>Приєднатися</button>
                <button type="button" onClick={handleCopy}>{copied ? 'Скопійовано!' : 'Copy'}</button>
                <button type="button" onClick={onEdit}>Редагувати</button>
                <button type="button" onClick={onDelete}>Видалити</button>
            </div>
        </div>
    )
}