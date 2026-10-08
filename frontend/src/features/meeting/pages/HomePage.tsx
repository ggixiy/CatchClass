import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { Modal } from '@/shared/ui/Modal'
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
import { joinRoom } from '@/features/room'

function monthRange(year: number, month: number) {
    return {
        from: new Date(Date.UTC(year, month, 1)).toISOString(),
        to: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
    }
}

export function HomePage() {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [occurrences, setOccurrences] = useState<MeetingOccurrence[]>([])
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
    const [detailsMeeting, setDetailsMeeting] = useState<Meeting | null>(null)
    const [displayName, setDisplayName] = useState('')

    const navigate = useNavigate()
    const [joinMeetingId, setJoinMeetingId] = useState('')
    const [joinPassword, setJoinPassword] = useState('')
    const [joinError, setJoinError] = useState<string | null>(null)

    async function startJoin(publicId: string, password: string) {
        setJoinError(null)
        try {
            const result = await joinRoom(publicId, password)
            if (result.status === 'ADMITTED') {
                navigate(`/room/${result.meetingId}`, {
                    state: { accessToken: result.accessToken, serverUrl: result.serverUrl, roomName: result.roomName },
                })
            } else {
                navigate(`/waiting/${result.meetingId}`)
            }
        } catch (err) {
            setJoinError(err instanceof ApiError ? err.message : 'Не вдалося приєднатися до заняття')
        }
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
        listOccurrences(from, to).then(setOccurrences).catch(() => setError('Не вдалося завантажити заняття'))
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
            setError(err instanceof ApiError ? err.message : 'Не вдалося відкрити заняття')
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

    async function handleDelete() {
        if (!detailsMeeting) return
        try {
            await deleteMeeting(detailsMeeting.id)
            setDetailsMeeting(null)
            reload()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не вдалося видалити заняття')
        }
    }

    async function handleInstantMeeting() {
        setError(null)
        try {
            const meeting = await createInstantMeeting(`Заняття ${displayName || 'Нове'}`)
            reload()
            setDetailsMeeting(meeting)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Не вдалося створити заняття')
        }
    }

    return (
        <main className="page-wide">
            <div className="home-header">
                <h1>CatchClass</h1>
                <Link to="/profile">Профіль</Link>
            </div>
            {error && <p className="error">{error}</p>}

            <div className="home-columns">
                <section className="home-column">
                    <div className="calendar-title-row">
                        <h2>Plan meeting</h2>
                        <button type="button" className="icon-button" onClick={() => setShowScheduleForm(true)} title="Запланувати заняття">+</button>
                    </div>
                    <MonthCalendar
                        year={year}
                        month={month}
                        occurrencesByDay={occurrencesByDay}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        onPrevMonth={goToPrevMonth}
                        onNextMonth={goToNextMonth}
                    />
                    {selectedDay && (
                        <div>
                            <h3>Заняття {selectedDay}</h3>
                            {dayOccurrences.length === 0 && <p className="hint">Немає занять цього дня.</p>}
                            <ul className="meeting-list">
                                {dayOccurrences.map((occ) => (
                                    <li key={`${occ.meetingId}-${occ.startTime}`}>
                                        <button type="button" onClick={() => openDetails(occ.meetingId)}>
                                            {new Date(occ.startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                            {' — '}{occ.title}{occ.recurring && ' 🔁'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className="home-column">
                    <button type="button" className="btn-primary btn-block" onClick={handleInstantMeeting}>New meeting</button>

                    <div className="join-block">
                        <form className="join-block" onSubmit={handleJoinExisting}>
                            <h2>Join Existing Meeting</h2>
                            {joinError && <p className="error">{joinError}</p>}
                            <input placeholder="Meeting ID" value={joinMeetingId} onChange={(e) => setJoinMeetingId(e.target.value)} required />
                            <input placeholder="Meeting password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
                            <button type="submit" className="btn-primary btn-block">Join</button>
                        </form>
                    </div>
                </section>
            </div>

            {showScheduleForm && (
                <Modal title="Запланувати заняття" onClose={() => setShowScheduleForm(false)}>
                    <ScheduleMeetingForm onSubmit={handleCreate} onCancel={() => setShowScheduleForm(false)} />
                </Modal>
            )}

            {editingMeeting && (
                <Modal title="Редагувати заняття" onClose={() => setEditingMeeting(null)}>
                    <ScheduleMeetingForm
                        initial={editingMeeting}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingMeeting(null)}
                    />
                </Modal>
            )}

            {detailsMeeting && !editingMeeting && (
                <Modal title="Заняття" onClose={() => setDetailsMeeting(null)}>
                    <MeetingDetailsModal
                        meeting={detailsMeeting}
                        onJoin={() => { setDetailsMeeting(null); startJoin(detailsMeeting.publicId, detailsMeeting.password ?? '') }}
                        onEdit={() => { setEditingMeeting(detailsMeeting); setDetailsMeeting(null) }}
                        onDelete={handleDelete}
                    />
                </Modal>
            )}
        </main>
    )
}