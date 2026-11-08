import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Avatar } from '@/shared/ui/Avatar'
import { RepeatIcon, TrashIcon } from '@/shared/ui/icons'
import { Modal } from '@/shared/ui/Modal'
import { getMyProfile } from '@/features/user'
import {
    createMeeting, deleteMeeting, listCourseOccurrences, MeetingFormData, MeetingOccurrence,
} from '@/features/meeting/api/meetingApi'
import { DeleteOccurrenceDialog } from '@/features/meeting/components/DeleteOccurrenceDialog'
import { ScheduleMeetingForm } from '@/features/meeting/components/ScheduleMeetingForm'
import {
    Course, CourseMember, deleteCourse, getCourse, listCourseMembers, regenerateInviteCode,
    removeCourseMember, updateCourse,
} from '../api/courseApi'

const UPCOMING_DAYS = 90

// Сторінка курсу: розклад найближчих занять, код-запрошення (для викладача) і список учасників.
export function CoursePage() {
    const { t, locale } = useI18n()
    const { courseId = '' } = useParams<{ courseId: string }>()
    const navigate = useNavigate()
    const localeTag = locale === 'uk' ? 'uk-UA' : 'en-GB'

    const [course, setCourse] = useState<Course | null>(null)
    const [members, setMembers] = useState<CourseMember[]>([])
    const [lessons, setLessons] = useState<MeetingOccurrence[]>([])
    const [error, setError] = useState<string | null>(null)
    const [myId, setMyId] = useState<string | null>(null)
    const [deletingLesson, setDeletingLesson] = useState<MeetingOccurrence | null>(null)
    const [showSchedule, setShowSchedule] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [copied, setCopied] = useState<'code' | 'link' | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editDescription, setEditDescription] = useState('')

    const loadLessons = useCallback(() => {
        const from = new Date()
        const to = new Date(from.getTime() + UPCOMING_DAYS * 24 * 3600 * 1000)
        listCourseOccurrences(courseId, from.toISOString(), to.toISOString()).then(setLessons).catch(() => {})
    }, [courseId])

    useEffect(() => {
        getCourse(courseId)
            .then((c) => { setCourse(c); setEditTitle(c.title); setEditDescription(c.description ?? '') })
            .catch((err) => setError(err instanceof ApiError ? err.message : t('courses.loadError')))
        listCourseMembers(courseId).then(setMembers).catch(() => {})
        getMyProfile().then((p) => setMyId(p.id)).catch(() => {})
        loadLessons()
    }, [courseId, loadLessons])

    async function copy(kind: 'code' | 'link') {
        if (!course?.inviteCode) return
        const text = kind === 'code' ? course.inviteCode : `${window.location.origin}/join-course/${course.inviteCode}`
        try {
            await navigator.clipboard.writeText(text)
            setCopied(kind)
            setTimeout(() => setCopied(null), 1500)
        } catch { /* буфер недоступний */ }
    }

    async function handleRegenerate() {
        if (!window.confirm(t('courses.confirmRegenerate'))) return
        setCourse(await regenerateInviteCode(courseId))
    }

    async function handleCreateLesson(data: MeetingFormData) {
        await createMeeting({ ...data, courseId })
        setShowSchedule(false)
        loadLessons()
    }

    async function handleDeleteLesson(lesson: MeetingOccurrence) {
        if (lesson.recurring) {
            setDeletingLesson(lesson)
            return
        }
        if (!window.confirm(t('home.confirmDelete'))) return
        try {
            await deleteMeeting(lesson.meetingId)
            loadLessons()
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('home.deleteError'))
        }
    }

    async function handleEdit(e: FormEvent) {
        e.preventDefault()
        try {
            setCourse(await updateCourse(courseId, { title: editTitle, description: editDescription }))
            setShowEdit(false)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('courses.createError'))
        }
    }

    async function handleDeleteCourse() {
        if (!window.confirm(t('courses.confirmDelete'))) return
        await deleteCourse(courseId)
        navigate('/courses')
    }

    async function handleRemove(userId: string, self: boolean) {
        if (!window.confirm(self ? t('courses.confirmLeave') : t('courses.confirmRemove'))) return
        try {
            await removeCourseMember(courseId, userId)
            if (self) navigate('/courses')
            else setMembers(await listCourseMembers(courseId))
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('courses.loadError'))
        }
    }

    if (error && !course) return <main className="page"><p className="error">{error}</p></main>
    if (!course) return <main className="page"><p>{t('common.loading')}</p></main>

    return (
        <main className="page-wide">
            <div className="home-header">
                <div>
                    <h1>{course.title}</h1>
                    <p className="hint">{t('courses.teacher', { name: course.ownerName })}</p>
                </div>
                {course.owner && (
                    <div className="form-actions">
                        <button type="button" className="btn-primary schedule-cta" onClick={() => setShowSchedule(true)}>{t('courses.addLesson')}</button>
                        <button type="button" onClick={() => setShowEdit(true)}>{t('common.edit')}</button>
                        <button type="button" onClick={handleDeleteCourse}>{t('courses.delete')}</button>
                    </div>
                )}
            </div>
            {course.description && <p>{course.description}</p>}
            {error && <p className="error">{error}</p>}

            <div className="home-columns">
                <section className="home-column">
                    <div className="card card-lg">
                        <h2>{t('courses.schedule')}</h2>
                        {lessons.length === 0 && <p className="hint">{t('courses.scheduleEmpty')}</p>}
                        <ul className="meeting-list lesson-list">
                            {lessons.map((l) => (
                                <li key={`${l.meetingId}-${l.startTime}`} className="meeting-list-item">
                                    <span className="meeting-list-open course-lesson">
                                        <strong>{new Date(l.startTime).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', weekday: 'short' })}</strong>
                                        {' · '}{new Date(l.startTime).toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' })}
                                        {' — '}{l.title}{l.recurring && <RepeatIcon className="recurring-icon" size={16} />}
                                    </span>
                                    <div className="meeting-list-actions">
                                        <button type="button" className="btn-primary" onClick={() => navigate('/prejoin', { state: { publicId: l.publicId, password: '' } })}>{t('meetingDetails.join')}</button>
                                        {course.owner && (
                                            <button type="button" className="icon-button icon-button-danger" title={t('common.delete')} onClick={() => handleDeleteLesson(l)}><TrashIcon size={22} /></button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="home-column">
                    {course.owner && course.inviteCode && (
                        <div className="card invite-card">
                            <h2>{t('courses.invite')}</h2>
                            <p className="hint">{t('courses.inviteHint')}</p>
                            <p><span className="info-chip">{course.inviteCode}</span></p>
                            <div className="form-actions">
                                <button type="button" onClick={() => copy('code')}>{copied === 'code' ? t('common.copied') : t('courses.copyCode')}</button>
                                <button type="button" onClick={() => copy('link')}>{copied === 'link' ? t('common.copied') : t('common.copyLink')}</button>
                                <button type="button" onClick={handleRegenerate}>{t('courses.regenerate')}</button>
                            </div>
                        </div>
                    )}

                    <div className="card card-lg">
                        <h2>{t('courses.members')} ({members.length})</h2>
                        <ul className="course-members">
                            {members.map((m) => (
                                <li key={m.userId}>
                                    <Avatar size={40} photoUrl={m.photoUrl} displayName={m.displayName || '?'} />
                                    <span className="course-member-name">
                                        <strong>{m.displayName}</strong>
                                        {course.owner && m.email && <small>{m.email}</small>}
                                    </span>
                                    {m.owner
                                        ? <span className="info-chip">{t('courses.teacherBadge')}</span>
                                        : course.owner
                                            ? <button type="button" onClick={() => handleRemove(m.userId, false)}>{t('courses.remove')}</button>
                                            : null}
                                </li>
                            ))}
                        </ul>
                        {!course.owner && myId && (
                            <div className="form-actions">
                                <button type="button" onClick={() => handleRemove(myId, true)}>{t('courses.leave')}</button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {deletingLesson && (
                <DeleteOccurrenceDialog
                    occurrence={deletingLesson}
                    onClose={() => setDeletingLesson(null)}
                    onDeleted={() => { setDeletingLesson(null); loadLessons() }}
                />
            )}

            {showSchedule && (
                <Modal title={t('courses.addLesson')} onClose={() => setShowSchedule(false)} wide>
                    <ScheduleMeetingForm
                        courses={[{ id: course.id, title: course.title }]}
                        defaultCourseId={course.id}
                        onSubmit={handleCreateLesson}
                        onCancel={() => setShowSchedule(false)}
                    />
                </Modal>
            )}

            {showEdit && (
                <Modal title={t('courses.edit')} onClose={() => setShowEdit(false)}>
                    <form onSubmit={handleEdit} className="stacked-form">
                        <label className="field-full">
                            {t('courses.nameLabel')}
                            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required maxLength={200} />
                        </label>
                        <label className="field-full">
                            {t('courses.descriptionLabel')}
                            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">{t('common.save')}</button>
                            <button type="button" onClick={() => setShowEdit(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </main>
    )
}
