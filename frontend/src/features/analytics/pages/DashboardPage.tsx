import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Avatar } from '@/shared/ui/Avatar'
import { getTeacherDashboard, TeacherDashboard } from '../api/analyticsApi'

// Дашборд викладача (вкладка курсу): заняття цього тижня, середня відвідуваність, найактивніші студенти.
export function DashboardView({ courseId }: { courseId: string }) {
    const { t, locale } = useI18n()
    const tag = locale === 'uk' ? 'uk-UA' : 'en-GB'
    const [data, setData] = useState<TeacherDashboard | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        getTeacherDashboard(courseId).then(setData).catch(() => setError(true))
    }, [courseId])

    if (error) return <p className="error">{t('dashboard.loadError')}</p>
    if (!data) return <p>{t('common.loading')}</p>

    const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short' })
    const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
    const weekRange = `${fmtDay(data.weekStart)} – ${fmtDay(new Date(new Date(data.weekEnd).getTime() - 1).toISOString())}`

    return (
        <div className="dash-view">
            <div className="dash-stats">
                <div className="card dash-stat dash-stat--pink">
                    <span className="dash-stat-value">{data.averageAttendance !== null ? `${data.averageAttendance}%` : '—'}</span>
                    <span className="hint">{t('dashboard.avgAttendance')}</span>
                </div>
                <div className="card dash-stat">
                    <span className="dash-stat-value">{data.weekLessons.length}</span>
                    <span className="hint">{t('dashboard.weekLessons')}</span>
                </div>
                <div className="card dash-stat dash-stat--ink">
                    <span className="dash-stat-value">{data.lessonsHeld}</span>
                    <span className="hint">{t('dashboard.lessonsHeld')}</span>
                </div>
                <div className="card dash-stat">
                    <span className="dash-stat-value">{data.studentsTotal}</span>
                    <span className="hint">{t('dashboard.students')}</span>
                </div>
            </div>

            <div className="home-columns dash-columns">
                <section className="home-column">
                    <div className="card card-lg dash-card">
                        <h2>{t('dashboard.thisWeek')}</h2>
                        <p className="hint">{weekRange}</p>
                        {data.weekLessons.length === 0 && <p className="dash-empty">{t('dashboard.noLessons')}</p>}
                        <ul className="dash-lessons">
                            {data.weekLessons.map((l) => (
                                <li key={`${l.meetingId}-${l.start}`}>
                                    <div className="dash-lesson-main">
                                        <strong>{l.title}</strong>
                                        <small>
                                            {fmtDay(l.start)}, {fmtTime(l.start)}–{fmtTime(l.end)}
                                        </small>
                                    </div>
                                    {l.percent !== null && l.members !== null ? (
                                        <div className="dash-bar-wrap" title={`${l.attended}/${l.members}`}>
                                            <div className="dash-bar"><span style={{ width: `${l.percent}%` }} /></div>
                                            <small>{l.attended}/{l.members} · {l.percent}%</small>
                                        </div>
                                    ) : (
                                        <span className={`info-chip dash-status-${l.status.toLowerCase()}`}>{t(`dashboard.status.${l.status}`)}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="home-column">
                    <div className="card card-lg dash-card">
                        <h2>{t('dashboard.topStudents')}</h2>
                        <p className="hint">{t('dashboard.topHint')}</p>
                        {data.topStudents.length === 0 && <p className="dash-empty">{t('dashboard.noData')}</p>}
                        <ul className="course-members">
                            {data.topStudents.map((s) => (
                                <li key={s.userId}>
                                    <Avatar size={40} photoUrl={s.photoUrl} displayName={s.displayName || '?'} />
                                    <span className="course-member-name">
                                        <strong>{s.displayName}</strong>
                                        <small>{t('dashboard.studentStats', { lessons: s.lessonsAttended, minutes: s.minutes })}</small>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}

// Старе посилання на окрему сторінку дашборду веде на вкладку курсу.
export function DashboardPage() {
    const { courseId = '' } = useParams<{ courseId: string }>()
    return <Navigate to={`/courses/${courseId}?tab=dashboard`} replace />
}
