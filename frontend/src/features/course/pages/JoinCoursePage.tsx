import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/http'
import { useI18n } from '@/shared/i18n/I18nContext'
import { joinCourse } from '../api/courseApi'

// Посилання-запрошення /join-course/<код>: приєднує до курсу й відкриває його сторінку.
export function JoinCoursePage() {
    const { t } = useI18n()
    const { code = '' } = useParams<{ code: string }>()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        joinCourse(code)
            .then((course) => navigate(`/courses/${course.id}`, { replace: true }))
            .catch((err) => {
                if (err instanceof ApiError && err.problem.status === 401) {
                    navigate('/login')
                } else {
                    setError(err instanceof ApiError ? err.message : t('courses.joinError'))
                }
            })
    }, [code])

    return (
        <main className="page">
            {error ? <p className="error">{error}</p> : <p>{t('common.loading')}</p>}
            {error && <button type="button" onClick={() => navigate('/courses')}>{t('courses.title')}</button>}
        </main>
    )
}
