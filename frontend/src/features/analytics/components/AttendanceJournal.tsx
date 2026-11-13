import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/shared/i18n/I18nContext'
import { AttendanceJournal as Journal, getAttendanceJournal, JournalStudent } from '../api/analyticsApi'

type Period = 30 | 90 | 120
type Sort = 'name' | 'attendance'

interface Row {
    student: JournalStudent
    attended: number
    minutes: number
    percent: number | null
    lastVisit: string | null
    visits: Array<{ key: string; title: string; start: string; minutes: number }>
}

// Журнал відвідуваності курсу (для викладача): зведення по студентах з відсотком, хвилинами й останнім відвідуванням.
// Деталі по кожному заняттю розгортаються по кліку на студента, тож таблиця не росте разом з кількістю занять.
export function AttendanceJournal({ courseId }: { courseId: string; courseTitle?: string }) {
    const { t, locale } = useI18n()
    const tag = locale === 'uk' ? 'uk-UA' : 'en-GB'
    const [journal, setJournal] = useState<Journal | null>(null)
    const [period, setPeriod] = useState<Period>(30)
    const [sort, setSort] = useState<Sort>('name')
    const [open, setOpen] = useState<string | null>(null)

    useEffect(() => {
        getAttendanceJournal(courseId).then(setJournal).catch(() => setJournal({ lessons: [], students: [] }))
    }, [courseId])

    const view = useMemo(() => {
        if (!journal) return null
        const since = Date.now() - period * 24 * 3600 * 1000
        // індекси занять, що потрапляють у вибраний період
        const idx = journal.lessons.map((l, i) => ({ l, i })).filter(({ l }) => new Date(l.start).getTime() >= since)
        const rows: Row[] = journal.students.map((s) => {
            const visits = idx.map(({ l, i }) => ({ key: `${l.meetingId}-${l.start}`, title: l.title, start: l.start, minutes: s.minutes[i] ?? 0 }))
            const attended = visits.filter((v) => v.minutes > 0).length
            const last = [...visits].reverse().find((v) => v.minutes > 0)
            return {
                student: s,
                attended,
                minutes: visits.reduce((sum, v) => sum + v.minutes, 0),
                percent: idx.length > 0 ? Math.round((attended * 100) / idx.length) : null,
                lastVisit: last ? last.start : null,
                visits: [...visits].reverse(), // найновіші заняття першими
            }
        })
        const sorted = [...rows].sort((a, b) => sort === 'attendance'
            ? (b.percent ?? -1) - (a.percent ?? -1) || a.student.displayName.localeCompare(b.student.displayName)
            : a.student.displayName.localeCompare(b.student.displayName, undefined, { sensitivity: 'base' }))
        const withData = rows.filter((r) => r.percent !== null)
        const average = withData.length > 0 ? Math.round(withData.reduce((sum, r) => sum + (r.percent ?? 0), 0) / withData.length) : null
        return { lessons: idx.length, rows: sorted, average }
    }, [journal, period, sort])

    if (!journal || !view) return null
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(tag, { day: 'numeric', month: 'short' })
    const fmtFull = (iso: string) => new Date(iso).toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'long' })

    return (
        <div className="card card-lg jr">
            <div className="jr-head">
                <div>
                    <h2>{t('journal.title')}</h2>
                    <p className="hint">{t('journal.hint')}</p>
                </div>
                <div className="jr-segment" role="group" aria-label={t('journal.period')}>
                    {([30, 90, 120] as Period[]).map((p) => (
                        <button key={p} type="button" className={period === p ? 'is-active' : ''} onClick={() => setPeriod(p)}>
                            {t(`journal.period${p}`)}
                        </button>
                    ))}
                </div>
            </div>

            {view.lessons === 0 || view.rows.length === 0 ? (
                <p className="hint">{t('journal.empty')}</p>
            ) : (
                <>
                    <div className="jr-summary">
                        <span><strong>{view.lessons}</strong> {t('journal.lessonsHeld')}</span>
                        <span><strong>{view.average !== null ? `${view.average}%` : '—'}</strong> {t('journal.average')}</span>
                        <button type="button" className="jr-sort" onClick={() => setSort(sort === 'name' ? 'attendance' : 'name')}>
                            {sort === 'name' ? t('journal.sortByAttendance') : t('journal.sortByName')}
                        </button>
                    </div>

                    <ul className="jr-list">
                        {view.rows.map((r) => {
                            const isOpen = open === r.student.userId
                            const low = r.percent !== null && r.percent < 50
                            return (
                                <li key={r.student.userId} className={isOpen ? 'is-open' : undefined}>
                                    <button type="button" className="jr-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.student.userId)}>
                                        <span className="jr-name">
                                            <strong>{r.student.displayName}</strong>
                                            <small>{r.student.email}</small>
                                        </span>
                                        <span className="jr-count">{r.attended}/{view.lessons}</span>
                                        <span className="jr-bar" title={r.percent !== null ? `${r.percent}%` : ''}>
                                            <span className={low ? 'is-low' : undefined} style={{ width: `${r.percent ?? 0}%` }} />
                                        </span>
                                        <span className={`jr-percent${low ? ' is-low' : ''}`}>{r.percent !== null ? `${r.percent}%` : '—'}</span>
                                        <span className="jr-meta">{r.minutes} {t('journal.min')}</span>
                                        <span className="jr-meta jr-last">{r.lastVisit ? fmtDate(r.lastVisit) : t('journal.never')}</span>
                                        <span className="jr-chevron" aria-hidden="true">›</span>
                                    </button>
                                    {isOpen && (
                                        <ul className="jr-details">
                                            {r.visits.map((v) => (
                                                <li key={v.key}>
                                                    <span className={`jr-mark${v.minutes > 0 ? ' is-yes' : ''}`}>{v.minutes > 0 ? '+' : '–'}</span>
                                                    <span className="jr-lesson">{fmtFull(v.start)} · {v.title}</span>
                                                    <small>{v.minutes > 0 ? `${v.minutes} ${t('journal.min')}` : t('journal.absent')}</small>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </div>
    )
}
