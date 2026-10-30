import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { Modal } from '@/shared/ui/Modal'
import { useI18n } from '@/shared/i18n/I18nContext'
import {
    createInstantMeeting, createMeeting, deleteMeeting, getMeeting, listOccurrences, updateMeeting,
    Meeting, MeetingFormData, MeetingOccurrence,
} from '../api/meetingApi'
import { MeetingDetailsModal } from '../components/MeetingDetailsModal'
import { MonthCalendar } from '../components/MonthCalendar'
import { ScheduleMeetingForm } from '../components/ScheduleMeetingForm'
import { getMyProfile } from '@/features/user'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'


function monthRange(year: number, month: number) {
    return {
        from: new Date(Date.UTC(year, month, 1)).toISOString(),
        to: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
    }
}

function toDateKey(d: Date) {
    return d.toISOString().slice(0, 10)
}

export function HomePage() {
    const { t, locale } = useI18n()
    const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US'
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [occurrences, setOccurrences] = useState<MeetingOccurrence[]>([])
    const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(today))
    const [error, setError] = useState<string | null>(null)

    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
    const [detailsMeeting, setDetailsMeeting] = useState<Meeting | null>(null)
    // id миттєвої зустрічі, чиє вікно зараз відкрите: закриття без входу видаляє її.
    const [instantId, setInstantId] = useState<string | null>(null)
    const [displayName, setDisplayName] = useState('')

    const navigate = useNavigate()
    const [joinMeetingId, setJoinMeetingId] = useState('')
    const [joinPassword, setJoinPassword] = useState('')
    const [joinError, setJoinError] = useState<string | null>(null)

    // Більше не звертаємось до /rooms/join тут — спершу ведемо людину на екран
    // перевірки камери/мікрофона (PreJoinLobby), а сам запит на вхід виконується вже там,
    // після того як вона натисне «Приєднатися». Це однаково стосується і організатора, і гостя.
    function startJoin(publicId: string, password: string) {
        setJoinError(null)
        navigate('/prejoin', { state: { publicId, password } })
    }

    async function handleJoinExisting(e: FormEvent) {
        e.preventDefault()
        await startJoin(joinMeetingId.trim(), joinPassword)
    }

    useEffect(() => {
        getMyProfile().then((p) => setDisplayName(p.displayName)).catch(() => {})
    }, [])

    function reload() {
        const { from, to } = monthRange(year, month)
        listOccurrences(from, to).then(setOccurrences).catch(() => setError(t('home.loadError')))
    }

    useEffect(reload, [year, month])

    const occurrencesByDay = useMemo(() => {
        const map = new Map<string, number>()
        for (const occ of occurrences) {
            const key = occ.startTime.slice(0, 10)
            map.set(key, (map.get(key) ?? 0) + 1)
        }
        return map
    }, [occurrences])

    const dayOccurrences = useMemo(
        () => occurrences.filter((o) => o.startTime.slice(0, 10) === selectedDay),
        [occurrences, selectedDay],
    )

    function goToPrevMonth() {
        if (month === 0) { setYear((y) => y - 1); setMonth(11) } else { setMonth((m) => m - 1) }
    }
    function goToNextMonth() {
        if (month === 11) { setYear((y) => y + 1); setMonth(0) } else { setMonth((m) => m + 1) }
    }

    async function openDetails(meetingId: string) {
        setError(null)
        try {
            setDetailsMeeting(await getMeeting(meetingId))
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.detailsError'))
        }
    }

    async function openEdit(meetingId: string) {
        setError(null)
        try {
            setEditingMeeting(await getMeeting(meetingId))
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.detailsError'))
        }
    }

    async function handleInlineDelete(meetingId: string) {
        if (!window.confirm(t('home.confirmDelete'))) return
        setError(null)
        try {
            await deleteMeeting(meetingId)
            reload()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.deleteError'))
        }
    }

    async function handleCreate(data: MeetingFormData) {
        const created = await createMeeting(data)
        setShowScheduleForm(false)
        reload()
        setDetailsMeeting(created)
    }

    async function handleUpdate(data: MeetingFormData) {
        if (!editingMeeting) return
        const updated = await updateMeeting(editingMeeting.id, data)
        setEditingMeeting(null)
        reload()
        setDetailsMeeting(updated)
    }

    async function closeDetails() {
        const meeting = detailsMeeting
        const discard = meeting !== null && meeting.id === instantId
        setDetailsMeeting(null)
        setInstantId(null)
        if (discard) {
            try { await deleteMeeting(meeting.id) } catch { /* вже видалено */ }
            reload()
        }
    }

    async function handleDelete() {
        if (!detailsMeeting) return
        try {
            await deleteMeeting(detailsMeeting.id)
            setDetailsMeeting(null)
            reload()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.deleteError'))
        }
    }

    async function handleInstantMeeting() {
        setError(null)
        try {
            const meeting = await createInstantMeeting(t('home.instantTitle', { name: displayName || t('home.instantFallbackName') }))
            reload()
            setInstantId(meeting.id)
            setDetailsMeeting(meeting)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.instantError'))
        }
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? t('home.greetingMorning') : hour < 18 ? t('home.greetingDay') : t('home.greetingEvening')
    const selectedDayLabel = selectedDay
        ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'long' })
        : ''

    return (
        <main className="page-wide">
            <div className="home-header">
                <h1>{greeting}{displayName ? `, ${displayName}` : ''}</h1>
                <Link to="/profile">{t('home.profile')}</Link>
            </div>
            {error && <p className="error">{error}</p>}

            <div className="home-columns">
                <section className="home-column">
                    <div className="card">
                        <div className="calendar-title-row">
                            <h2>{selectedDay ? t('home.lessonsFor', { day: selectedDayLabel }) : t('home.scheduleTitle')}</h2>
                            <button type="button" className="btn-primary schedule-cta" onClick={() => setShowScheduleForm(true)}>{t('home.scheduleButton')}</button>
                        </div>
                        {dayOccurrences.length === 0 && <p className="hint">{t('home.lessonsEmpty')}</p>}
                        <ul className="meeting-list">
                            {dayOccurrences.map((occ) => (
                                <li key={`${occ.meetingId}-${occ.startTime}`} className="meeting-list-item">
                                    <button type="button" className="meeting-list-open" onClick={() => openDetails(occ.meetingId)}>
                                        {new Date(occ.startTime).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
                                        {' — '}{occ.title}{occ.recurring && ' 🔁'}
                                    </button>
                                    <div className="meeting-list-actions">
                                        <button type="button" className="icon-button" title={t('common.edit')} onClick={() => openEdit(occ.meetingId)}>✎</button>
                                        <button type="button" className="icon-button icon-button-danger" title={t('common.delete')} onClick={() => handleInlineDelete(occ.meetingId)}>🗑</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="card">
                        <MonthCalendar
                            year={year}
                            month={month}
                            occurrencesByDay={occurrencesByDay}
                            selectedDay={selectedDay}
                            onSelectDay={setSelectedDay}
                            onPrevMonth={goToPrevMonth}
                            onNextMonth={goToNextMonth}
                        />
                    </div>
                </section>

                <section className="home-column">
                    <button type="button" className="btn-primary btn-block card-cta" onClick={handleInstantMeeting}>{t('home.newMeeting')}</button>

                    <div className="card">
                        <form onSubmit={handleJoinExisting} className="stacked-form">
                            <h2>{t('home.joinTitle')}</h2>
                            {joinError && <p className="error">{joinError}</p>}
                            <label>
                                Meeting ID
                                <input value={joinMeetingId} onChange={(e) => setJoinMeetingId(e.target.value)} required />
                            </label>
                            <label>
                                {t('common.password')}
                                <input value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
                            </label>
                            <button type="submit" className="btn-primary btn-block field-full">{t('home.joinSubmit')}</button>
                        </form>
                    </div>
                </section>
            </div>

            {showScheduleForm && (
                <Modal title={t('home.scheduleAddTitle')} onClose={() => setShowScheduleForm(false)} wide>
                    <ScheduleMeetingForm
                        initialDate={selectedDay ?? undefined}
                        onSubmit={handleCreate}
                        onCancel={() => setShowScheduleForm(false)}
                    />
                </Modal>
            )}

            {editingMeeting && (
                <Modal title={t('home.editTitle')} onClose={() => setEditingMeeting(null)} wide>
                    <ScheduleMeetingForm
                        initial={editingMeeting}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingMeeting(null)}
                    />
                </Modal>
            )}

            {detailsMeeting && !editingMeeting && (
                <Modal title={t('home.detailsTitle')} onClose={closeDetails}>
                    <MeetingDetailsModal
                        meeting={detailsMeeting}
                        instant={detailsMeeting.id === instantId}
                        onJoin={() => { setDetailsMeeting(null); setInstantId(null); startJoin(detailsMeeting.publicId, detailsMeeting.password ?? '') }}
                        onEdit={() => { setEditingMeeting(detailsMeeting); setDetailsMeeting(null) }}
                        onDelete={handleDelete}
                    />
                </Modal>
            )}
        </main>
    )
}
