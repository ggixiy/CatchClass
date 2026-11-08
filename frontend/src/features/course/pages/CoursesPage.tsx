import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { Modal } from '@/shared/ui/Modal'
import { Course, createCourse, joinCourse, listCourses } from '../api/courseApi'

// Список курсів користувача: свої (як викладача) і ті, до яких приєднався за кодом.
export function CoursesPage() {
    const { t } = useI18n()
    const navigate = useNavigate()
    const [courses, setCourses] = useState<Course[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [code, setCode] = useState('')
    const [joinError, setJoinError] = useState<string | null>(null)

    useEffect(() => {
        listCourses().then(setCourses).catch(() => setError(t('courses.loadError')))
    }, [])

    async function handleCreate(e: FormEvent) {
        e.preventDefault()
        setError(null)
        try {
            const course = await createCourse({ title, description })
            navigate(`/courses/${course.id}`)
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('courses.createError'))
        }
    }

    async function handleJoin(e: FormEvent) {
        e.preventDefault()
        setJoinError(null)
        try {
            const course = await joinCourse(code)
            navigate(`/courses/${course.id}`)
        } catch (err) {
            setJoinError(err instanceof ApiError ? err.message : t('courses.joinError'))
        }
    }

    const mine = courses?.filter((c) => c.owner) ?? []
    const joined = courses?.filter((c) => !c.owner) ?? []

    function renderList(list: Course[]) {
        return (
            <ul className="course-list">
                {list.map((c) => (
                    <li key={c.id}>
                        <Link to={`/courses/${c.id}`} className="course-card">
                            <strong>{c.title}</strong>
                            {c.description && <span className="course-card-desc">{c.description}</span>}
                            <span className="course-card-meta">
                                {c.owner ? t('courses.membersCount', { count: c.memberCount }) : t('courses.teacher', { name: c.ownerName })}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <main className="page-wide">
            <div className="home-header">
                <h1>{t('courses.title')}</h1>
                <button type="button" className="btn-primary schedule-cta" onClick={() => setShowCreate(true)}>{t('courses.create')}</button>
            </div>
            {error && <p className="error">{error}</p>}

            <div className="home-columns">
                <section className="home-column">
                    <div className="card card-lg">
                        <h2>{t('courses.mine')}</h2>
                        {courses && mine.length === 0 && <p className="hint">{t('courses.mineEmpty')}</p>}
                        {renderList(mine)}
                    </div>
                    <div className="card card-lg">
                        <h2>{t('courses.joined')}</h2>
                        {courses && joined.length === 0 && <p className="hint">{t('courses.joinedEmpty')}</p>}
                        {renderList(joined)}
                    </div>
                </section>

                <section className="home-column">
                    <div className="card join-card card-lg">
                        <form onSubmit={handleJoin} className="stacked-form">
                            <h2>{t('courses.joinTitle')}</h2>
                            {joinError && <p className="error">{joinError}</p>}
                            <label className="field-full">
                                {t('courses.codeLabel')}
                                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} required />
                            </label>
                            <button type="submit" className="btn-primary btn-block field-full">{t('courses.joinSubmit')}</button>
                        </form>
                    </div>
                </section>
            </div>

            {showCreate && (
                <Modal title={t('courses.create')} onClose={() => setShowCreate(false)}>
                    <form onSubmit={handleCreate} className="stacked-form">
                        <label className="field-full">
                            {t('courses.nameLabel')}
                            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
                        </label>
                        <label className="field-full">
                            {t('courses.descriptionLabel')}
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">{t('common.save')}</button>
                            <button type="button" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </main>
    )
}
