import { FormEvent, useState } from 'react'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { generateMeetingPassword, Meeting, MeetingFormData, RecurrenceRule } from '../api/meetingApi'

interface ScheduleMeetingFormProps {
    initial?: Meeting
    initialDate?: string
    onSubmit: (data: MeetingFormData) => Promise<void>
    onCancel: () => void
}

function toLocalInputValue(iso: string | undefined): string {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Якщо на календарі вже обраний день — підставляємо його датою початку,
// а час беремо найближчий зручний (округлений вгору до 30 хв від поточного).
function defaultStartForDay(day: string): string {
    const [y, m, d] = day.split('-').map(Number)
    const now = new Date()
    const rounded = new Date(y, m - 1, d, now.getHours(), now.getMinutes())
    rounded.setMinutes(Math.ceil(rounded.getMinutes() / 30) * 30, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${rounded.getFullYear()}-${pad(rounded.getMonth() + 1)}-${pad(rounded.getDate())}T${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`
}

export function ScheduleMeetingForm({ initial, initialDate, onSubmit, onCancel }: ScheduleMeetingFormProps) {
    const { t } = useI18n()
    const [title, setTitle] = useState(initial?.title ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [startLocal, setStartLocal] = useState(
        initial?.startTime ? toLocalInputValue(initial.startTime) : initialDate ? defaultStartForDay(initialDate) : ''
    )
    const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 60)
    const [recurrence, setRecurrence] = useState<RecurrenceRule>(initial?.recurrence ?? 'NONE')
    const [endsLocal, setEndsLocal] = useState(toLocalInputValue(initial?.recurrenceEndsAt ?? undefined))
    const [requirePassword, setRequirePassword] = useState(initial ? Boolean(initial.password) : true)
    const [password, setPassword] = useState(initial?.password ?? generateMeetingPassword())
    const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(initial?.waitingRoomEnabled ?? true)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    function handleTogglePassword(checked: boolean) {
        setRequirePassword(checked)
        // При увімкненні — одразу підставляємо готовий варіант, який можна відредагувати.
        if (checked && !password) setPassword(generateMeetingPassword())
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            await onSubmit({
                title,
                description,
                startTime: new Date(startLocal).toISOString(),
                durationMinutes,
                recurrence,
                recurrenceEndsAt: recurrence !== 'NONE' && endsLocal ? new Date(endsLocal).toISOString() : null,
                requirePassword,
                password: requirePassword ? password : '',
                waitingRoomEnabled,
            })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('schedule.error'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="stacked-form">
            {error && <p className="error">{error}</p>}
            <label className="field-full">
                {t('schedule.titlePlaceholder')}
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="field-full">
                {t('schedule.descriptionPlaceholder')}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <label>
                {t('schedule.start')}
                <input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} required />
            </label>
            <label>
                {t('schedule.duration')}
                <input
                    type="number" min={5} max={480} value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))} required
                />
            </label>
            <label>
                {t('schedule.recurrence')}
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceRule)}>
                    <option value="NONE">{t('schedule.recurrenceNone')}</option>
                    <option value="WEEKLY">{t('schedule.recurrenceWeekly')}</option>
                    <option value="MONTHLY">{t('schedule.recurrenceMonthly')}</option>
                </select>
            </label>
            {recurrence !== 'NONE' && (
                <label className="reveal-field">
                    {t('schedule.recurrenceUntil')}
                    <input type="datetime-local" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} />
                </label>
            )}

            <label className="checkbox-row">
                <input
                    type="checkbox"
                    checked={requirePassword}
                    onChange={(e) => handleTogglePassword(e.target.checked)}
                />
                {t('schedule.requirePassword')}
            </label>
            {requirePassword && (
                <label className="field-full reveal-field">
                    {t('common.password')}
                    <div className="password-row">
                        <input value={password} onChange={(e) => setPassword(e.target.value)} maxLength={20} required />
                        <button type="button" onClick={() => setPassword(generateMeetingPassword())}>{t('common.generate')}</button>
                    </div>
                </label>
            )}

            <label className="checkbox-row">
                <input
                    type="checkbox"
                    checked={waitingRoomEnabled}
                    onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                />
                {t('schedule.waitingRoom')}
            </label>
            {!waitingRoomEnabled && (
                <p className="hint">{t('schedule.waitingRoomHint')}</p>
            )}

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>{t('common.save')}</button>
                <button type="button" onClick={onCancel}>{t('common.cancel')}</button>
            </div>
        </form>
    )
}
